import { cache } from 'react';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type SyncEmployeeInput = {
  userId: string;
  primaryEmail: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export type EmployeeRole = {
  id: string;
  code: string;
  name: string;
  app: 'cms' | 'emp';
  is_system: boolean;
  routes: string[];
};

type RolePermissionRow = {
  route: string;
};

type RoleWithPermissionsRow = {
  id: string;
  code: string;
  name: string;
  app: string;
  is_system: boolean;
  role_permissions: RolePermissionRow[];
};

type EmployeeRoleRow = {
  roles: RoleWithPermissionsRow | RoleWithPermissionsRow[] | null;
};

type EmployeeWithRolesRow = {
  id: string;
  full_name: string | null;
  email: string;
  is_active: boolean;
  employee_roles: EmployeeRoleRow[];
};

export type SyncedEmployee = {
  id: string;
  full_name: string | null;
  email: string;
  is_active: boolean;
  roles: EmployeeRole[];
};

const employeeSelectColumns =
  'id, full_name, email, is_active, employee_roles!employee_roles_employee_id_fkey(roles(id, code, name, app, is_system, role_permissions(route)))';

function normalizeRoleRow(value: RoleWithPermissionsRow | RoleWithPermissionsRow[] | null): RoleWithPermissionsRow | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function mapRoleRow(raw: RoleWithPermissionsRow): EmployeeRole {
  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    app: raw.app as 'cms' | 'emp',
    is_system: raw.is_system,
    routes: (raw.role_permissions ?? []).map((p) => p.route)
  };
}

function mapEmployeeRow(row: EmployeeWithRolesRow): SyncedEmployee {
  const roles: EmployeeRole[] = [];
  for (const er of row.employee_roles ?? []) {
    const raw = normalizeRoleRow(er.roles);
    if (raw) roles.push(mapRoleRow(raw));
  }
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    is_active: row.is_active,
    roles
  };
}

async function updateEmployeeById(id: string, input: SyncEmployeeInput): Promise<SyncedEmployee> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .schema('presence')
    .from('employees')
    .update({
      auth_user_id: input.userId,
      email: input.primaryEmail,
      full_name: input.fullName,
      avatar_url: input.avatarUrl
    })
    .eq('id', id)
    .select(employeeSelectColumns)
    .single<EmployeeWithRolesRow>();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to sync employee data');
  }

  return mapEmployeeRow(data);
}

async function assignDefaultRole(employeeId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const roleResult = await supabase
    .schema('presence')
    .from('roles')
    .select('id')
    .eq('code', 'EMPLOYEE')
    .single<{ id: string }>();

  if (roleResult.error || !roleResult.data) {
    throw new Error(roleResult.error?.message ?? 'EMPLOYEE role not found');
  }

  await supabase
    .schema('presence')
    .from('employee_roles')
    .insert({ employee_id: employeeId, role_id: roleResult.data.id, assigned_by: null })
    .throwOnError();
}

export const syncEmployee = cache(async function syncEmployee(input: SyncEmployeeInput): Promise<SyncedEmployee> {
  const supabase = createSupabaseAdminClient();

  const byAuthUserResult = await supabase
    .schema('presence')
    .from('employees')
    .select('id')
    .eq('auth_user_id', input.userId)
    .maybeSingle<{ id: string }>();

  if (byAuthUserResult.error) {
    throw new Error(byAuthUserResult.error.message);
  }

  if (byAuthUserResult.data) {
    return updateEmployeeById(byAuthUserResult.data.id, input);
  }

  const byEmailResult = await supabase
    .schema('presence')
    .from('employees')
    .select('id')
    .eq('email', input.primaryEmail)
    .maybeSingle<{ id: string }>();

  if (byEmailResult.error) {
    throw new Error(byEmailResult.error.message);
  }

  if (byEmailResult.data) {
    return updateEmployeeById(byEmailResult.data.id, input);
  }

  // New employee — insert then auto-assign EMPLOYEE role
  const insertResult = await supabase
    .schema('presence')
    .from('employees')
    .insert({
      auth_user_id: input.userId,
      email: input.primaryEmail,
      full_name: input.fullName,
      avatar_url: input.avatarUrl
    })
    .select('id')
    .single<{ id: string }>();

  if (insertResult.data) {
    await assignDefaultRole(insertResult.data.id);
    return updateEmployeeById(insertResult.data.id, input);
  }

  if (!insertResult.error) {
    throw new Error('Failed to sync employee data');
  }

  // Race condition: another request inserted the same email
  if (insertResult.error.code === '23505') {
    const fallbackByEmailResult = await supabase
      .schema('presence')
      .from('employees')
      .select('id')
      .eq('email', input.primaryEmail)
      .maybeSingle<{ id: string }>();

    if (fallbackByEmailResult.error || !fallbackByEmailResult.data) {
      throw new Error(fallbackByEmailResult.error?.message ?? insertResult.error.message);
    }

    return updateEmployeeById(fallbackByEmailResult.data.id, input);
  }

  throw new Error(insertResult.error.message);
});

// ---------------------------------------------------------------------------
// Authorization helpers
// ---------------------------------------------------------------------------

export function hasAccessToEmp(roles: EmployeeRole[]): boolean {
  return roles.some((r) => r.app === 'emp');
}

export function hasRouteAccess(roles: EmployeeRole[], route: string): boolean {
  return roles.some((r) => r.app === 'emp' && r.routes.includes(route));
}

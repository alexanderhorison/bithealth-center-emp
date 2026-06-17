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
  is_system: boolean;
};

type EmployeeWithRoleRow = {
  id: string;
  full_name: string | null;
  email: string;
  is_active: boolean;
  role_id: string;
  roles: EmployeeRole | EmployeeRole[] | null;
};

export type SyncedEmployee = {
  id: string;
  full_name: string | null;
  email: string;
  is_active: boolean;
  role_id: string;
  role: EmployeeRole | null;
};

const employeeSelectColumns = 'id, full_name, email, is_active, role_id, roles!employees_role_id_fkey(id, code, name, is_system)';

function normalizeRole(value: EmployeeRole | EmployeeRole[] | null): EmployeeRole | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function mapEmployeeRow(row: EmployeeWithRoleRow): SyncedEmployee {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    is_active: row.is_active,
    role_id: row.role_id,
    role: normalizeRole(row.roles)
  };
}

async function findEmployeeByUser(userId: string, email: string): Promise<SyncedEmployee | null> {
  const supabase = createSupabaseAdminClient();

  const byUserIdResult = await supabase
    .schema('presence')
    .from('employees')
    .select(employeeSelectColumns)
    .eq('auth_user_id', userId)
    .maybeSingle<EmployeeWithRoleRow>();

  if (byUserIdResult.error) {
    throw new Error(byUserIdResult.error.message);
  }

  if (byUserIdResult.data) {
    return mapEmployeeRow(byUserIdResult.data);
  }

  const byEmailResult = await supabase
    .schema('presence')
    .from('employees')
    .select(employeeSelectColumns)
    .eq('email', email)
    .maybeSingle<EmployeeWithRoleRow>();

  if (byEmailResult.error) {
    throw new Error(byEmailResult.error.message);
  }

  return byEmailResult.data ? mapEmployeeRow(byEmailResult.data) : null;
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
    .single<EmployeeWithRoleRow>();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to sync employee data');
  }

  return mapEmployeeRow(data);
}

export async function syncEmployee(input: SyncEmployeeInput): Promise<SyncedEmployee> {
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

  const insertResult = await supabase
    .schema('presence')
    .from('employees')
    .insert({
      auth_user_id: input.userId,
      email: input.primaryEmail,
      full_name: input.fullName,
      avatar_url: input.avatarUrl
    })
    .select(employeeSelectColumns)
    .single<EmployeeWithRoleRow>();

  if (insertResult.data) {
    return mapEmployeeRow(insertResult.data);
  }

  if (!insertResult.error) {
    throw new Error('Failed to sync employee data');
  }

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
}

export async function findEmployeeRoleByUser(userId: string, email: string): Promise<EmployeeRole | null> {
  const employee = await findEmployeeByUser(userId, email);
  return employee?.role ?? null;
}

import { createClient, type User } from '@supabase/supabase-js';

import { getServerEnv } from '@/lib/env';
import { hasAccessToEmp, type EmployeeRole } from '@/lib/employee/sync';

export const employeeAccessTokenCookieName = 'bh_employee_at';
export const employeeRefreshTokenCookieName = 'bh_employee_rt';

const accessTokenMaxAge = 60 * 60;
const refreshTokenMaxAge = 60 * 60 * 24 * 30;

export type AuthenticatedEmployeeUser = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  roles: EmployeeRole[];
};

function getStringMetadataValue(metadata: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function isAllowedEmployeeEmail(email: string): boolean {
  const domain = getServerEnv().COMPANY_EMAIL_DOMAIN.trim().toLowerCase();

  if (!domain) {
    return true;
  }

  return email.toLowerCase().endsWith(`@${domain}`);
}

export function mapSupabaseUser(user: User): Omit<AuthenticatedEmployeeUser, 'roles'> | null {
  if (!user.email) {
    return null;
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = getStringMetadataValue(metadata, 'full_name') ?? getStringMetadataValue(metadata, 'name');
  const avatarUrl = getStringMetadataValue(metadata, 'avatar_url') ?? getStringMetadataValue(metadata, 'picture');

  return {
    id: user.id,
    email: user.email,
    fullName,
    avatarUrl
  };
}

export function createSupabaseAuthClient() {
  const env = getServerEnv();

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function createSupabaseServiceClient() {
  const env = getServerEnv();

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

type RolePermissionRow = { route: string };
type RoleWithPermissionsRow = {
  id: string;
  code: string;
  name: string;
  app: string;
  is_system: boolean;
  role_permissions: RolePermissionRow[];
};
type EmployeeRoleJoinRow = {
  roles: RoleWithPermissionsRow | RoleWithPermissionsRow[] | null;
};
type EmployeeStatusRow = {
  is_active: boolean;
  employee_roles: EmployeeRoleJoinRow[];
};

function normalizeRoleRow(v: RoleWithPermissionsRow | RoleWithPermissionsRow[] | null): RoleWithPermissionsRow | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
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

const employeeStatusSelect =
  'is_active, employee_roles!employee_roles_employee_id_fkey(roles(id, code, name, app, is_system, role_permissions(route)))';

async function getEmployeeStatus(
  userId: string,
  email: string
): Promise<{ isActive: boolean; roles: EmployeeRole[] } | null> {
  const supabase = createSupabaseServiceClient();

  const byUserIdResult = await supabase
    .schema('presence')
    .from('employees')
    .select(employeeStatusSelect)
    .eq('auth_user_id', userId)
    .maybeSingle<EmployeeStatusRow>();

  const row = byUserIdResult.error ? null : byUserIdResult.data;

  if (!row) {
    const byEmailResult = await supabase
      .schema('presence')
      .from('employees')
      .select(employeeStatusSelect)
      .eq('email', email)
      .maybeSingle<EmployeeStatusRow>();

    if (byEmailResult.error || !byEmailResult.data) return null;

    const roles = (byEmailResult.data.employee_roles ?? [])
      .map((er) => normalizeRoleRow(er.roles))
      .filter((r): r is RoleWithPermissionsRow => r !== null)
      .map(mapRoleRow);

    return { isActive: byEmailResult.data.is_active, roles };
  }

  const roles = (row.employee_roles ?? [])
    .map((er) => normalizeRoleRow(er.roles))
    .filter((r): r is RoleWithPermissionsRow => r !== null)
    .map(mapRoleRow);

  return { isActive: row.is_active, roles };
}

async function resolveEmployeeUser(
  base: Omit<AuthenticatedEmployeeUser, 'roles'>
): Promise<AuthenticatedEmployeeUser | null> {
  const status = await getEmployeeStatus(base.id, base.email);

  // Not in DB yet — allow through if domain matches (syncEmployee will run on first load)
  if (!status) {
    if (!isAllowedEmployeeEmail(base.email)) return null;
    return { ...base, roles: [] };
  }

  // Inactive employees are always denied
  if (!status.isActive) return null;

  // Active + company email = allow
  if (isAllowedEmployeeEmail(base.email)) {
    return { ...base, roles: status.roles };
  }

  // Active + has any emp role = allow (non-domain override)
  if (hasAccessToEmp(status.roles)) {
    return { ...base, roles: status.roles };
  }

  return null;
}

export async function getEmployeeUserFromAccessToken(token: string): Promise<AuthenticatedEmployeeUser | null> {
  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  const mapped = mapSupabaseUser(data.user);
  if (!mapped) return null;

  return resolveEmployeeUser(mapped);
}

export async function refreshEmployeeSession(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedEmployeeUser;
} | null> {
  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken
  });

  if (error || !data.session?.access_token || !data.session.refresh_token || !data.user) {
    return null;
  }

  const mapped = mapSupabaseUser(data.user);
  if (!mapped) return null;

  const user = await resolveEmployeeUser(mapped);
  if (!user) return null;

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user
  };
}

export function getEmployeeAuthCookieConfig(): {
  accessToken: { name: string; maxAge: number };
  refreshToken: { name: string; maxAge: number };
  options: { httpOnly: boolean; secure: boolean; sameSite: 'lax'; path: string };
} {
  return {
    accessToken: { name: employeeAccessTokenCookieName, maxAge: accessTokenMaxAge },
    refreshToken: { name: employeeRefreshTokenCookieName, maxAge: refreshTokenMaxAge },
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    }
  };
}

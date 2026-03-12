import { createClient, type User } from '@supabase/supabase-js';

import { getServerEnv } from '@/lib/env';

export const employeeAccessTokenCookieName = 'bh_employee_at';
export const employeeRefreshTokenCookieName = 'bh_employee_rt';

const accessTokenMaxAge = 60 * 60;
const refreshTokenMaxAge = 60 * 60 * 24 * 30;

export type AuthenticatedEmployeeUser = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
};

type EmployeeStatus = {
  isActive: boolean;
  roleCode: string | null;
};

type RoleRow = {
  code: string;
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

export function mapSupabaseUser(user: User): AuthenticatedEmployeeUser | null {
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

function normalizeRoleCode(roles: RoleRow | RoleRow[] | null | undefined): string | null {
  const row = Array.isArray(roles) ? roles[0] : roles;
  return row?.code ?? null;
}

async function getEmployeeStatus(userId: string, email: string): Promise<EmployeeStatus | null> {
  const supabase = createSupabaseServiceClient();

  const byUserIdResult = await supabase
    .schema('presence')
    .from('employees')
    .select('is_active, roles!employees_role_id_fkey(code)')
    .eq('auth_user_id', userId)
    .maybeSingle<{ is_active: boolean; roles: RoleRow | RoleRow[] | null }>();

  if (!byUserIdResult.error && byUserIdResult.data) {
    return {
      isActive: byUserIdResult.data.is_active,
      roleCode: normalizeRoleCode(byUserIdResult.data.roles)
    };
  }

  const byEmailResult = await supabase
    .schema('presence')
    .from('employees')
    .select('is_active, roles!employees_role_id_fkey(code)')
    .eq('email', email)
    .maybeSingle<{ is_active: boolean; roles: RoleRow | RoleRow[] | null }>();

  if (!byEmailResult.error && byEmailResult.data) {
    return {
      isActive: byEmailResult.data.is_active,
      roleCode: normalizeRoleCode(byEmailResult.data.roles)
    };
  }

  return null;
}

async function isAllowedEmployeeUser(user: AuthenticatedEmployeeUser): Promise<boolean> {
  const status = await getEmployeeStatus(user.id, user.email);

  // Not in DB yet — allow through if domain check passes (will sync on first Server Action)
  if (!status) {
    return isAllowedEmployeeEmail(user.email);
  }

  // Inactive employees are always denied, regardless of domain or role
  if (!status.isActive) {
    return false;
  }

  // Active + company email domain = allow
  if (isAllowedEmployeeEmail(user.email)) {
    return true;
  }

  // Active + ADMIN role = allow (non-domain override)
  return status.roleCode === 'ADMIN';
}

export async function getEmployeeUserFromAccessToken(token: string): Promise<AuthenticatedEmployeeUser | null> {
  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  const mapped = mapSupabaseUser(data.user);

  if (!mapped || !(await isAllowedEmployeeUser(mapped))) {
    return null;
  }

  return mapped;
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

  if (!mapped || !(await isAllowedEmployeeUser(mapped))) {
    return null;
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: mapped
  };
}

export function getEmployeeAuthCookieConfig(): {
  accessToken: {
    name: string;
    maxAge: number;
  };
  refreshToken: {
    name: string;
    maxAge: number;
  };
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax';
    path: string;
  };
} {
  return {
    accessToken: {
      name: employeeAccessTokenCookieName,
      maxAge: accessTokenMaxAge
    },
    refreshToken: {
      name: employeeRefreshTokenCookieName,
      maxAge: refreshTokenMaxAge
    },
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    }
  };
}

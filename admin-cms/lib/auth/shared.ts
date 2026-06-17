import { createClient, type User } from '@supabase/supabase-js';

import { getServerEnv } from '@/lib/env';
import { findEmployeeRoleByUser, type EmployeeRole } from '@/lib/employee/sync';

export const adminAccessTokenCookieName = 'bh_admin_at';
export const adminRefreshTokenCookieName = 'bh_admin_rt';

const accessTokenMaxAge = 60 * 60;
const refreshTokenMaxAge = 60 * 60 * 24 * 30;

export type AuthenticatedAdminUser = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: EmployeeRole;
};

type AuthenticatedBaseUser = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
};

function getStringMetadataValue(metadata: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function isAuthorizedAdmin(user: AuthenticatedAdminUser): boolean {
  return user.role.code === 'ADMIN';
}

export function mapSupabaseUser(user: User): AuthenticatedBaseUser | null {
  if (!user.email) {
    return null;
  }

  const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = getStringMetadataValue(userMetadata, 'full_name') ?? getStringMetadataValue(userMetadata, 'name');
  const avatarUrl = getStringMetadataValue(userMetadata, 'avatar_url') ?? getStringMetadataValue(userMetadata, 'picture');

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

export async function getAdminUserFromAccessToken(token: string): Promise<AuthenticatedAdminUser | null> {
  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  const mapped = mapSupabaseUser(data.user);

  if (!mapped) {
    return null;
  }

  const role = await findEmployeeRoleByUser(mapped.id, mapped.email);

  if (!role) {
    return null;
  }

  return {
    ...mapped,
    role
  };
}

export async function refreshAdminSession(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedAdminUser;
} | null> {
  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken
  });

  if (error || !data.session?.access_token || !data.session.refresh_token || !data.user) {
    return null;
  }

  const mapped = mapSupabaseUser(data.user);
  if (!mapped) {
    return null;
  }

  const role = await findEmployeeRoleByUser(mapped.id, mapped.email);

  if (!role) {
    return null;
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: {
      ...mapped,
      role
    }
  };
}

export function getAdminAuthCookieConfig(): {
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
      name: adminAccessTokenCookieName,
      maxAge: accessTokenMaxAge
    },
    refreshToken: {
      name: adminRefreshTokenCookieName,
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

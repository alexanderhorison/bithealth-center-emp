import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  adminAccessTokenCookieName,
  adminRefreshTokenCookieName,
  getAdminUserFromAccessToken,
  refreshAdminSession,
  type AuthenticatedAdminUser
} from '@/lib/auth/shared';

export async function getCurrentAdminUser(): Promise<AuthenticatedAdminUser | null> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get(adminAccessTokenCookieName)?.value;

  if (!accessToken) {
    return null;
  }

  const directUser = await getAdminUserFromAccessToken(accessToken);

  if (directUser) {
    return directUser;
  }

  const refreshToken = cookieStore.get(adminRefreshTokenCookieName)?.value;

  if (!refreshToken) {
    return null;
  }

  const refreshed = await refreshAdminSession(refreshToken);

  if (!refreshed) {
    return null;
  }

  return refreshed.user;
}

export async function requireAdminUser(): Promise<AuthenticatedAdminUser> {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect('/');
  }

  return user;
}

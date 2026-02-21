import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  employeeAccessTokenCookieName,
  employeeRefreshTokenCookieName,
  getEmployeeUserFromAccessToken,
  refreshEmployeeSession,
  type AuthenticatedEmployeeUser
} from '@/lib/auth/shared';

export async function getCurrentEmployeeUser(): Promise<AuthenticatedEmployeeUser | null> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get(employeeAccessTokenCookieName)?.value;

  if (!accessToken) {
    return null;
  }

  const directUser = await getEmployeeUserFromAccessToken(accessToken);

  if (directUser) {
    return directUser;
  }

  const refreshToken = cookieStore.get(employeeRefreshTokenCookieName)?.value;

  if (!refreshToken) {
    return null;
  }

  const refreshed = await refreshEmployeeSession(refreshToken);

  if (!refreshed) {
    return null;
  }

  return refreshed.user;
}

export async function requireEmployeeUser(): Promise<AuthenticatedEmployeeUser> {
  const user = await getCurrentEmployeeUser();

  if (!user) {
    redirect('/');
  }

  return user;
}

import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  employeeAccessTokenCookieName,
  getEmployeeUserFromAccessToken,
  type AuthenticatedEmployeeUser
} from '@/lib/auth/shared';

// Middleware handles token refresh + cookie rewrite on every request.
// By the time a Server Component runs, the access token is already valid or
// the user has been redirected to /. No refresh fallback is needed here.
export async function getCurrentEmployeeUser(): Promise<AuthenticatedEmployeeUser | null> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get(employeeAccessTokenCookieName)?.value;

  if (!accessToken) {
    return null;
  }

  return getEmployeeUserFromAccessToken(accessToken);
}

export async function requireEmployeeUser(): Promise<AuthenticatedEmployeeUser> {
  const user = await getCurrentEmployeeUser();

  if (!user) {
    redirect('/');
  }

  return user;
}

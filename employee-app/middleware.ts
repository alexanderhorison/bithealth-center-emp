import { NextResponse, type NextRequest } from 'next/server';

import {
  employeeAccessTokenCookieName,
  employeeRefreshTokenCookieName,
  getEmployeeAuthCookieConfig,
  getEmployeeUserFromAccessToken,
  refreshEmployeeSession
} from '@/lib/auth/shared';
import { hasRouteAccess } from '@/lib/employee/sync';

// Map pathname prefix → route key (must match role_permissions.route values)
const ROUTE_MAP: Array<{ prefix: string; key: string }> = [
  { prefix: '/presence', key: 'presence' },
  { prefix: '/account-request', key: 'account-request' }
];

function getRouteKey(pathname: string): string | null {
  const match = ROUTE_MAP.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  return match?.key ?? null;
}

const publicPaths = ['/', '/auth/callback', '/api/auth/session', '/api/auth/sign-out', '/not-authorized'];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function createRedirectResponse(request: NextRequest, targetPath: string) {
  const target = new URL(targetPath, request.url);
  return NextResponse.redirect(target);
}

function clearAuthCookies(response: NextResponse) {
  const cookieConfig = getEmployeeAuthCookieConfig();

  response.cookies.set(cookieConfig.accessToken.name, '', {
    ...cookieConfig.options,
    maxAge: 0
  });
  response.cookies.set(cookieConfig.refreshToken.name, '', {
    ...cookieConfig.options,
    maxAge: 0
  });
}

function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  const cookieConfig = getEmployeeAuthCookieConfig();

  response.cookies.set(cookieConfig.accessToken.name, accessToken, {
    ...cookieConfig.options,
    maxAge: cookieConfig.accessToken.maxAge
  });

  if (refreshToken.length > 0) {
    response.cookies.set(cookieConfig.refreshToken.name, refreshToken, {
      ...cookieConfig.options,
      maxAge: cookieConfig.refreshToken.maxAge
    });
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/auth/') || pathname === '/auth/callback') {
    return NextResponse.next();
  }

  const isPublicRoute = isPublicPath(pathname);

  const accessToken = request.cookies.get(employeeAccessTokenCookieName)?.value;
  const refreshToken = request.cookies.get(employeeRefreshTokenCookieName)?.value;

  if (!accessToken) {
    if (isPublicRoute) {
      return NextResponse.next();
    }

    return createRedirectResponse(request, '/');
  }

  let user = await getEmployeeUserFromAccessToken(accessToken);
  let activeAccessToken = accessToken;
  let activeRefreshToken = refreshToken ?? '';

  if (!user && refreshToken) {
    const refreshed = await refreshEmployeeSession(refreshToken);

    if (refreshed) {
      user = refreshed.user;
      activeAccessToken = refreshed.accessToken;
      activeRefreshToken = refreshed.refreshToken;
    }
  }

  if (!user) {
    if (isPublicRoute) {
      const response = NextResponse.next();
      clearAuthCookies(response);
      return response;
    }

    const response = createRedirectResponse(request, '/');
    clearAuthCookies(response);
    return response;
  }

  if (pathname === '/') {
    const response = createRedirectResponse(request, '/modules');
    setAuthCookies(response, activeAccessToken, activeRefreshToken);
    return response;
  }

  // Per-route access check
  const routeKey = getRouteKey(pathname);
  if (routeKey && !hasRouteAccess(user.roles, routeKey)) {
    const response = createRedirectResponse(request, '/not-authorized');
    setAuthCookies(response, activeAccessToken, activeRefreshToken);
    return response;
  }

  const response = NextResponse.next();
  setAuthCookies(response, activeAccessToken, activeRefreshToken);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)']
};

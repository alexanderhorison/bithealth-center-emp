import { type NextRequest, NextResponse } from 'next/server';

import { getEmployeeAuthCookieConfig } from '@/lib/auth/shared';

function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // No origin header = server-side call, allow
  const host = request.headers.get('host') ?? '';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return origin === `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const cookieConfig = getEmployeeAuthCookieConfig();
  const response = NextResponse.json({ success: true });

  response.cookies.set(cookieConfig.accessToken.name, '', {
    ...cookieConfig.options,
    maxAge: 0
  });
  response.cookies.set(cookieConfig.refreshToken.name, '', {
    ...cookieConfig.options,
    maxAge: 0
  });
  response.cookies.set('bh_employee_user', '', {
    ...cookieConfig.options,
    maxAge: 0
  });

  return response;
}

import { NextResponse } from 'next/server';

import { getEmployeeAuthCookieConfig } from '@/lib/auth/shared';

export async function POST() {
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

  return response;
}

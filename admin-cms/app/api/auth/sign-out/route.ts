import { NextResponse } from 'next/server';

import { getAdminAuthCookieConfig } from '@/lib/auth/shared';

export async function POST() {
  const cookieConfig = getAdminAuthCookieConfig();
  const response = NextResponse.json({ success: true });

  response.cookies.set(cookieConfig.accessToken.name, '', {
    ...cookieConfig.options,
    maxAge: 0
  });
  response.cookies.set(cookieConfig.refreshToken.name, '', {
    ...cookieConfig.options,
    maxAge: 0
  });
  response.cookies.set('bh_admin_user', '', {
    ...cookieConfig.options,
    maxAge: 0
  });

  return response;
}

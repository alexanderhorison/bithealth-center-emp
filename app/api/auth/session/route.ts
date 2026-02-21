import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createSupabaseAuthClient,
  getEmployeeAuthCookieConfig,
  isAllowedEmployeeEmail,
  mapSupabaseUser
} from '@/lib/auth/shared';

const payloadSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1)
});

export async function POST(request: Request) {
  const payload = payloadSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ message: 'Invalid session payload' }, { status: 400 });
  }

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(payload.data.accessToken);

  if (error || !data.user) {
    return NextResponse.json({ message: 'Invalid access token' }, { status: 401 });
  }

  const user = mapSupabaseUser(data.user);

  if (!user) {
    return NextResponse.json({ message: 'User profile is incomplete' }, { status: 401 });
  }

  if (!isAllowedEmployeeEmail(user.email)) {
    return NextResponse.json({ message: 'Email domain is not allowed' }, { status: 403 });
  }

  const cookieConfig = getEmployeeAuthCookieConfig();
  const response = NextResponse.json({ success: true });

  response.cookies.set(cookieConfig.accessToken.name, payload.data.accessToken, {
    ...cookieConfig.options,
    maxAge: cookieConfig.accessToken.maxAge
  });
  response.cookies.set(cookieConfig.refreshToken.name, payload.data.refreshToken, {
    ...cookieConfig.options,
    maxAge: cookieConfig.refreshToken.maxAge
  });

  return response;
}

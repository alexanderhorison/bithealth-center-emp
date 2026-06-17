import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createSupabaseAuthClient,
  getAdminAuthCookieConfig,
  isAuthorizedAdmin,
  mapSupabaseUser
} from '@/lib/auth/shared';
import { syncEmployee } from '@/lib/employee/sync';

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

  const mapped = mapSupabaseUser(data.user);

  if (!mapped) {
    return NextResponse.json({ message: 'User profile is incomplete' }, { status: 401 });
  }

  const employee = await syncEmployee({
    userId: mapped.id,
    primaryEmail: mapped.email,
    fullName: mapped.fullName,
    avatarUrl: mapped.avatarUrl
  });

  if (!employee.role || !isAuthorizedAdmin({ ...mapped, role: employee.role })) {
    return NextResponse.json({ message: 'Admin access is required' }, { status: 403 });
  }

  const cookieConfig = getAdminAuthCookieConfig();
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

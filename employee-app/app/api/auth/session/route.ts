import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createSupabaseAuthClient,
  getEmployeeAuthCookieConfig,
  isAllowedEmployeeEmail,
  mapSupabaseUser
} from '@/lib/auth/shared';
import { syncEmployee, getEmployeeRolesByAuthUser } from '@/lib/employee/sync';

const payloadSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1)
});

function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // No origin header = server-side call, allow
  const host = request.headers.get('host') ?? '';
  // Accept both http and https — covers local (http) and production (https)
  return origin === `http://${host}` || origin === `https://${host}`;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const payload = payloadSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ message: 'Invalid session payload' }, { status: 400 });
  }

  const supabase = createSupabaseAuthClient();
  console.time('session-auth-getUser');
  const { data, error } = await supabase.auth.getUser(payload.data.accessToken);
  console.timeEnd('session-auth-getUser');

  if (error || !data.user) {
    return NextResponse.json({ message: 'Invalid access token' }, { status: 401 });
  }

  const user = mapSupabaseUser(data.user);

  if (!user) {
    return NextResponse.json({ message: 'User profile is incomplete' }, { status: 401 });
  }

  // Fast pre-check: if user exists in DB and has no employee roles, reject before expensive syncEmployee
  console.time('session-precheck-roles');
  const existingRoles = await getEmployeeRolesByAuthUser(user.id);
  console.timeEnd('session-precheck-roles');
  if (existingRoles !== null && !existingRoles.some((r) => r.app === 'emp')) {
    return NextResponse.json({ message: 'Unauthorized: No employee roles assigned' }, { status: 403 });
  }

  console.time('session-syncEmployee');
  const employee = await syncEmployee({
    userId: user.id,
    primaryEmail: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl
  });
  console.timeEnd('session-syncEmployee');

  if (!employee.is_active) {
    return NextResponse.json({ message: 'Account is inactive' }, { status: 403 });
  }

  if (!isAllowedEmployeeEmail(user.email) && !employee.roles.some((r) => r.app === 'emp')) {
    return NextResponse.json({ message: 'Email domain is not allowed' }, { status: 403 });
  }

  if (!employee.roles.some((r) => r.app === 'emp')) {
    return NextResponse.json({ message: 'Unauthorized: No employee roles assigned' }, { status: 403 });
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

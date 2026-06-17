'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createAccessRequestSchema, type CreateAccessRequestInput } from '@/lib/validations/access-request';
import { requireEmployeeUser } from '@/lib/auth/server';
import { syncEmployee } from '@/lib/employee/sync';

type ActionResult = {
  success: boolean;
  message: string;
};

// GAP-ACCT-03: Normalize target URL before storage.
// new URL() already lowercases scheme + host. We also strip trailing slashes from non-root paths
// so that identical URLs with different formatting don't create separate records.
function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    if (url.pathname !== '/' && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
  } catch {
    return raw;
  }
}

export async function createAccessRequestAction(input: CreateAccessRequestInput): Promise<ActionResult> {
  const user = await requireEmployeeUser();
  const parsed = createAccessRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid request payload'
    };
  }

  const employee = await syncEmployee({
    userId: user.id,
    primaryEmail: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl
  });

  const supabase = createSupabaseAdminClient();
  const payload = parsed.data;

  // GAP-ACCT-03: Normalize before duplicate check and insert.
  const normalizedUrl = payload.targetUrl ? normalizeUrl(payload.targetUrl) : '';

  // GAP-ACCT-01: Prevent duplicate PENDING requests for the same resource.
  const { data: existing } = await supabase
    .schema('presence')
    .from('access_requests')
    .select('id')
    .eq('employee_id', employee.id)
    .eq('provider', payload.provider)
    .eq('request_type', payload.requestType)
    .eq('target_url', normalizedUrl)
    .eq('status', 'PENDING')
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      message: 'You already have a pending request for this resource.'
    };
  }

  const { error } = await supabase.schema('presence').from('access_requests').insert({
    employee_id: employee.id,
    provider: payload.provider,
    request_type: payload.requestType,
    target_url: normalizedUrl,
    display_name: payload.displayName,
    justification: payload.justification,
    extra_info: payload.additionalInfo || null
  });

  if (error) {
    return {
      success: false,
      message: error.message
    };
  }

  revalidatePath('/account-request');

  return {
    success: true,
    message: 'Request submitted'
  };
}

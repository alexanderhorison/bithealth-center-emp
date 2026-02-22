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

  const { error } = await supabase.schema('presence').from('access_requests').insert({
    employee_id: employee.id,
    provider: payload.provider,
    request_type: payload.requestType,
    target_url: payload.targetUrl,
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

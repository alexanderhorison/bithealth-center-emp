'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { deletePresenceSchema, type DeletePresenceInput } from '@/lib/validations/presence';

type ActionResult = {
  success: boolean;
  message: string;
};

export async function deletePresenceAction(input: DeletePresenceInput): Promise<ActionResult> {
  await requireAdmin();

  const parsed = deletePresenceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid payload'
    };
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .schema('presence')
    .from('presences')
    .delete()
    .eq('id', parsed.data.id);

  if (error) {
    return {
      success: false,
      message: error.message
    };
  }

  revalidatePath('/presences');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: 'Presence record deleted'
  };
}

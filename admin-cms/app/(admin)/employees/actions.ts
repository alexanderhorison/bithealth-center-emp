'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  saveEmployeeSchema,
  toggleEmployeeSchema,
  type SaveEmployeeInput,
  type ToggleEmployeeInput
} from '@/lib/validations/employee';

type ActionResult = {
  success: boolean;
  message: string;
};

export async function saveEmployeeAction(input: SaveEmployeeInput): Promise<ActionResult> {
  await requireAdmin();

  const parsed = saveEmployeeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid employee payload'
    };
  }

  const supabase = createSupabaseAdminClient();
  const values = parsed.data;

  if (values.id) {
    const { error } = await supabase
      .schema('presence')
      .from('employees')
      .update({
        email: values.email,
        full_name: values.fullName,
        auth_user_id: values.authUserId || null,
        is_active: values.isActive,
        role_id: values.roleId
      })
      .eq('id', values.id);

    if (error) {
      return {
        success: false,
        message: error.message
      };
    }
  } else {
    const { error } = await supabase
      .schema('presence')
      .from('employees')
      .upsert(
        {
          email: values.email,
          full_name: values.fullName,
          auth_user_id: values.authUserId || null,
          is_active: values.isActive,
          role_id: values.roleId
        },
        {
          onConflict: 'email'
        }
      );

    if (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  revalidatePath('/employees');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: 'Employee saved successfully'
  };
}

export async function toggleEmployeeStatusAction(input: ToggleEmployeeInput): Promise<ActionResult> {
  await requireAdmin();

  const parsed = toggleEmployeeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid toggle payload'
    };
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .schema('presence')
    .from('employees')
    .update({ is_active: parsed.data.isActive })
    .eq('id', parsed.data.id);

  if (error) {
    return {
      success: false,
      message: error.message
    };
  }

  revalidatePath('/employees');

  return {
    success: true,
    message: 'Employee status updated'
  };
}

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
  const admin = await requireAdmin();

  const parsed = saveEmployeeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid employee payload'
    };
  }

  const supabase = createSupabaseAdminClient();
  const values = parsed.data;

  // Resolve admin's employee record for assigned_by
  const { data: adminEmployee } = await supabase
    .schema('presence')
    .from('employees')
    .select('id')
    .eq('auth_user_id', admin.id)
    .maybeSingle<{ id: string }>();

  const assignedBy = adminEmployee?.id ?? null;

  if (values.id) {
    // Update employee profile
    const { error: updateError } = await supabase
      .schema('presence')
      .from('employees')
      .update({
        email: values.email,
        full_name: values.fullName,
        auth_user_id: values.authUserId || null,
        is_active: values.isActive
      })
      .eq('id', values.id);

    if (updateError) {
      return { success: false, message: updateError.message };
    }

    // Sync employee_roles: delete all existing, insert new
    const { error: deleteError } = await supabase
      .schema('presence')
      .from('employee_roles')
      .delete()
      .eq('employee_id', values.id);

    if (deleteError) {
      return { success: false, message: deleteError.message };
    }

    const { error: insertError } = await supabase
      .schema('presence')
      .from('employee_roles')
      .insert(
        values.roleIds.map((roleId) => ({
          employee_id: values.id!,
          role_id: roleId,
          assigned_by: assignedBy
        }))
      );

    if (insertError) {
      return { success: false, message: insertError.message };
    }
  } else {
    // Upsert employee (insert or update on email conflict)
    const { data: employeeData, error: upsertError } = await supabase
      .schema('presence')
      .from('employees')
      .upsert(
        {
          email: values.email,
          full_name: values.fullName,
          auth_user_id: values.authUserId || null,
          is_active: values.isActive
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single<{ id: string }>();

    if (upsertError || !employeeData) {
      return { success: false, message: upsertError?.message ?? 'Failed to create employee' };
    }

    const employeeId = employeeData.id;

    // Replace roles
    const { error: deleteError } = await supabase
      .schema('presence')
      .from('employee_roles')
      .delete()
      .eq('employee_id', employeeId);

    if (deleteError) {
      return { success: false, message: deleteError.message };
    }

    const { error: insertError } = await supabase
      .schema('presence')
      .from('employee_roles')
      .insert(
        values.roleIds.map((roleId) => ({
          employee_id: employeeId,
          role_id: roleId,
          assigned_by: assignedBy
        }))
      );

    if (insertError) {
      return { success: false, message: insertError.message };
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

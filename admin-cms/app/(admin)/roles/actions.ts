'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  deleteRoleSchema,
  saveRoleSchema,
  type DeleteRoleInput,
  type SaveRoleInput
} from '@/lib/validations/role';

type ActionResult = {
  success: boolean;
  message: string;
};

export async function saveRoleAction(input: SaveRoleInput): Promise<ActionResult> {
  await requireAdmin();

  const parsed = saveRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid role payload' };
  }

  const supabase = createSupabaseAdminClient();
  const values = parsed.data;

  if (values.id) {
    // Fetch existing to guard system roles
    const { data: existingRole, error: existingRoleError } = await supabase
      .schema('presence')
      .from('roles')
      .select('is_system, code')
      .eq('id', values.id)
      .maybeSingle<{ is_system: boolean; code: string }>();

    if (existingRoleError) return { success: false, message: existingRoleError.message };
    if (!existingRole) return { success: false, message: 'Role not found' };

    // Update all fields — no restrictions on system roles
    const { error: updateError } = await supabase
      .schema('presence')
      .from('roles')
      .update({ code: values.code, name: values.name, description: values.description || null, app: values.app })
      .eq('id', values.id);

    if (updateError) return { success: false, message: updateError.message };

    // Sync permissions
    await supabase.schema('presence').from('role_permissions').delete().eq('role_id', values.id);

    if (values.routes.length > 0) {
      const { error: permError } = await supabase
        .schema('presence')
        .from('role_permissions')
        .insert(values.routes.map((route) => ({ role_id: values.id!, route })));

      if (permError) return { success: false, message: permError.message };
    }
  } else {
    // Insert new role
    const { data: newRole, error: insertError } = await supabase
      .schema('presence')
      .from('roles')
      .insert({ code: values.code, name: values.name, description: values.description || null, is_system: false, app: values.app })
      .select('id')
      .single<{ id: string }>();

    if (insertError || !newRole) return { success: false, message: insertError?.message ?? 'Failed to create role' };

    // Insert permissions
    if (values.routes.length > 0) {
      const { error: permError } = await supabase
        .schema('presence')
        .from('role_permissions')
        .insert(values.routes.map((route) => ({ role_id: newRole.id, route })));

      if (permError) return { success: false, message: permError.message };
    }
  }

  revalidatePath('/roles');
  revalidatePath('/employees');

  return { success: true, message: 'Role saved successfully' };
}

export async function deleteRoleAction(input: DeleteRoleInput): Promise<ActionResult> {
  await requireAdmin();

  const parsed = deleteRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid role payload' };
  }

  const supabase = createSupabaseAdminClient();

  const { data: role, error: roleError } = await supabase
    .schema('presence')
    .from('roles')
    .select('id, is_system')
    .eq('id', parsed.data.id)
    .maybeSingle<{ id: string; is_system: boolean }>();

  if (roleError) return { success: false, message: roleError.message };
  if (!role) return { success: false, message: 'Role not found' };
  if (role.is_system) return { success: false, message: 'System role cannot be deleted' };

  // Check if still assigned to any employees
  const { count, error: usageError } = await supabase
    .schema('presence')
    .from('employee_roles')
    .select('id', { count: 'exact', head: true })
    .eq('role_id', role.id);

  if (usageError) return { success: false, message: usageError.message };
  if ((count ?? 0) > 0) return { success: false, message: 'Role is still assigned to employees' };

  const { error } = await supabase.schema('presence').from('roles').delete().eq('id', role.id);
  if (error) return { success: false, message: error.message };

  revalidatePath('/roles');
  revalidatePath('/employees');

  return { success: true, message: 'Role deleted successfully' };
}

// ---------------------------------------------------------------------------
// Employee role management actions
// ---------------------------------------------------------------------------

export async function assignRoleToEmployeeAction(employeeId: string, roleId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { canManageRoles } = await import('@/lib/employee/sync');

  if (!canManageRoles(admin.roles)) {
    return { success: false, message: 'Not authorized to manage roles' };
  }

  const supabase = createSupabaseAdminClient();

  // Resolve admin's employee record for assigned_by
  const { data: adminEmployee } = await supabase
    .schema('presence')
    .from('employees')
    .select('id')
    .eq('auth_user_id', admin.id)
    .maybeSingle<{ id: string }>();

  const { error } = await supabase
    .schema('presence')
    .from('employee_roles')
    .insert({ employee_id: employeeId, role_id: roleId, assigned_by: adminEmployee?.id ?? null });

  if (error) return { success: false, message: error.code === '23505' ? 'Role already assigned' : error.message };

  revalidatePath(`/employees/${employeeId}/edit`);
  return { success: true, message: 'Role assigned' };
}

export async function removeRoleFromEmployeeAction(employeeId: string, roleId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { canManageRoles } = await import('@/lib/employee/sync');

  if (!canManageRoles(admin.roles)) {
    return { success: false, message: 'Not authorized to manage roles' };
  }

  const supabase = createSupabaseAdminClient();

  // Prevent removing the last role
  const { count } = await supabase
    .schema('presence')
    .from('employee_roles')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', employeeId);

  if ((count ?? 0) <= 1) {
    return { success: false, message: 'Employee must have at least one role' };
  }

  const { error } = await supabase
    .schema('presence')
    .from('employee_roles')
    .delete()
    .eq('employee_id', employeeId)
    .eq('role_id', roleId);

  if (error) return { success: false, message: error.message };

  revalidatePath(`/employees/${employeeId}/edit`);
  return { success: true, message: 'Role removed' };
}

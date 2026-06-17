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
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid role payload'
    };
  }

  const supabase = createSupabaseAdminClient();
  const values = parsed.data;

  if (values.id) {
    const { data: existingRole, error: existingRoleError } = await supabase
      .schema('presence')
      .from('roles')
      .select('is_system, code')
      .eq('id', values.id)
      .maybeSingle<{ is_system: boolean; code: string }>();

    if (existingRoleError) {
      return {
        success: false,
        message: existingRoleError.message
      };
    }

    if (!existingRole) {
      return {
        success: false,
        message: 'Role not found'
      };
    }

    const payload =
      existingRole.is_system && existingRole.code !== values.code
        ? {
            name: values.name,
            description: values.description || null
          }
        : {
            code: values.code,
            name: values.name,
            description: values.description || null
          };

    const { error } = await supabase.schema('presence').from('roles').update(payload).eq('id', values.id);

    if (error) {
      return {
        success: false,
        message: error.message
      };
    }
  } else {
    const { error } = await supabase
      .schema('presence')
      .from('roles')
      .insert({
        code: values.code,
        name: values.name,
        description: values.description || null,
        is_system: false
      });

    if (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  revalidatePath('/roles');
  revalidatePath('/employees');

  return {
    success: true,
    message: 'Role saved successfully'
  };
}

export async function deleteRoleAction(input: DeleteRoleInput): Promise<ActionResult> {
  await requireAdmin();

  const parsed = deleteRoleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid role payload'
    };
  }

  const supabase = createSupabaseAdminClient();

  const { data: role, error: roleError } = await supabase
    .schema('presence')
    .from('roles')
    .select('id, is_system')
    .eq('id', parsed.data.id)
    .maybeSingle<{ id: string; is_system: boolean }>();

  if (roleError) {
    return {
      success: false,
      message: roleError.message
    };
  }

  if (!role) {
    return {
      success: false,
      message: 'Role not found'
    };
  }

  if (role.is_system) {
    return {
      success: false,
      message: 'System role cannot be deleted'
    };
  }

  const { count, error: usageError } = await supabase
    .schema('presence')
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('role_id', role.id);

  if (usageError) {
    return {
      success: false,
      message: usageError.message
    };
  }

  if ((count ?? 0) > 0) {
    return {
      success: false,
      message: 'Role is still assigned to employees'
    };
  }

  const { error } = await supabase.schema('presence').from('roles').delete().eq('id', role.id);

  if (error) {
    return {
      success: false,
      message: error.message
    };
  }

  revalidatePath('/roles');
  revalidatePath('/employees');

  return {
    success: true,
    message: 'Role deleted successfully'
  };
}

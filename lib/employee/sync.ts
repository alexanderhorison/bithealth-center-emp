import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type SyncEmployeeInput = {
  userId: string;
  primaryEmail: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export type SyncedEmployee = {
  id: string;
  full_name: string | null;
  email: string;
  is_active: boolean;
};

const employeeSelectColumns = 'id, full_name, email, is_active';

async function updateEmployeeById(id: string, input: SyncEmployeeInput): Promise<SyncedEmployee> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .schema('presence')
    .from('employees')
    .update({
      clerk_user_id: input.userId,
      email: input.primaryEmail,
      full_name: input.fullName,
      avatar_url: input.avatarUrl
    })
    .eq('id', id)
    .select(employeeSelectColumns)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to sync employee data');
  }

  return data;
}

export async function syncEmployee(input: SyncEmployeeInput): Promise<SyncedEmployee> {
  const supabase = createSupabaseAdminClient();

  const byAuthUserResult = await supabase
    .schema('presence')
    .from('employees')
    .select('id')
    .eq('clerk_user_id', input.userId)
    .maybeSingle<{ id: string }>();

  if (byAuthUserResult.error) {
    throw new Error(byAuthUserResult.error.message);
  }

  if (byAuthUserResult.data) {
    return updateEmployeeById(byAuthUserResult.data.id, input);
  }

  const byEmailResult = await supabase
    .schema('presence')
    .from('employees')
    .select('id')
    .eq('email', input.primaryEmail)
    .maybeSingle<{ id: string }>();

  if (byEmailResult.error) {
    throw new Error(byEmailResult.error.message);
  }

  if (byEmailResult.data) {
    return updateEmployeeById(byEmailResult.data.id, input);
  }

  const insertResult = await supabase
    .schema('presence')
    .from('employees')
    .insert({
      clerk_user_id: input.userId,
      email: input.primaryEmail,
      full_name: input.fullName,
      avatar_url: input.avatarUrl
    })
    .select(employeeSelectColumns)
    .single();

  if (insertResult.data) {
    return insertResult.data;
  }

  if (!insertResult.error) {
    throw new Error('Failed to sync employee data');
  }

  if (insertResult.error.code === '23505') {
    const fallbackByEmailResult = await supabase
      .schema('presence')
      .from('employees')
      .select('id')
      .eq('email', input.primaryEmail)
      .maybeSingle<{ id: string }>();

    if (fallbackByEmailResult.error || !fallbackByEmailResult.data) {
      throw new Error(fallbackByEmailResult.error?.message ?? insertResult.error.message);
    }

    return updateEmployeeById(fallbackByEmailResult.data.id, input);
  }

  throw new Error(insertResult.error.message);
}

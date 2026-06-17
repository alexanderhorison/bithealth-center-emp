import { notFound } from 'next/navigation';
import { z } from 'zod';

import { EmployeeForm } from '@/app/(admin)/employees/_components/employee-form';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type PageProps = {
  params: {
    id: string;
  };
};

const employeeIdSchema = z.string().uuid();

export default async function EditEmployeePage({ params }: PageProps) {
  await requireAdmin();

  const parsedId = employeeIdSchema.safeParse(params.id);

  if (!parsedId.success) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const [{ data, error }, { data: roleData, error: roleError }, { data: assignedData, error: assignedError }] =
    await Promise.all([
      supabase
        .schema('presence')
        .from('employees')
        .select('id, full_name, email, auth_user_id, is_active')
        .eq('id', parsedId.data)
        .maybeSingle(),
      supabase
        .schema('presence')
        .from('roles')
        .select('id, code, name, app')
        .order('app', { ascending: true })
        .order('name', { ascending: true }),
      supabase
        .schema('presence')
        .from('employee_roles')
        .select('role_id')
        .eq('employee_id', parsedId.data)
    ]);

  if (error) throw new Error(error.message);
  if (roleError) throw new Error(roleError.message);
  if (assignedError) throw new Error(assignedError.message);
  if (!data) notFound();

  const roles = (roleData ?? []) as Array<{ id: string; code: string; name: string; app: string }>;
  const assignedRoleIds = (assignedData ?? []).map((r: { role_id: string }) => r.role_id);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Employee</h1>
        <p className="text-sm text-muted-foreground">Update employee profile and activation status.</p>
      </div>

      <EmployeeForm
        mode="edit"
        initialValues={{
          id: data.id,
          email: data.email,
          fullName: data.full_name ?? '',
          authUserId: data.auth_user_id ?? '',
          isActive: data.is_active,
          roleIds: assignedRoleIds
        }}
        roles={roles}
      />
    </main>
  );
}

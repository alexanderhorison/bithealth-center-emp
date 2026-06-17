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
  const [{ data, error }, { data: roleData, error: roleError }] = await Promise.all([
    supabase
      .schema('presence')
      .from('employees')
      .select('id, full_name, email, auth_user_id, is_active, role_id')
      .eq('id', parsedId.data)
      .maybeSingle(),
    supabase
      .schema('presence')
      .from('roles')
      .select('id, code, name')
      .order('is_system', { ascending: false })
      .order('name', { ascending: true })
  ]);

  if (error) {
    throw new Error(error.message);
  }

  if (roleError) {
    throw new Error(roleError.message);
  }

  if (!data) {
    notFound();
  }

  const roles = roleData ?? [];

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
          roleId: data.role_id
        }}
        roles={roles}
      />
    </main>
  );
}

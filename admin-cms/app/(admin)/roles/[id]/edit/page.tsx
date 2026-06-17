import { notFound } from 'next/navigation';
import { z } from 'zod';

import { RoleForm } from '@/app/(admin)/roles/_components/role-form';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type PageProps = {
  params: {
    id: string;
  };
};

const roleIdSchema = z.string().uuid();

export default async function EditRolePage({ params }: PageProps) {
  await requireAdmin();

  const parsedId = roleIdSchema.safeParse(params.id);
  if (!parsedId.success) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .schema('presence')
    .from('roles')
    .select('id, code, name, description, is_system, app, role_permissions(route)')
    .eq('id', parsedId.data)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  const routes = (data.role_permissions ?? []).map((p: { route: string }) => p.route);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Role</h1>
        <p className="text-sm text-muted-foreground">Update role master data used by employee records.</p>
      </div>

      <RoleForm
        mode="edit"
        isSystem={data.is_system}
        initialValues={{
          id: data.id,
          code: data.code,
          name: data.name,
          description: data.description ?? '',
          app: data.app as 'cms' | 'emp',
          routes
        }}
      />
    </main>
  );
}

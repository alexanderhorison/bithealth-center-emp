import { RoleForm } from '@/app/(admin)/roles/_components/role-form';
import { requireAdmin } from '@/lib/auth';

export default async function NewRolePage() {
  await requireAdmin();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Role</h1>
        <p className="text-sm text-muted-foreground">Create role master data for employee assignment.</p>
      </div>

      <RoleForm mode="create" />
    </main>
  );
}

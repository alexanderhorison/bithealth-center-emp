import { AdminShell } from '@/app/(admin)/_components/admin-shell';

import { requireAdmin } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await requireAdmin();

  return <AdminShell user={adminUser}>{children}</AdminShell>;
}

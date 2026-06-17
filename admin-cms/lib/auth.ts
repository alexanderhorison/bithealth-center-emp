import { redirect } from 'next/navigation';

import { isAuthorizedAdmin } from '@/lib/auth/shared';
import { requireAdminUser } from '@/lib/auth/server';
import { type EmployeeRole } from '@/lib/employee/sync';

export type AdminUser = {
  id: string;
  email: string;
  fullName: string | null;
  roles: EmployeeRole[];
};

export async function requireAdmin(): Promise<AdminUser> {
  const user = await requireAdminUser();

  if (!isAuthorizedAdmin(user)) {
    redirect('/not-authorized');
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles
  };
}

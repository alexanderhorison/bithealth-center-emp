import { redirect } from 'next/navigation';

import { isAuthorizedAdmin } from '@/lib/auth/shared';
import { requireAdminUser } from '@/lib/auth/server';

type AdminUser = {
  id: string;
  email: string;
  fullName: string | null;
};

export async function requireAdmin(): Promise<AdminUser> {
  const user = await requireAdminUser();

  if (!isAuthorizedAdmin(user)) {
    redirect('/not-authorized');
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName
  };
}

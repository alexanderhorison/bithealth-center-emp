'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth';
import { AccessRequestService } from '@/lib/access-requests/service';
import { type AdminUpdateAccessRequestInput } from '@/lib/validations/access-request';

type ActionResult = {
  success: boolean;
  message: string;
};

export async function updateAccessRequestStatusAction(input: AdminUpdateAccessRequestInput): Promise<ActionResult> {
  const admin = await requireAdmin();

  const accessRequestService = new AccessRequestService();
  try {
    await accessRequestService.updateStatus(input, admin.email);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update request'
    };
  }

  revalidatePath('/access-requests');
  revalidatePath(`/access-requests/${input.id}`);

  return {
    success: true,
    message: 'Request updated'
  };
}

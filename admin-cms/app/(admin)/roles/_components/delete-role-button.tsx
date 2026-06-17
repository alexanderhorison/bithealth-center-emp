'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';

import { deleteRoleAction } from '@/app/(admin)/roles/actions';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/confirm-modal';

type DeleteRoleButtonProps = {
  roleId: string;
  roleName: string;
  disabled?: boolean;
};

export function DeleteRoleButton({ roleId, roleName, disabled = false }: DeleteRoleButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => deleteRoleAction({ id: roleId }),
    onSuccess: () => {
      setConfirmOpen(false);
      router.refresh();
    }
  });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-8 border-red-300 px-3 text-red-700 hover:bg-red-50"
        onClick={() => setConfirmOpen(true)}
        disabled={disabled || mutation.isPending}
        aria-label="Delete role"
      >
        {mutation.isPending ? 'Deleting...' : 'Delete'}
      </Button>

      <ConfirmModal
        open={confirmOpen}
        title={`Delete role "${roleName}"?`}
        description="This action cannot be undone."
        confirmText="Delete"
        confirmVariant="destructive"
        pending={mutation.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => mutation.mutate()}
      />
    </>
  );
}

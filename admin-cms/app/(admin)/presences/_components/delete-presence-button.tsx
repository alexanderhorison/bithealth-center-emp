'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';

import { deletePresenceAction } from '@/app/(admin)/presences/actions';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/confirm-modal';

type DeletePresenceButtonProps = {
  presenceId: string;
};

export function DeletePresenceButton({ presenceId }: DeletePresenceButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (input: { id: string }) => deletePresenceAction(input),
    onSuccess: () => {
      setConfirmOpen(false);
      router.refresh();
    }
  });

  return (
    <>
      <Button
        variant="destructive"
        className="h-8 px-3"
        onClick={() => setConfirmOpen(true)}
        disabled={mutation.isPending}
        aria-label="Delete presence record"
      >
        Delete
      </Button>

      <ConfirmModal
        open={confirmOpen}
        title="Delete presence record?"
        description="This action cannot be undone."
        confirmText="Delete"
        confirmVariant="destructive"
        pending={mutation.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => mutation.mutate({ id: presenceId })}
      />
    </>
  );
}

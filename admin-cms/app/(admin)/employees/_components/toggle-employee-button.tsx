'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';

import { toggleEmployeeStatusAction } from '@/app/(admin)/employees/actions';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/confirm-modal';

type ToggleEmployeeButtonProps = {
  employeeId: string;
  isActive: boolean;
};

export function ToggleEmployeeButton({ employeeId, isActive }: ToggleEmployeeButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const nextStatus = !isActive;

  const mutation = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) => toggleEmployeeStatusAction(input),
    onSuccess: () => {
      setConfirmOpen(false);
      router.refresh();
    }
  });

  return (
    <>
      <Button
        variant={isActive ? 'destructive' : 'default'}
        className="h-8 px-3"
        onClick={() => setConfirmOpen(true)}
        disabled={mutation.isPending}
        aria-label={isActive ? 'Disable employee account' : 'Enable employee account'}
      >
        {isActive ? 'Disable' : 'Enable'}
      </Button>

      <ConfirmModal
        open={confirmOpen}
        title={nextStatus ? 'Enable employee?' : 'Disable employee?'}
        description={
          nextStatus
            ? 'This employee will be able to submit presence again.'
            : 'This employee will not be able to submit presence until enabled again.'
        }
        confirmText={nextStatus ? 'Enable' : 'Disable'}
        confirmVariant={nextStatus ? 'default' : 'destructive'}
        pending={mutation.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => mutation.mutate({ id: employeeId, isActive: nextStatus })}
      />
    </>
  );
}

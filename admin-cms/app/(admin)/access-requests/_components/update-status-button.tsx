'use client';

import { useState, useTransition } from 'react';

import { updateAccessRequestStatusAction } from '@/app/(admin)/access-requests/actions';
import { Button } from '@/components/ui/button';
import type { AccessRequestStatus } from '@/lib/access-requests/types';

type Props = {
  requestId: string;
  currentStatus: AccessRequestStatus;
};

export function UpdateStatusButton({ requestId, currentStatus }: Props) {
  const [modal, setModal] = useState<'APPROVED' | 'DENIED' | null>(null);
  const [note, setNote] = useState('');
  const [isPending, startTransition] = useTransition();

  const updateStatus = (status: 'APPROVED' | 'DENIED') => {
    startTransition(async () => {
      await updateAccessRequestStatusAction({
        id: requestId,
        status,
        adminNote: note
      });
      setModal(null);
      setNote('');
    });
  };

  if (currentStatus !== 'PENDING') {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" className="h-10 px-6" onClick={() => setModal('APPROVED')} disabled={isPending}>
        Approve
      </Button>
      <Button variant="destructive" className="h-10 px-6" onClick={() => setModal('DENIED')} disabled={isPending}>
        Deny
      </Button>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-900/40"
            onClick={() => setModal(null)}
            aria-label="Close status modal"
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-stone-300 bg-background p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-stone-900">
              {modal === 'APPROVED' ? 'Approve request' : 'Deny request'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">Add an optional admin note for the requester.</p>
            <textarea
              className="mt-3 w-full rounded-md border border-input bg-background p-2 text-sm"
              placeholder="Optional admin note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModal(null)} disabled={isPending}>
                Cancel
              </Button>
              <Button
                variant={modal === 'APPROVED' ? 'default' : 'destructive'}
                onClick={() => updateStatus(modal)}
                disabled={isPending}
              >
                {isPending ? 'Processing...' : modal === 'APPROVED' ? 'Approve' : 'Deny'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

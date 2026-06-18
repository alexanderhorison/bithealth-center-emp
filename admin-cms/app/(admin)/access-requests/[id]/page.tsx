import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { AccessRequestDetailCard } from '@/app/(admin)/access-requests/[id]/_components/access-request-detail-card';
import { UpdateStatusButton } from '@/app/(admin)/access-requests/_components/update-status-button';
import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/auth';
import { AccessRequestService } from '@/lib/access-requests/service';

type PageProps = {
  params: {
    id: string;
  };
};

export default async function AccessRequestDetailPage({ params }: PageProps) {
  await requireAdmin();

  const accessRequestService = new AccessRequestService();
  const request = await accessRequestService.getById(params.id);

  if (!request) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/access-requests"
          prefetch={false}
          className="inline-flex items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Account Requests
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Request Detail</h1>
          <p className="text-sm text-muted-foreground">{request.display_name}</p>
        </div>
      </div>

      <AccessRequestDetailCard request={request} />

      <div className="flex items-center justify-between gap-3">
        <Link href="/access-requests" prefetch={false}>
          <Button variant="outline" className="h-10 px-6">
            Back
          </Button>
        </Link>
        <div className="flex justify-end">
          <UpdateStatusButton requestId={request.id} currentStatus={request.status} />
        </div>
      </div>
    </main>
  );
}

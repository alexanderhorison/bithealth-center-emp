import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ACCESS_REQUEST_PROVIDER_LABELS,
  ACCESS_REQUEST_STATUS_BADGE_CLASSES,
  ACCESS_REQUEST_TYPE_LABELS
} from '@/lib/access-requests/constants';
import type { AccessRequestRecord } from '@/lib/access-requests/types';
import { cn } from '@/lib/utils';

type AccessRequestDetailCardProps = {
  request: AccessRequestRecord;
};

function formatDateTime(value: string | null): string {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function AccessRequestDetailCard({ request }: AccessRequestDetailCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Information</CardTitle>
        <CardDescription>Review request data and update the approval status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Date" value={formatDateTime(request.created_at)} />
          <InfoItem label="Employee" value={request.employee?.full_name ?? '-'} />
          <InfoItem label="Employee Email" value={request.employee?.email ?? '-'} />
          <InfoItem label="Provider" value={ACCESS_REQUEST_PROVIDER_LABELS[request.provider]} />
          <InfoItem label="Request Type" value={ACCESS_REQUEST_TYPE_LABELS[request.request_type]} />
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.08em] text-zinc-500">Status</p>
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                ACCESS_REQUEST_STATUS_BADGE_CLASSES[request.status]
              )}
            >
              {request.status}
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <InfoBlock label="Target URL">
            {request.target_url ? (
              <Link
                href={request.target_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary underline"
              >
                {request.target_url}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </InfoBlock>

          <InfoBlock label="Resolved At" value={formatDateTime(request.resolved_at)} />
          <InfoBlock label="Justification" value={request.justification} />
          <InfoBlock label="Additional Info" value={request.extra_info ?? '-'} />
          <InfoBlock label="Admin Note" value={request.admin_note ?? '-'} />
          <InfoBlock label="Resolved By" value={request.resolved_by ?? '-'} />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-[0.08em] text-zinc-500">{label}</p>
      <p className="text-sm font-medium text-zinc-900">{value}</p>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  children
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
      <p className="text-xs uppercase tracking-[0.08em] text-zinc-500">{label}</p>
      <div className="mt-1 text-sm text-zinc-900">{children ?? value}</div>
    </div>
  );
}

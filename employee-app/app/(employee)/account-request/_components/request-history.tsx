import Link from 'next/link';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type RequestRow = {
  id: string;
  provider: 'GITHUB' | 'FIGMA';
  request_type: 'REPO_ACCESS' | 'NEW_REPO' | 'FIGMA_FILE' | 'FIGMA_PROJECT';
  target_url: string;
  display_name: string;
  justification: string;
  extra_info: string | null;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  admin_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
};

type RequestHistoryProps = {
  rows: RequestRow[];
  page: number;
  pageSize: number;
  totalCount: number;
};

const providerBadge: Record<RequestRow['provider'], string> = {
  GITHUB: 'bg-black text-white',
  FIGMA: 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white'
};

const statusBadge: Record<RequestRow['status'], string> = {
  PENDING: 'bg-zinc-200 text-zinc-700',
  APPROVED: 'bg-emerald-200 text-emerald-800',
  DENIED: 'bg-red-200 text-red-800'
};

const requestTypeLabel: Record<RequestRow['request_type'], string> = {
  REPO_ACCESS: 'Repo Access',
  NEW_REPO: 'New Repo',
  FIGMA_FILE: 'Figma File',
  FIGMA_PROJECT: 'Figma Project'
};

export function RequestHistory({ rows, page, pageSize, totalCount }: RequestHistoryProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <Card>
      <details className="group">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Recent Requests</CardTitle>
                <CardDescription>Your last requests with status updates.</CardDescription>
              </div>
              <ChevronDown
                className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </div>
          </CardHeader>
        </summary>
        <CardContent className="space-y-3">
          {rows.length === 0 ? <p className="text-sm text-muted-foreground">No requests yet.</p> : null}
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', providerBadge[row.provider])}>
                  {row.provider}
                </span>
                <span className={cn('inline-flex rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700')}>
                  {requestTypeLabel[row.request_type]}
                </span>
                <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', statusBadge[row.status])}>
                  {row.status}
                </span>
                <span className="text-xs text-muted-foreground">Created {new Date(row.created_at).toISOString().slice(0, 10)}</span>
                {row.resolved_at ? (
                  <span className="text-xs text-muted-foreground">
                    Resolved {new Date(row.resolved_at).toISOString().slice(0, 10)}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 text-sm font-semibold text-stone-900">{row.display_name}</div>
              <div className="text-sm">
                {row.target_url ? (
                  <Link href={row.target_url} className="text-primary underline" target="_blank" rel="noreferrer">
                    {row.target_url}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{row.justification}</p>
              {row.extra_info ? <p className="mt-2 text-sm text-stone-800">Additional info: {row.extra_info}</p> : null}
              {row.admin_note ? (
                <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-stone-800">Admin note: {row.admin_note}</p>
              ) : null}
            </div>
          ))}

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              {/* GAP-ACCT-02: Per-page toggle — navigates via URL so the selection is bookmarkable. */}
              <span className="text-xs text-muted-foreground">·</span>
              {([10, 20] as const).map((size) => (
                <Link key={size} href={`/account-request?page=1&pageSize=${size}`} prefetch={false}>
                  <button
                    type="button"
                    aria-label={`Show ${size} per page`}
                    className={cn(
                      'h-7 rounded border px-2 text-xs transition',
                      pageSize === size
                        ? 'border-primary bg-primary/10 font-medium text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-stone-400'
                    )}
                  >
                    {size}
                  </button>
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/account-request?page=${Math.max(1, page - 1)}&pageSize=${pageSize}`} prefetch={false}>
                <Button variant="outline" className="h-8 px-3" disabled={page === 1} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href={`/account-request?page=${Math.min(totalPages, page + 1)}&pageSize=${pageSize}`} prefetch={false}>
                <Button variant="outline" className="h-8 px-3" disabled={page >= totalPages} aria-label="Next page">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </details>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CalendarDays, ChevronDown, UserRound } from 'lucide-react';

import { fetchPresenceHistoryAction } from '@/app/(employee)/presence/actions';
import { HISTORY_PAGE_SIZE, type HistoryPresenceRow } from '@/app/(employee)/presence/_shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const presenceStatusMeta: Record<HistoryPresenceRow['status'], { label: string; className: string }> = {
  PRESENT: { label: 'Present', className: 'bg-emerald-100 text-emerald-800' },
  WFH: { label: 'WFH', className: 'bg-sky-100 text-sky-800' },
  NOT_PRESENT: { label: 'Not Present', className: 'bg-zinc-200 text-zinc-700' },
  GO_TO_CLIENT: { label: 'Go to Client', className: 'bg-amber-100 text-amber-800' }
};

function formatHistoryDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

function formatHistoryTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

type PresenceHistoryProps = {
  initialEntries: HistoryPresenceRow[];
};

export function PresenceHistory({ initialEntries }: PresenceHistoryProps) {
  const [entries, setEntries] = useState(initialEntries);
  // If the initial page is full, there may be more to load.
  const [hasMore, setHasMore] = useState(initialEntries.length === HISTORY_PAGE_SIZE);

  const loadMoreMutation = useMutation({
    mutationFn: () => fetchPresenceHistoryAction(entries.length),
    onSuccess: (newEntries) => {
      setEntries((prev) => [...prev, ...newEntries]);
      setHasMore(newEntries.length === HISTORY_PAGE_SIZE);
    }
  });

  return (
    <Card className="mb-6">
      <details className="group">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Last {entries.length} Entries</CardTitle>
                <CardDescription>Recent submission history. Expand when needed.</CardDescription>
              </div>
              <ChevronDown
                className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </div>
          </CardHeader>
        </summary>
        <CardContent>
          <div className="space-y-3">
            {entries.length ? (
              <>
                {entries.map((presence) => (
                  <div
                    key={`${presence.presence_date}-${presence.updated_at}`}
                    className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-stone-700">
                        <CalendarDays className="h-4 w-4 text-stone-500" aria-hidden="true" />
                        <span>{formatHistoryDate(presence.presence_date)}</span>
                      </div>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                          presenceStatusMeta[presence.status].className
                        )}
                      >
                        {presenceStatusMeta[presence.status].label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-2">
                      <p className="text-xs text-muted-foreground">Date: {presence.presence_date}</p>
                      <p className="text-xs text-muted-foreground">
                        Updated {formatHistoryTime(presence.updated_at)}
                      </p>
                    </div>
                  </div>
                ))}

                {hasMore ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 w-full text-xs"
                    onClick={() => loadMoreMutation.mutate()}
                    disabled={loadMoreMutation.isPending}
                    aria-label="Load more presence history"
                  >
                    {loadMoreMutation.isPending ? 'Loading...' : 'Load more'}
                  </Button>
                ) : null}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center">
                <UserRound className="mx-auto mb-2 h-5 w-5 text-stone-400" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">No history yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </details>
    </Card>
  );
}

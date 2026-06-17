'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ChevronDown, UserRound } from 'lucide-react';

import { fetchPresenceHistoryAction } from '@/app/(employee)/presence/actions';
import { HISTORY_PAGE_SIZE, type HistoryPresenceRow } from '@/app/(employee)/presence/_shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const presenceStatusMeta: Record<
  HistoryPresenceRow['status'],
  { label: string; badgeClass: string; accentClass: string }
> = {
  PRESENT: {
    label: 'Present',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    accentClass: 'bg-emerald-400'
  },
  WFH: {
    label: 'WFH',
    badgeClass: 'bg-sky-100 text-sky-800',
    accentClass: 'bg-sky-400'
  },
  NOT_PRESENT: {
    label: 'Not Present',
    badgeClass: 'bg-zinc-200 text-zinc-700',
    accentClass: 'bg-zinc-400'
  },
  GO_TO_CLIENT: {
    label: 'Go to Client',
    badgeClass: 'bg-amber-100 text-amber-800',
    accentClass: 'bg-amber-400'
  }
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

  // Sync state when the server re-fetches fresh data after submit/update
  useEffect(() => {
    setEntries(initialEntries);
    setHasMore(initialEntries.length === HISTORY_PAGE_SIZE);
  }, [initialEntries]);

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
                {entries.map((presence) => {
                  const meta = presenceStatusMeta[presence.status];
                  return (
                    <div
                      key={`${presence.presence_date}-${presence.updated_at}`}
                      className="flex overflow-hidden rounded-xl border border-stone-200 bg-white"
                    >
                      {/* Left accent bar */}
                      <div className={cn('w-1 shrink-0', meta.accentClass)} />

                      {/* Content */}
                      <div className="flex-1 px-4 py-3">
                        {/* Top row: date + badge */}
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-stone-800">
                            {formatHistoryDate(presence.presence_date)}
                          </span>
                          <span
                            className={cn(
                              'inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                              meta.badgeClass
                            )}
                          >
                            {meta.label}
                          </span>
                        </div>

                        {/* Bottom row: note (if any) + updated time */}
                        <div className="mt-1 flex items-end justify-between gap-3">
                          {presence.note ? (
                            <p className="text-xs text-muted-foreground">{presence.note}</p>
                          ) : (
                            <span />
                          )}
                          <p className="shrink-0 text-xs text-muted-foreground">
                            {formatHistoryTime(presence.updated_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

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

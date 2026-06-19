# Presence History Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revamp `PresenceHistory` from card-per-row to flat divider rows aligned with the MUJI design system.

**Architecture:** Single file change — replace the `<Card>` outer wrapper and per-row card with a plain bordered `<div>` + `border-b` row dividers. Status pills become a colored dot + plain text label. No new files, no new dependencies.

**Tech Stack:** React 18, Next.js 14 App Router, Tailwind CSS, shadcn/ui (Button removed), TanStack Query v5.

## Global Constraints

- No new UI libraries — shadcn/ui primitives only
- No `rounded-xl` or `rounded-full` — use `rounded-sm` or none
- No shadows on cards/panels
- Tailwind semantic tokens (`text-text-primary`, `border-border-subtle`, `surface-card`) preferred over raw stone/zinc where available
- Keep `<details>` / `<summary>` collapsible pattern intact
- Keep all existing logic (mutation, useEffect, formatters) unchanged

---

### Task 1: Rewrite `presence-history.tsx` with flat row design

**Files:**
- Modify: `employee-app/app/(employee)/presence/_components/presence-history.tsx`

**Interfaces:**
- Consumes: `HistoryPresenceRow`, `HISTORY_PAGE_SIZE` from `@/app/(employee)/presence/_shared` (unchanged)
- Consumes: `fetchPresenceHistoryAction` from `@/app/(employee)/presence/actions` (unchanged)
- Produces: `PresenceHistory` component (same export name, same props)

- [ ] **Step 1: Remove unused imports**

Remove `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` from imports. Keep `Button` removed too (replaced with plain button). Final import block:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ChevronDown, UserRound } from 'lucide-react';

import { fetchPresenceHistoryAction } from '@/app/(employee)/presence/actions';
import { HISTORY_PAGE_SIZE, type HistoryPresenceRow } from '@/app/(employee)/presence/_shared';
import { cn } from '@/lib/utils';
```

- [ ] **Step 2: Update `presenceStatusMeta` — drop `badgeClass`, add `textClass`**

```tsx
const presenceStatusMeta: Record<
  HistoryPresenceRow['status'],
  { label: string; textClass: string; accentClass: string }
> = {
  PRESENT: {
    label: 'Present',
    textClass: 'text-brand-600',
    accentClass: 'bg-brand-500'
  },
  WFH: {
    label: 'WFH',
    textClass: 'text-sky-700',
    accentClass: 'bg-sky-400'
  },
  NOT_PRESENT: {
    label: 'Not Present',
    textClass: 'text-zinc-500',
    accentClass: 'bg-zinc-400'
  },
  GO_TO_CLIENT: {
    label: 'Go to Client',
    textClass: 'text-amber-700',
    accentClass: 'bg-amber-400'
  }
};
```

- [ ] **Step 3: Rewrite the JSX return**

Replace the entire `return (...)` block with:

```tsx
  return (
    <div className="mb-6 overflow-hidden rounded-sm border border-border-subtle bg-surface-card">
      <details className="group">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm font-semibold text-text-primary">Recent Entries</span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-text-tertiary transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </div>
        </summary>

        <div>
          {entries.length ? (
            <>
              {entries.map((presence) => {
                const meta = presenceStatusMeta[presence.status];
                return (
                  <div
                    key={`${presence.presence_date}-${presence.updated_at}`}
                    className="flex items-start gap-3 border-t border-border-subtle px-4 py-3"
                  >
                    {/* Status dot */}
                    <div className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', meta.accentClass)} />

                    {/* Left: date + note */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {formatHistoryDate(presence.presence_date)}
                      </p>
                      {presence.note && (
                        <p className="mt-0.5 text-xs text-text-tertiary">{presence.note}</p>
                      )}
                    </div>

                    {/* Right: status label + time */}
                    <div className="shrink-0 text-right">
                      <span className={cn('text-xs font-medium', meta.textClass)}>
                        {meta.label}
                      </span>
                      <p className="mt-0.5 text-xs tabular-nums text-text-secondary">
                        {formatHistoryTime(presence.updated_at)}
                      </p>
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <div className="border-t border-border-subtle px-4 py-2">
                  <button
                    type="button"
                    className="w-full py-1 text-xs text-text-tertiary underline-offset-2 transition-colors hover:text-text-secondary hover:underline disabled:opacity-50"
                    onClick={() => loadMoreMutation.mutate()}
                    disabled={loadMoreMutation.isPending}
                    aria-label="Load more presence history"
                  >
                    {loadMoreMutation.isPending ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="border-t border-border-subtle px-4 py-6 text-center">
              <UserRound className="mx-auto mb-2 h-5 w-5 text-text-tertiary" aria-hidden="true" />
              <p className="text-xs text-text-tertiary">No history yet.</p>
            </div>
          )}
        </div>
      </details>
    </div>
  );
```

- [ ] **Step 4: Verify the file compiles**

```bash
cd "/Users/alexander/Data/Source Code/Bithealth Center/employee-app"
npx tsc --noEmit
```

Expected: no errors. If any, fix type mismatches before continuing.

- [ ] **Step 5: Visual check**

Run the dev server and open the presence page. Verify:
- Section is collapsed by default, expands on click
- Rows show date left, status label + time right
- Colored dot matches status (blue=WFH, amber=Go to Client, orange=Present, gray=Not Present)
- No pill badges, no card borders per row
- Notes render below date when present
- "Load more" appears as plain underline text (not a button)
- Empty state shows icon + "No history yet."

```bash
npm run dev
```

- [ ] **Step 6: Commit**

```bash
cd "/Users/alexander/Data/Source Code/Bithealth Center"
git add employee-app/app/(employee)/presence/_components/presence-history.tsx
git commit -m "feat: revamp presence history to flat row design (MUJI)

- Replace card-per-row with border-b divider rows
- Status dot replaces full-height accent bar
- Plain text label replaces pill badge
- Remove CardHeader/CardContent/Button imports
- Remove description subtitle
- Load more uses plain underline button

Co-Authored-By: Claude <noreply@anthropic.com>"
```

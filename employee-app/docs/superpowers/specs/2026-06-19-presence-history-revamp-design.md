# Presence History Revamp — Design Spec

**Date:** 2026-06-19
**File:** `employee-app/app/(employee)/presence/_components/presence-history.tsx`
**Approach:** Option A — Flat rows

---

## Problem

The current component nests card-per-row inside a Card wrapper, uses `rounded-xl` + `rounded-full` pill badges, and has a `w-1` accent bar — all at odds with the MUJI design system. Visual weight is too high for a secondary/collapsible section.

---

## Design

### Outer wrapper

Replace `<Card>` with a plain `<div>` using `border border-border-subtle bg-surface-card rounded-sm`. No `CardHeader` / `CardContent` imports needed.

The `<details>` / `<summary>` collapsible pattern is kept unchanged.

### Header (summary)

```
Recent Entries                                    ∧
```

- Title: `text-sm font-semibold text-text-primary`
- Remove the `CardDescription` ("Recent submission history. Expand when needed.") — redundant
- Chevron: unchanged (`group-open:rotate-180` transition)
- Padding: `px-4 py-3`

### Row layout

Each row is a `<div>` with `border-b border-border-subtle last:border-b-0 px-4 py-3 flex items-start gap-3`.

```
[dot]  Fri, Jun 19, 2026               WFH · 12:00 PM
       note text (if any)
```

**Left column** (`flex-1`):
- Status dot: `mt-1 h-2 w-2 shrink-0 rounded-full` using `accentClass`
- Date: `text-sm font-medium text-text-primary`
- Note (optional): `text-xs text-text-tertiary` on second line

**Right column** (`shrink-0 text-right`):
- Status label + ` · ` + time, all inline
- Status label: `text-xs font-medium` using new `textClass`
- Time: `text-xs text-text-secondary tabular-nums`

No pill badge. No border per row. No `bg-white` per row.

### Status meta (updated)

| Status | `accentClass` (dot bg) | `textClass` (label) |
|---|---|---|
| PRESENT | `bg-brand-500` | `text-brand-600` |
| WFH | `bg-sky-400` | `text-sky-700` |
| GO_TO_CLIENT | `bg-amber-400` | `text-amber-700` |
| NOT_PRESENT | `bg-zinc-400` | `text-zinc-500` |

Remove `badgeClass` from the meta record — no longer needed.

### Load more

Replace `<Button variant="outline">` with plain text:

```tsx
<button className="w-full py-2 text-xs text-text-tertiary hover:text-text-secondary hover:underline underline-offset-2 transition-colors">
  {loadMoreMutation.isPending ? 'Loading…' : 'Load more'}
</button>
```

### Empty state

Keep existing empty state structure. Update:
- Remove `rounded-xl` → `rounded-sm`
- Keep dashed border + `UserRound` icon

---

## What changes

| Element | Before | After |
|---|---|---|
| Outer wrapper | `<Card>` | plain `<div>` with border |
| Row wrapper | `rounded-xl border bg-white flex` | `border-b flex` (no card) |
| Accent | `w-1` full-height bar | `h-2 w-2` dot |
| Badge | `rounded-full px-2.5 py-0.5` pill | plain text label |
| Header description | visible subtitle | removed |
| Load more | `<Button variant="outline">` | plain underline text |

## What stays unchanged

- `<details>` / `<summary>` toggle mechanism
- Chevron rotate animation
- `presenceStatusMeta` record shape (just drop `badgeClass`, add `textClass`)
- `formatHistoryDate` / `formatHistoryTime` formatters
- `loadMoreMutation` logic
- `useEffect` sync on `initialEntries`
- Empty state icon + message

---

## Files touched

- `employee-app/app/(employee)/presence/_components/presence-history.tsx` — single file change

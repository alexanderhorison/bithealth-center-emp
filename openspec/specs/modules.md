# Spec: Modules (App Home)

> Status: **SHIPPED** — Living spec derived from code analysis.
> Schema: N/A (no DB queries on this page)
> Key files: `app/(employee)/modules/page.tsx`

---

## Overview

The Modules page is the post-login home screen. It displays a grid of available employee modules as clickable cards. Active modules link to their respective routes; planned modules are shown as non-interactive "Coming Soon" placeholders to communicate the product roadmap.

---

## Functional Requirements

### Navigation Hub
1. **FR-MOD-01** — When an authenticated employee visits `/modules`, the system shall display all available modules in a 2-column grid.
2. **FR-MOD-02** — Each active module card shall be a full-card link navigating to its route on click.
3. **FR-MOD-03** — "Coming Soon" module cards shall be rendered as non-interactive (no `<Link>` or `<button>` wrapper).
4. **FR-MOD-04** — The page shall display the employee's name (or email fallback) as a greeting: `Hello, {fullName ?? email}`.
5. **FR-MOD-05** — The page shall include the `UserMenu` component in the header for account actions (sign out, etc.).

### Module Registry (current)
| Module | Status | Route | Description |
|---|---|---|---|
| Presence | Active | `/presence` | Submit your daily status and optional selfie. |
| Account Request | Active | `/account-request` | Request GitHub repo access or Figma access. |
| Leave Request | Coming Soon | — | Plan and submit leave requests. |
| Asset Request | Coming Soon | — | Request tools and equipment from operations. |

---

## Non-Functional Requirements

- **NFR-MOD-01** — The page must be a Server Component (no client-side state needed).
- **NFR-MOD-02** — Auth check via `requireEmployeeUser()` must run server-side before rendering; unauthenticated users are redirected to `/`.
- **NFR-MOD-03** — "Coming Soon" cards must be visually distinct from active cards (dashed border, muted colors, `Coming Soon` badge).

---

## Data Model

No database queries on this page. Data dependencies:
- `requireEmployeeUser()` — returns `{ id, email, fullName, avatarUrl }` from auth session (no DB call for modules listing).

---

## Component Map

```
app/(employee)/modules/
  page.tsx    [server] — auth, render module grid
```

### Data Flow
```
page.tsx (server)
  → requireEmployeeUser()
  → render greeting + 2×2 module grid (2 active links + 2 static placeholders)
```

---

## Visual Design

- Background: `bg-stone-100` (full min-h-screen)
- Active cards: `border-stone-300 bg-stone-50`, hover `border-stone-400`
- Coming Soon cards: `border-dashed border-stone-300 bg-stone-100/70 text-zinc-500`
- Coming Soon badge: `rounded-full border border-stone-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]`
- Module card layout: `CardHeader` (title + description) + `CardContent` ("Open module" + `ArrowRight` icon)

---

## Known Issues / Gap Analysis

- **GAP-MOD-01** ✅ RESOLVED — Added `loading.tsx` (header + 4-card animated skeleton matching modules layout) and `error.tsx` (`'use client'` error boundary with Retry button) to `app/(employee)/modules/`.
- **GAP-MOD-02** — Module list is hard-coded in the component. Adding a new module requires a code change. No CMS or config-driven registry.
- **GAP-MOD-03** — No role-based visibility. All modules (including Coming Soon) are shown to every employee regardless of department or role. Future modules may need RBAC-gated visibility.
- **GAP-MOD-04** — "Coming Soon" modules have no estimated timeline or click-to-notify interaction (e.g., "Notify me when available").

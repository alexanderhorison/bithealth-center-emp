# Tasks: Module Directory (App Home)

> Status: **SHIPPED** — Retrospective SDD artifact.
> All tasks below are completed. Listed in implementation order for reference.

---

## Phase 1 — Infrastructure

*(No infra tasks — this page has no DB dependencies.)*

---

## Phase 2 — Page Implementation

- [frontend] Create route group `app/(employee)/` with shared layout
- [frontend] Create `app/(employee)/layout.tsx` — wraps all employee routes with `AppFooter`
- [frontend] Create `app/(employee)/modules/page.tsx` as a Server Component:
  - Call `requireEmployeeUser()` to enforce auth
  - Derive `displayName = user.fullName ?? user.email`
  - Render greeting header with `displayName` + `UserMenu`
  - Render 2-column grid with 2 active module cards (`<Link>` wrapped) and 2 Coming Soon cards (static)
  - Verification: visiting `/modules` unauthenticated redirects to `/`; authenticated user sees grid
- [frontend] Create `app/(employee)/dashboard/page.tsx` — redirect to `/presence` (canonical entry point)
  - Verification: `/dashboard` redirects to `/presence`

## Phase 3 — Navigation & Polish

- [frontend] Verify active card hover transition (`hover:border-stone-400`) on all viewport sizes
- [frontend] Verify Coming Soon badge styling matches design tokens (uppercase, tracking, rounded-full)
- [frontend] Verify single-column layout on mobile (< `sm` breakpoint)
- [frontend] Verify `UserMenu` props (`fullName`, `email`) render correctly with null `fullName` fallback
  - Verification: test with a user who has no display name set — email displayed in greeting and menu

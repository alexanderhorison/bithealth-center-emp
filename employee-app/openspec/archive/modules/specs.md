# Specs: Module Directory (App Home)

> Status: **SHIPPED** — Retrospective SDD artifact.

---

## Functional Requirements

### Authentication
- **FR-MOD-01** — The page shall call `requireEmployeeUser()` at the top of the Server Component; unauthenticated requests shall be redirected to `/` before any render.

### Greeting
- **FR-MOD-02** — The page shall display `Hello, {fullName}` where `fullName` is the employee's full name from the auth session.
- **FR-MOD-03** — If `fullName` is null, the system shall fall back to the employee's email address.
- **FR-MOD-04** — A subtitle `"Manage your daily operations from Bithealth Center."` shall appear below the greeting.

### Module Grid
- **FR-MOD-05** — Modules shall be displayed in a 2-column responsive grid (`sm:grid-cols-2`, single column on mobile).
- **FR-MOD-06** — Each active module card shall be wrapped in a `<Link>` navigating to its route on click.
- **FR-MOD-07** — Active module cards shall display: title, description, and an "Open module" label with an `ArrowRight` icon.
- **FR-MOD-08** — Coming Soon module cards shall NOT be wrapped in `<Link>` or any interactive element.
- **FR-MOD-09** — Coming Soon cards shall display: title, description, and a "Coming Soon" badge.

### Module Registry
| Module | Status | Route | Description |
|---|---|---|---|
| Presence | Active | `/presence` | Submit your daily status and optional selfie. |
| Account Request | Active | `/account-request` | Request GitHub repo access or Figma access. |
| Leave Request | Coming Soon | — | Plan and submit leave requests. |
| Asset Request | Coming Soon | — | Request tools and equipment from operations. |

### User Menu
- **FR-MOD-10** — The `UserMenu` component shall appear in the page header, aligned right.
- **FR-MOD-11** — `UserMenu` shall receive `fullName` and `email` as props from the server session.

---

## Non-Functional Requirements

- **NFR-MOD-01** — The page shall be a Server Component with no client-side state (`'use client'` not required).
- **NFR-MOD-02** — Time-to-first-byte (TTFB) for this page shall be minimal — no database queries are permitted on this route.
- **NFR-MOD-03** — The layout shall be mobile-first and legible on viewports ≥ 375px.
- **NFR-MOD-04** — Coming Soon cards shall be visually distinct with sufficient contrast to avoid confusion with active cards.

---

## Out of Scope

- Dynamic module registry driven by database or CMS
- Role-based module visibility (all modules shown to all authenticated employees)
- Module usage statistics or "last visited" state
- Notifications or badge counts on module cards
- Click-to-notify / waitlist for Coming Soon modules

---

## Edge Cases

| Scenario | Expected Behaviour |
|---|---|
| Employee has no `fullName` | Greeting falls back to email |
| Employee is inactive (`is_active: false`) | No gate on modules page — only Presence module gates on `is_active` |
| `requireEmployeeUser()` throws unexpectedly | Next.js default error boundary (no custom `error.tsx` on this route — known gap) |
| New module added to codebase | Requires code change to `page.tsx` (no config-driven registry — known gap) |

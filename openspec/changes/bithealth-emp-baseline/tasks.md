# Tasks: Bithealth Center Employee App — Baseline

## Completed Work (Existing Implementation)

The following tasks are already implemented and represent the current state of the codebase.

### Foundation
- [x] [infra] Scaffold Next.js 14 App Router project with TypeScript strict mode
- [x] [infra] Configure Tailwind CSS with stone/slate/zinc MUJI palette and CSS variable tokens
- [x] [infra] Set up Supabase project with `presence` schema
- [x] [infra] Configure `COMPANY_EMAIL_DOMAIN` environment variable for auth restriction
- [x] [infra] Multi-stage Dockerfile with Node 20 Alpine, standalone output, non-root user
- [x] [frontend] Configure Noto Sans JP + Manrope fonts via `next/font`
- [x] [frontend] Set up shadcn/ui component primitives: Button, Card, Input, Label, Textarea
- [x] [backend] Configure TanStack Query v5 provider with 30-second stale time

### Authentication
- [x] [infra] Create Supabase `employees` and `roles` tables in `presence` schema with RLS
- [x] [infra] Enable Google OAuth provider in Supabase Auth dashboard
- [x] [backend] Implement `POST /api/auth/session` route — validates tokens, checks domain, sets httpOnly cookies (`bh_employee_at`, `bh_employee_rt`)
- [x] [backend] Implement `POST /api/auth/sign-out` route — clears both auth cookies
- [x] [frontend] Build `/auth/callback` client page — exchanges OAuth code for session, POSTs to `/api/auth/session`
- [x] [backend] Implement `middleware.ts` — validates JWT cookies, auto-refreshes expired access token, redirects invalid sessions to `/`
- [x] [backend] Implement `syncEmployee()` in `lib/employee/sync.ts` — 3-step upsert (by auth ID → by email → insert)
- [x] [backend] Implement `requireEmployeeUser()` and `getCurrentEmployeeUser()` in `lib/auth/server.ts`
- [x] [frontend] Build sign-in page with `google-sign-in-button.tsx`
- [x] [frontend] Build `user-menu.tsx` — avatar dropdown with employee name and sign-out

### Presence Tracking
- [x] [infra] Create `presences` table with `UNIQUE (employee_id, presence_date)` constraint
- [x] [infra] Create `presence-selfies` Supabase Storage bucket with 5MB file size limit
- [x] [infra] Set storage RLS to allow authenticated employees to write their own files
- [x] [backend] Implement `submitPresenceAction` Server Action — Zod validate, upsert presence record
- [x] [backend] Implement `uploadSelfieAction` Server Action — validate MIME type + size, upload to storage, return URL
- [x] [frontend] Build `presence-form.tsx` — status buttons (PRESENT/WFH/NOT_PRESENT/GO_TO_CLIENT), selfie upload, note textarea, React Hook Form + Zod
- [x] [frontend] Build `presence-history.tsx` — last 7 entries list with date, status badge, note, selfie thumbnail
- [x] [frontend] Implement inactive account guard in presence form (`is_active = false` → disabled state)
- [x] [backend] Create Zustand store `use-presence-form.ts` for status ↔ form value sync
- [x] [frontend] Build presence page Server Component — fetches today's record + last 7

### Account Request
- [x] [infra] Create `access_requests` table with provider/request_type enums and status lifecycle
- [x] [backend] Implement `createAccessRequestAction` Server Action — Zod validate cross-field rules, insert request
- [x] [frontend] Build `account-request-form.tsx` — provider selector, dynamic request type options, URL field conditionally required, React Hook Form + Zod
- [x] [frontend] Build `request-history.tsx` — paginated table with status badges, admin notes, dates, prev/next controls
- [x] [frontend] Build account-request page Server Component — fetches paginated requests, passes to client components

### Module Hub
- [x] [frontend] Build `/modules` page — 4-card grid (2 active, 2 coming-soon placeholders)
- [x] [frontend] Build `/dashboard` redirect page — redirects to `/presence`
- [x] [frontend] Build `app-footer.tsx` — shared footer for authenticated layout

### PWA
- [x] [infra] Create web app manifest with app name, icons, and display mode
- [x] [frontend] Register service worker via `register-service-worker.tsx`

---

## Planned Work (Upcoming Modules)

### Leave Request Module

- [ ] [infra] Create `leave_requests` table in `presence` schema with leave_type enum, status lifecycle, and approver FK
- [ ] [infra] Apply RLS: employees can insert/read their own records; managers/admins can update status
- [ ] [backend] Implement `createLeaveRequestAction` Server Action — Zod validate, insert record
- [ ] [backend] Implement `approveLeaveRequestAction` Server Action — admin/manager only, update status + approver_note
- [ ] [frontend] Build `leave-request-form.tsx` — leave type selector, date range picker, reason textarea
- [ ] [frontend] Build `leave-request-history.tsx` — paginated list with status badges and approver notes
- [ ] [frontend] Build `/leave-request` page Server Component — fetch employee's leave requests
- [ ] [frontend] Update `/modules` page — replace Leave Request "Coming Soon" card with active link

### Asset Request Module

- [ ] [infra] Create `asset_requests` table with asset_type, status (PENDING/APPROVED/FULFILLED/DENIED), and ops_note
- [ ] [infra] Apply RLS: employees can insert/read their own records; ops team can update status
- [ ] [backend] Implement `createAssetRequestAction` Server Action — Zod validate, insert record
- [ ] [backend] Implement `fulfillAssetRequestAction` Server Action — ops team only, update status to FULFILLED
- [ ] [frontend] Build `asset-request-form.tsx` — asset type dropdown, asset name field, justification textarea
- [ ] [frontend] Build `asset-request-history.tsx` — list with status badge, ops note, fulfilment date
- [ ] [frontend] Build `/asset-request` page Server Component — fetch employee's asset requests
- [ ] [frontend] Update `/modules` page — replace Asset Request "Coming Soon" card with active link

### Admin Panel (Future)

- [ ] [infra] Add `is_admin` or admin-specific RLS policies on all tables
- [ ] [backend] Implement admin-only Server Actions: list all presence records, resolve access requests, manage employees
- [ ] [frontend] Build admin shell layout with admin navigation
- [ ] [frontend] Build presence overview table (all employees, filterable by date and status)
- [ ] [frontend] Build access request management view (filter by status, bulk resolve)
- [ ] [frontend] Build employee management view (activate/deactivate accounts, assign roles)

---

## Task Routing Legend
- `[infra]` → Infrastructure sub-agent (Supabase MCP) — schema, migrations, RLS, storage
- `[frontend]` → Frontend agent — components, pages, styling, shadcn/ui, Tailwind
- `[backend]` → Backend agent / direct — Server Actions, API routes, middleware, validation

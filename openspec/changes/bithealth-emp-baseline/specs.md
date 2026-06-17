# Specs: Bithealth Center Employee App — Baseline

## Functional Requirements

### FR-1: Authentication

**FR-1.1** The app shall authenticate employees exclusively via Google OAuth through Supabase Auth.

**FR-1.2** Upon OAuth callback, the app shall POST `{access_token, refresh_token}` to `/api/auth/session`, which sets two httpOnly cookies:
- `bh_employee_at` — access token, 1-hour TTL
- `bh_employee_rt` — refresh token, 30-day TTL

**FR-1.3** The middleware shall validate session cookies on every non-public route. If the access token is expired but the refresh token is valid, the middleware shall issue new cookies transparently.

**FR-1.4** The app shall restrict sign-in to emails matching the `COMPANY_EMAIL_DOMAIN` environment variable. Employees with the `ADMIN` role code shall bypass this restriction.

**FR-1.5** On every authenticated Server Action, `syncEmployee()` shall upsert the authenticated user's employee record:
1. Look up by `clerk_user_id` (Supabase auth UUID)
2. If not found, look up by `email`
3. If not found, insert a new employee record
4. On PostgreSQL error `23505` (duplicate), retry the lookup by email

**FR-1.6** Sign-out shall clear both `bh_employee_at` and `bh_employee_rt` cookies and redirect to `/`.

---

### FR-2: Presence Tracking

**FR-2.1** An employee may submit one presence record per calendar date. Resubmission overwrites the prior entry (upsert on `(employee_id, presence_date)`).

**FR-2.2** Valid presence statuses: `PRESENT`, `WFH`, `NOT_PRESENT`, `GO_TO_CLIENT`.

**FR-2.3** An employee may optionally upload a selfie photo with constraints:
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Maximum file size: 5 MB
- Storage path: `{supabase_user_id}/{YYYY-MM-DD}/{uuid}.{ext}` in the `presence-selfies` bucket

**FR-2.4** An employee may optionally add a text note up to 250 characters.

**FR-2.5** The presence page shall display:
- Today's current submission (if any) as the default form state
- A history list of the last 7 presence entries in reverse-chronological order

**FR-2.6** If the authenticated employee's `is_active` field is `false`, the presence form shall be disabled and a message shown explaining the account is inactive.

---

### FR-3: Account Request

**FR-3.1** An employee may submit requests for the following provider/type combinations:

| Provider | Request Type | Target URL |
|---|---|---|
| GITHUB | REPO_ACCESS | Required (existing repo URL) |
| GITHUB | NEW_REPO | Optional |
| FIGMA | FIGMA_FILE | Required (file URL) |
| FIGMA | FIGMA_PROJECT | Optional |

**FR-3.2** All access requests require:
- `display_name`: 2–120 characters
- `justification`: 5–500 characters
- `extra_info`: optional, max 500 characters

**FR-3.3** New requests are created with `status = PENDING`. Status transitions:
- `PENDING` → `APPROVED` (admin action)
- `PENDING` → `DENIED` (admin action)

**FR-3.4** On resolution, the system shall record `admin_note`, `resolved_by` (admin employee ID), and `resolved_at` timestamp.

**FR-3.5** The request history view shall:
- Show requests belonging to the authenticated employee only
- Support pagination with page sizes of 10 or 20
- Display: request type, provider, status badge, admin note (if any), resolution date (if any), submission date

---

### FR-4: Module Hub

**FR-4.1** After successful authentication, employees shall be redirected to `/modules`.

**FR-4.2** The modules page shall display cards for all available modules with links to their routes.

**FR-4.3** Modules not yet implemented (Leave Request, Asset Request) shall appear as "Coming Soon" placeholder cards without navigation links.

---

### FR-5: Leave Request (Planned)

**FR-5.1** An employee shall be able to submit a leave request specifying:
- Leave type: `ANNUAL`, `SICK`, `PERSONAL`, `UNPAID`
- Start date and end date
- Reason (text)

**FR-5.2** Leave requests shall follow the same `PENDING → APPROVED/DENIED` status lifecycle as access requests.

**FR-5.3** An approver (manager or admin) shall be able to approve or deny requests with an optional response note.

---

### FR-6: Asset Request (Planned)

**FR-6.1** An employee shall be able to request tools or equipment from the operations team, specifying:
- Asset type (category)
- Asset name / description
- Justification

**FR-6.2** Asset requests shall follow a `PENDING → APPROVED → FULFILLED / DENIED` lifecycle.

**FR-6.3** The operations team shall be able to mark a request as fulfilled with a fulfilment note and timestamp.

---

## Non-Functional Requirements

**NFR-1: Mobile-First** — All pages must be responsive and usable on mobile devices (minimum 375px viewport). Tailwind breakpoints: `sm:` and above for desktop enhancements.

**NFR-2: Accessibility** — UI components from shadcn/ui provide baseline WCAG AA compliance. Interactive elements must have accessible labels.

**NFR-3: PWA** — The app ships with a web manifest and service worker for installability and basic offline capability.

**NFR-4: TypeScript Strict** — All code must pass TypeScript in strict mode. No `any` types.

**NFR-5: Performance** — TanStack Query stale time is 30 seconds. Server Components handle initial data loads to eliminate client-side loading spinners on first render.

**NFR-6: Security** — The Supabase service role key must never be exposed to the client. All DB access from Server Actions uses the admin client. Auth cookies are httpOnly and Secure.

---

## Out of Scope

- Admin panel for managing employees, viewing all presence records, and bulk-resolving requests
- Push or email notifications for request resolution
- Leave balance tracking and accrual engine
- Presence data export / reporting
- Multi-tenant support
- Third-party integrations beyond Supabase and Google OAuth

---

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Employee submits presence twice in one day | Second submission overwrites first (upsert) |
| Employee uploads oversized selfie (>5MB) | Server Action returns error; form shows validation message |
| Refresh token expired | Middleware clears both cookies and redirects to `/` |
| Employee account marked inactive | Presence form is disabled; informational message shown |
| REPO_ACCESS request submitted without target URL | Zod validation rejects at form level before submission |
| Employee opens app offline | Service worker serves cached shell; data operations show appropriate error |

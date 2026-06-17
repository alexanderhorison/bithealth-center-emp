# Tasks: Account Request

> Status: **SHIPPED** — Retrospective SDD artifact.
> All tasks below are completed. Listed in implementation order for reference.

---

## Phase 1 — Infrastructure (Blocking)

- [infra] Create `presence.access_request_provider` enum: `GITHUB`, `FIGMA`
- [infra] Create `presence.access_request_type` enum: `REPO_ACCESS`, `NEW_REPO`, `FIGMA_FILE`, `FIGMA_PROJECT`
- [infra] Create `presence.access_request_status` enum: `PENDING`, `APPROVED`, `REJECTED`
- [infra] Create `presence.access_requests` table with columns: `id`, `employee_id` (FK), `provider`, `request_type`, `target_url` (nullable), `display_name`, `justification`, `extra_info` (nullable), `status` (default `PENDING`), `created_at`
- [infra] Add index on `(employee_id, created_at DESC)` for paginated history queries
- [infra] Apply RLS on `presence.access_requests`: service role has full access; no direct client access
  - Verification: insert via anon key returns permission denied

## Phase 2 — Validation Layer

- [backend] Create `lib/validations/access-request.ts`:
  - `accessRequestProviderSchema` — z.enum
  - `accessRequestTypeSchema` — z.enum
  - `createAccessRequestSchema` — all fields + `superRefine` cross-validation (provider↔type compatibility + conditional URL requirement)
  - `accessRequestSearchParamsSchema` — page (int ≥ 1), pageSize (10 | 20)
  - Verification: GITHUB+FIGMA_FILE → Zod error; REPO_ACCESS+empty URL → Zod error; valid payload → passes

## Phase 3 — Server Action

- [backend] Create `app/(employee)/account-request/actions.ts`:
  - `createAccessRequestAction(input)`:
    - `requireEmployeeUser()` — throw if unauthenticated
    - `createAccessRequestSchema.safeParse(input)` — return field errors if invalid
    - `syncEmployee(...)` — get `employee.id`
    - Insert into `presence.access_requests`
    - `revalidatePath('/account-request')`
    - Return `{ success: true }` or `{ success: false, message }`
  - Verification: submit valid payload → record in DB with correct fields; submit invalid → error returned without DB write

## Phase 4 — Page & Components

- [frontend] Create `app/(employee)/account-request/page.tsx` (Server Component):
  - `requireEmployeeUser()` + `syncEmployee()`
  - Parse `searchParams` with `accessRequestSearchParamsSchema` (fallback to defaults on invalid)
  - Fetch paginated `presence.access_requests` for employee ordered by `created_at DESC`
  - Render `<AccountRequestForm />` + `<RequestHistory />`
  - Verification: authenticated → renders form + history; unauthenticated → redirect to `/`
- [frontend] Create `app/(employee)/account-request/_components/account-request-form.tsx` (`'use client'`):
  - RHF + `zodResolver(createAccessRequestSchema)`
  - Provider selector (`GITHUB` | `FIGMA`) — drives type options
  - Request type selector — filtered by selected provider; resets on provider change
  - `displayName` input (2–120 chars)
  - `targetUrl` input — shown always, required only for REPO_ACCESS + FIGMA_FILE (dynamic required label)
  - `justification` textarea (5–500 chars)
  - `additionalInfo` textarea (optional, 500 chars)
  - Submit mutation (`useMutation` → `createAccessRequestAction`) with loading/error state
  - On success: `form.reset()`
  - Verification: switch provider → type options update; submit REPO_ACCESS without URL → inline error; submit valid → form resets + history refreshes
- [frontend] Create `app/(employee)/account-request/_components/request-history.tsx` (`'use client'`):
  - Collapsible container (expand/collapse toggle)
  - Renders list of `AccessRequestRow` items: provider badge, type, display name, status badge, date
  - Pagination controls: prev/next/page numbers that push `?page=N` to URL
  - Empty state when no requests exist
  - Verification: paginate to page 2 → URL updates to `?page=2` → correct records displayed

## Phase 5 — Polish

- [frontend] Verify conditional `targetUrl` label shows "Required" vs "Optional" based on selected type
- [frontend] Verify mobile layout: all form fields usable at ≥ 375px
- [frontend] Verify history empty state renders correctly for new employees
- [frontend] Verify `?page=0` and invalid `?pageSize` fall back to defaults without error

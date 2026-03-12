# Tasks: Presence Tracking

> Status: **SHIPPED** — Retrospective SDD artifact.
> All tasks below are completed. Listed in implementation order for reference.

---

## Phase 1 — Infrastructure (Blocking)

- [infra] Create `presence_status` enum in `presence` schema: `PRESENT`, `WFH`, `NOT_PRESENT`, `GO_TO_CLIENT`
- [infra] Create `presence.presences` table with columns: `id`, `employee_id` (FK), `presence_date` (date), `status` (enum), `selfie_url` (nullable text), `note` (nullable text, max 250 chars), `created_at`, `updated_at`
- [infra] Add UNIQUE constraint on `(employee_id, presence_date)` to support upsert conflict resolution
- [infra] Add index on `(employee_id, presence_date DESC)` for history queries
- [infra] Apply RLS policies on `presence.presences`: service role has full access; no direct authenticated client access (all writes go through Server Actions with admin client)
  - Verification: direct insert via anon key returns permission denied
- [infra] Create Supabase Storage bucket `presence-selfies` with public read access
- [infra] Configure Storage bucket MIME type restrictions (jpg/png/webp) and size policy (5MB)
  - Verification: attempt upload of `.gif` via admin client — confirm rejection or document that validation is app-level only

## Phase 2 — Validation Layer

- [backend] Create `lib/validations/presence.ts`:
  - `presenceStatusSchema` — z.enum with all 4 statuses
  - `submitPresenceSchema` — status (required), selfieUrl (optional URL), note (optional, max 250)
  - Verification: parse invalid status → Zod throws; parse empty note → passes

## Phase 3 — Server Actions

- [backend] Create `app/(employee)/presence/actions.ts`:
  - `ensureEmployee()` — `getCurrentEmployeeUser()` + `syncEmployee()`, returns `{ id }`
  - `uploadSelfieAction(formData)`:
    - Extract `File` from FormData
    - Validate MIME type (jpg/png/webp) — return error if invalid
    - Validate size ≤ 5MB — return error if too large
    - Build path: `{userId}/{date}/{uuid}.{ext}`
    - Upload via `supabaseAdmin.storage.from('presence-selfies').upload(path, buffer, { upsert: false })`
    - Return `{ success: true, url }` or `{ success: false, message }`
  - `submitPresenceAction(input)`:
    - Parse with `submitPresenceSchema`
    - Call `ensureEmployee()`
    - Upsert into `presence.presences` with `onConflict: 'employee_id,presence_date'`
    - Call `revalidatePath('/presence')`
    - Return `{ success: true }` or `{ success: false, message }`
  - Verification: submit → record appears in DB; submit again same day → record updated (not duplicated)

## Phase 4 — Page & Components

- [frontend] Create `app/(employee)/presence/page.tsx` (Server Component):
  - `requireEmployeeUser()` at top
  - `Promise.all([syncEmployee(...), fetchRecentPresences(userId, 7)])`
  - Gate render on `employee.is_active` — show inactive message or `<PresenceForm />`
  - Pass `employee` and `history` as props to `PresenceForm`
  - Verification: inactive employee sees message; active employee sees form
- [frontend] Create `app/(employee)/presence/loading.tsx` — skeleton cards for form + history
- [frontend] Create `app/(employee)/presence/error.tsx` — `'use client'` error boundary with Retry button
- [frontend] Create `app/(employee)/presence/_components/presence-form.tsx` (`'use client'`):
  - RHF + Zod resolver for `submitPresenceSchema`
  - Status selector (4 options — `PRESENT`, `WFH`, `NOT_PRESENT`, `GO_TO_CLIENT`)
  - Selfie file input with client-side MIME + size validation before upload
  - Upload mutation (`useMutation` → `uploadSelfieAction`) with loading/error state
  - Submit mutation (`useMutation` → `submitPresenceAction`) with loading/error state
  - Zustand store sync for status display
  - History list — renders last 7 entries (passed as prop)
  - Verification: select status → submit → history updates; upload bad file → error shown; inactive user → component not rendered

## Phase 5 — Polish

- [frontend] Verify mobile layout: status buttons usable at ≥ 375px width
- [frontend] Verify loading skeleton matches form structure (no layout shift)
- [frontend] Verify error boundary renders and Retry re-triggers page load
- [frontend] Verify history empty state (no presences yet) renders gracefully

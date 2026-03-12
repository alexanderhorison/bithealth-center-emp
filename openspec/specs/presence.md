# Spec: Presence Tracking

> Status: **SHIPPED** — Living spec derived from code analysis.
> Schema: `presence` (Supabase)
> Key files: `app/(employee)/presence/`, `lib/validations/presence.ts`

---

## Overview

Employees submit their daily work status once per day. Each submission can include an optional selfie photo and a short note. The page shows today's current status (pre-filled if already submitted) and a collapsible last-7-entries history. Selfies are uploaded to Supabase Storage.

---

## Functional Requirements

### Status Submission
1. **FR-PRES-01** — When an employee visits `/presence`, the system shall load today's presence record (if any) and pre-fill the form with the existing status, selfie URL, and note.
2. **FR-PRES-02** — When an employee submits the form, the system shall upsert the presence record for today, keyed on `(employee_id, presence_date)`.
3. **FR-PRES-03** — When a presence record already exists for today, resubmitting shall overwrite it (upsert, not duplicate).
4. **FR-PRES-04** — The system shall support exactly four status values: `PRESENT`, `WFH`, `NOT_PRESENT`, `GO_TO_CLIENT`.
5. **FR-PRES-05** — The note field shall be optional, max 250 characters.
6. **FR-PRES-06** — When submission succeeds, the system shall revalidate `/presence` and refresh the page state.
7. **FR-PRES-07** — When an employee's account is disabled (`is_active = false`), the system shall show an "Account Disabled" message and not render the form.

### Selfie Upload
8. **FR-PRES-08** — When an employee selects an image file, the system shall upload it immediately to the `presence-selfies` Supabase Storage bucket before form submission.
9. **FR-PRES-09** — Accepted file types: `image/jpeg`, `image/png`, `image/webp`. Max size: 5MB.
10. **FR-PRES-10** — The storage path shall follow the pattern: `{userId}/{date}/{uuid}.{ext}`.
11. **FR-PRES-11** — After upload, the system shall show a preview of the selfie and allow the employee to remove it before saving.
12. **FR-PRES-12** — On mobile, the file input shall trigger the front-facing camera (`capture="user"`).

### History
13. **FR-PRES-13** — The system shall display the last 7 presence entries in a collapsible section (collapsed by default), ordered by `presence_date` descending.
14. **FR-PRES-14** — Each history entry shall show: date (formatted), status badge, and last updated time.

---

## Non-Functional Requirements

- **NFR-PRES-01** — Page data (today's presence + history) must be fetched in parallel via `Promise.all` on the server.
- **NFR-PRES-02** — The loading state must use skeleton placeholders (`loading.tsx`).
- **NFR-PRES-03** — The error boundary (`error.tsx`) must show a Retry button.
- **NFR-PRES-04** — The form submit button must be disabled while upload or submission is in progress.

---

## Data Model

### `presence.presences` table (inferred)
| Column | Type | Notes |
|---|---|---|
| `employee_id` | uuid FK | References `presence.employees.id` |
| `presence_date` | date | Format: `YYYY-MM-DD` |
| `status` | enum | `PRESENT \| WFH \| NOT_PRESENT \| GO_TO_CLIENT` |
| `selfie_url` | text\|null | Public URL from Supabase Storage |
| `note` | text\|null | Max 250 chars |
| `updated_at` | timestamptz | Auto-updated |
| **Unique constraint** | `(employee_id, presence_date)` | Enables upsert |

### Zod Schema
```ts
submitPresenceSchema = z.object({
  status: z.enum(['PRESENT', 'WFH', 'NOT_PRESENT', 'GO_TO_CLIENT']),
  selfieUrl: z.string().url().optional().or(z.literal('')),
  note: z.string().max(250).optional().or(z.literal(''))
})
```

### Status Display Metadata
| Status | Label | Badge color |
|---|---|---|
| `PRESENT` | Present | emerald |
| `WFH` | WFH | sky |
| `NOT_PRESENT` | Not Present | zinc |
| `GO_TO_CLIENT` | Go to Client | amber |

---

## Component Map

```
app/(employee)/presence/
  page.tsx                     [server] — auth, employee sync, DB fetch, render
  loading.tsx                  [server] — skeleton placeholders
  error.tsx                    [client] — error boundary with Retry
  actions.ts                   [server] — submitPresenceAction, uploadSelfieAction
  _components/
    presence-form.tsx          [client] — status selector, selfie upload, note, submit
```

### Data Flow
```
page.tsx (server)
  → requireEmployeeUser() → syncEmployee()
  → parallel: fetch todayPresence + historyEntries
  → render history (server) + <PresenceForm> (client, hydrated with initial values)

PresenceForm (client)
  → file change → uploadSelfieAction (Server Action) → sets selfieUrl in form state
  → submit → submitPresenceAction (Server Action) → router.refresh()
```

---

## Known Issues / Gap Analysis

- **GAP-PRES-01** ✅ RESOLVED — `uploadSelfieAction` now reads `previousSelfieUrl` from FormData. If the URL belongs to the `presence-selfies` bucket, the old object is deleted via `storage.remove()` before the new file is uploaded. `PresenceForm` passes the current `selfieUrl` value on every upload.
- **GAP-PRES-02** ✅ RESOLVED — Removed `usePresenceFormStore` from `presence-form.tsx`. Status is now read via `form.watch('status')` (RHF only). The `useEffect` sync and all `setStatus` calls are gone.
- **GAP-PRES-03** ✅ RESOLVED — `page.tsx` passes `hasExistingSubmission={!!todayPresence}` to `PresenceForm`. When true: button label changes to "Update Presence" and a subtle "You've already submitted for today" notice appears above the button.
- **GAP-PRES-04** ✅ RESOLVED — History extracted to `_components/presence-history.tsx` (client component). Starts with 7 server-rendered entries; a "Load more" button calls `fetchPresenceHistoryAction(offset)` via `useMutation` and appends results. Button hides when fewer than `HISTORY_PAGE_SIZE` entries are returned.

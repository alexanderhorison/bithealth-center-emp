# Specs: Presence Tracking

> Status: **SHIPPED** — Retrospective SDD artifact.

---

## Functional Requirements

### Page Load
- **FR-PRES-01** — The page shall call `requireEmployeeUser()` and `syncEmployee()` on every load to ensure the employee record is current.
- **FR-PRES-02** — If the employee's `is_active` flag is `false`, the system shall render an inactive-account message instead of the form.
- **FR-PRES-03** — The page shall fetch the employee's 7 most recent presence records in parallel with the employee sync (parallel `Promise.all` pattern).
- **FR-PRES-04** — The page shall display a `loading.tsx` skeleton while server-side data fetching is in progress (Next.js Suspense boundary via `loading.tsx`).
- **FR-PRES-05** — The page shall display an `error.tsx` boundary with a "Retry" button if the server component throws.

### Status Submission
- **FR-PRES-06** — The status field shall accept one of: `PRESENT`, `WFH`, `NOT_PRESENT`, `GO_TO_CLIENT`.
- **FR-PRES-07** — Status is the only required field; selfie and note are optional.
- **FR-PRES-08** — On submit, the system shall call `submitPresenceAction(input)` which upserts a record keyed on `(employee_id, presence_date)`.
- **FR-PRES-09** — `presence_date` shall be the server's current UTC date (`new Date().toISOString().slice(0, 10)`).
- **FR-PRES-10** — On successful submission, `revalidatePath('/presence')` shall be called to refresh the history.
- **FR-PRES-11** — On submission error, the system shall display the error message returned by the Server Action.

### Selfie Upload
- **FR-PRES-12** — The selfie field shall accept only JPG, PNG, or WEBP files.
- **FR-PRES-13** — The maximum selfie file size shall be 5MB (5 × 1024 × 1024 bytes).
- **FR-PRES-14** — Selfie upload shall be performed via `uploadSelfieAction(formData)` before form submission.
- **FR-PRES-15** — The storage path shall be: `{userId}/{YYYY-MM-DD}/{uuid}.{ext}` in the `presence-selfies` bucket.
- **FR-PRES-16** — The returned public URL shall be stored in the form state and submitted as `selfieUrl` in the presence record.
- **FR-PRES-17** — Selfie uploads shall use `upsert: false` — each upload creates a unique file; no files are overwritten on re-upload.

### Note Field
- **FR-PRES-18** — The note field shall be a free-text input with a maximum of 250 characters.
- **FR-PRES-19** — An empty note string shall be coerced to `null` before DB insert.

### Presence History
- **FR-PRES-20** — The page shall display the 7 most recent presence records for the authenticated employee, ordered by `presence_date` descending.
- **FR-PRES-21** — Each history item shall display: date, status badge, selfie thumbnail (if any), and note (if any).
- **FR-PRES-22** — History shall be fetched server-side and rendered as a Server Component; no client-side refetch required for history display.

---

## Non-Functional Requirements

- **NFR-PRES-01** — The presence page shall support PWA offline shell (app is registered as a PWA; however, submission requires network access).
- **NFR-PRES-02** — Selfie upload shall use streaming via `Buffer.from(await selfieFile.arrayBuffer())` — file bytes must not be held in memory longer than necessary.
- **NFR-PRES-03** — The form shall be responsive and usable on mobile (primary use case: employees submitting from phones).
- **NFR-PRES-04** — Status selection UI shall be unambiguous on touch targets (minimum 44×44px).

---

## Out of Scope

- Backfilling presence for past dates (only today's date is accepted)
- Admin view of all employees' presence
- Bulk status submission
- Selfie cleanup / deduplication on re-submission (known gap: GAP-PRES-01)
- Pagination of presence history beyond 7 entries (known gap: GAP-PRES-04)
- Attendance reports or exports

---

## Edge Cases

| Scenario | Expected Behaviour |
|---|---|
| Employee submits twice on the same day | Second submission overwrites first (upsert on `employee_id, presence_date`) |
| Selfie > 5MB | Server Action returns `success: false` with "Image is too large" message |
| Selfie with invalid MIME type | Server Action returns `success: false` with "Only JPG, PNG, or WEBP" message |
| `is_active: false` | Form replaced with inactive-account message; submission prevented server-side |
| Network error during selfie upload | Upload Server Action returns error; form does not proceed to presence submit |
| Employee re-uploads selfie same day | New UUID path created, old file orphaned in Storage (no cleanup — GAP-PRES-01) |
| No presence history yet | History section renders empty state |
| Server component throws during `Promise.all` | `error.tsx` boundary renders with Retry button |

# Proposal: Presence Tracking

> Status: **SHIPPED** — Retrospective SDD artifact.

---

## Problem Statement

Bithealth Center needs a lightweight daily check-in system so team leads can see where each employee is working on any given day. Employees should be able to record their work status once per day, optionally attach a selfie as visual confirmation, and add a short note. Submissions are idempotent — re-submitting on the same day updates the existing record rather than creating a duplicate. A history of recent submissions gives employees a personal audit trail.

---

## User Stories (EARS Format)

- When an authenticated, active employee visits `/presence`, the system shall display the current day's status form and their recent presence history.
- When an employee selects a status and submits the form, the system shall create or update their presence record for today.
- When an employee submits for a date they have already submitted, the system shall overwrite the previous record (upsert behaviour).
- When an employee optionally selects a selfie image, the system shall upload it to cloud storage before submitting the form.
- When the selfie upload fails validation (wrong type or too large), the system shall show an error and prevent submission.
- When an employee's account is inactive (`is_active: false`), the system shall show an inactive-account message and prevent form submission.
- When the form is submitted successfully, the system shall refresh the presence history to reflect the latest entry.
- When an employee adds an optional note, the system shall store it alongside the status record.

---

## Affected Modules

- **Auth** — depends on `requireEmployeeUser()` and `syncEmployee()`.
- **Modules** — Presence is linked from the modules grid.

---

## Schema Changes Required

`[infra]` — Requires `presence.presences` table with:
- `employee_id` (FK → `presence.employees.id`)
- `presence_date` (date, not timestamptz — one record per day)
- `status` (enum: PRESENT, WFH, NOT_PRESENT, GO_TO_CLIENT)
- `selfie_url` (nullable text)
- `note` (nullable text, max 250 chars)
- Unique constraint on `(employee_id, presence_date)` to enable upsert

`[infra]` — Requires Supabase Storage bucket `presence-selfies` (public read).

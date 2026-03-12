# Proposal: Account Request

> Status: **SHIPPED** — Retrospective SDD artifact.

---

## Problem Statement

Employees need access to external tools (GitHub repositories, Figma files/projects) to do their work. Requesting these manually via chat or email creates friction and leaves no audit trail. The Account Request module provides a structured form that captures all the information an administrator needs to fulfill the request, and a paginated history so employees can track their past submissions.

---

## User Stories (EARS Format)

- When an authenticated employee visits `/account-request`, the system shall display a request form and their submission history.
- When an employee selects a provider (GitHub or Figma), the system shall show only the valid request types for that provider.
- When an employee selects a request type that requires a target URL (REPO_ACCESS, FIGMA_FILE), the system shall require a valid URL in the target URL field.
- When an employee selects a request type that does not require a URL (NEW_REPO, FIGMA_PROJECT), the system shall make the target URL field optional.
- When an employee submits a valid request, the system shall insert a new record into the access requests table.
- When the form submission succeeds, the system shall clear the form and refresh the history list.
- When the form submission fails validation, the system shall display field-level error messages without submitting.
- When an employee has previous requests, the system shall display them in a paginated list ordered by newest first.
- When an employee navigates to a specific history page via URL (`?page=2`), the system shall load that page of results.

---

## Affected Modules

- **Auth** — depends on `requireEmployeeUser()` and `syncEmployee()`.
- **Modules** — Account Request is linked from the modules grid.

---

## Schema Changes Required

`[infra]` — Requires `presence.access_requests` table with:
- `employee_id` (FK → `presence.employees.id`)
- `provider` (enum: GITHUB, FIGMA)
- `request_type` (enum: REPO_ACCESS, NEW_REPO, FIGMA_FILE, FIGMA_PROJECT)
- `target_url` (nullable text)
- `display_name` (text, 2–120 chars)
- `justification` (text, 5–500 chars)
- `extra_info` (nullable text, max 500 chars)
- `status` (enum or text — current state of the request)
- `created_at`

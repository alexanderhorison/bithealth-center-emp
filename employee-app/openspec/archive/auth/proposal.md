# Proposal: Authentication & Session Management

> Status: **SHIPPED** — Retrospective SDD artifact.

---

## Problem Statement

Bithealth Center employees need a secure way to access the self-service portal. Only employees with a verified company email (or an ADMIN-role override) should be granted entry. Sessions must persist across page refreshes without requiring frequent re-login, while expiring predictably to limit exposure from stolen tokens.

---

## User Stories (EARS Format)

- When an employee visits the app for the first time, the system shall present sign-in options (Google OAuth and email/password).
- When an employee signs in with a non-company email domain, the system shall reject access and display an appropriate error.
- When an employee successfully authenticates, the system shall issue httpOnly session cookies and redirect to `/modules`.
- When an authenticated employee's access token expires, the system shall silently refresh it using the refresh token without interrupting the session.
- When both the access token and refresh token are invalid or absent, the system shall redirect the employee to the sign-in page (`/`).
- When an authenticated employee visits `/`, the system shall redirect them to `/modules`.
- When a user with ADMIN role uses a non-company email, the system shall still allow access (override rule).
- When an employee signs out, the system shall clear all session cookies and return the user to `/`.

---

## Affected Modules

- **All routes** — middleware enforces auth on every protected path.
- **Presence Tracking** — depends on `requireEmployeeUser()` and `syncEmployee()`.
- **Account Request** — depends on `requireEmployeeUser()` and `syncEmployee()`.
- **Modules page** — depends on `requireEmployeeUser()`.

---

## Schema Changes Required

`[infra]` — Requires `presence.employees` and `presence.roles` tables with:
- `employees.clerk_user_id` (Supabase auth user UUID, despite the column name artifact)
- `employees.email`, `employees.full_name`, `employees.avatar_url`
- `employees.is_active` boolean
- `employees.role_id` → FK to `roles.id`
- `roles.code` — values include `'ADMIN'`

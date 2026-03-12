# Specs: Authentication & Session Management

> Status: **SHIPPED** — Retrospective SDD artifact.

---

## Functional Requirements

### Sign-In
- **FR-AUTH-01** — The system shall provide a sign-in page at `/` with Google OAuth and email/password options.
- **FR-AUTH-02** — On successful authentication, the system shall issue two httpOnly cookies: `bh_employee_at` (access token, 1h TTL) and `bh_employee_rt` (refresh token, 30d TTL).
- **FR-AUTH-03** — Cookie options: `httpOnly: true`, `secure: true` (production), `sameSite: 'lax'`, `path: '/'`.
- **FR-AUTH-04** — On successful sign-in, the system shall redirect the employee to `/modules`.

### Access Control
- **FR-AUTH-05** — The system shall restrict access to employees whose email matches the configured `COMPANY_EMAIL_DOMAIN` environment variable.
- **FR-AUTH-06** — If `COMPANY_EMAIL_DOMAIN` is empty, the system shall allow any email (dev/local override).
- **FR-AUTH-07** — If an employee's email does not match the domain, the system shall check if the employee record has `role.code === 'ADMIN'`. If so, access shall be granted.
- **FR-AUTH-08** — If domain check fails and the employee is not ADMIN, the system shall deny access and return `null` from session resolution functions.

### Session Lifecycle
- **FR-AUTH-09** — Edge middleware shall run on every request except `_next/static`, `_next/image`, `favicon.ico`, and static files.
- **FR-AUTH-10** — If the access token is valid, the system shall pass the request through and rewrite the cookies with the current token values.
- **FR-AUTH-11** — If the access token is expired/invalid but a refresh token exists, the system shall silently refresh the session and rewrite new cookies onto the response.
- **FR-AUTH-12** — If both tokens are invalid, the system shall clear the cookies and redirect to `/`.
- **FR-AUTH-13** — `/api/auth/*` and `/auth/callback` paths shall always be passed through without auth checks.
- **FR-AUTH-14** — An authenticated employee visiting `/` shall be redirected to `/modules`.

### Sign-Out
- **FR-AUTH-15** — Sign-out shall clear both cookies (set `maxAge: 0`) and redirect to `/`.

### Employee Sync
- **FR-AUTH-16** — On each Server Action requiring employee identity, the system shall call `syncEmployee()` to upsert the employee record in `presence.employees`, matched first by `clerk_user_id`, then by email.
- **FR-AUTH-17** — `syncEmployee()` shall handle the race condition (PostgreSQL error `23505`) by falling back to an email lookup and updating the existing record.

---

## Non-Functional Requirements

- **NFR-AUTH-01** — Session resolution (middleware token validation + optional refresh) shall add no more than ~100ms latency to the first request after expiry.
- **NFR-AUTH-02** — Tokens shall never be stored in `localStorage` or exposed to client-side JavaScript (`httpOnly` requirement).
- **NFR-AUTH-03** — The service role key shall never be sent to the browser; all admin Supabase operations use server-only imports.

---

## Out of Scope

- MFA / two-factor authentication
- Magic link sign-in (email link)
- Per-route RBAC beyond the ADMIN override (all authenticated employees see the same routes)
- Token revocation / logout-all-devices
- Audit logging for sign-in events

---

## Edge Cases

| Scenario | Expected Behaviour |
|---|---|
| Access token missing, no refresh token | Redirect to `/`, clear cookies |
| Access token valid but domain mismatch + no ADMIN role | Deny access, treat as unauthenticated |
| Two concurrent requests during refresh window | Both trigger refresh; last write wins on cookies (stateless — both succeed) |
| `syncEmployee()` race condition (concurrent first-sign-in) | Error 23505 caught; fallback email lookup succeeds |
| `COMPANY_EMAIL_DOMAIN` env var missing | Allow all emails (dev mode) |
| Employee with `is_active: false` | Currently no gate in auth layer — `is_active` is only checked per-module (Presence page) |

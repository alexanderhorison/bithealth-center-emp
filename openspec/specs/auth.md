# Spec: Authentication & Session Management

> Status: **SHIPPED** — Living spec derived from code analysis.
> Schema: `presence` (Supabase)
> Key files: `lib/auth/shared.ts`, `lib/auth/server.ts`, `middleware.ts`, `app/auth/`, `app/sign-in/`, `app/sign-up/`

---

## Overview

Custom cookie-based session management on top of Supabase Auth. Employees sign in via Supabase (email/password or Google OAuth). Sessions are stored as httpOnly cookies — not managed by Supabase SSR helpers. Access is restricted to company-domain emails or users with the `ADMIN` role.

---

## Functional Requirements

1. **FR-AUTH-01** — When an unauthenticated user visits any protected route, the system shall redirect them to `/` (root/sign-in page).
2. **FR-AUTH-02** — When a user signs in successfully, the system shall set two httpOnly cookies: `bh_employee_at` (access token, 1h TTL) and `bh_employee_rt` (refresh token, 30-day TTL).
3. **FR-AUTH-03** — When an authenticated user visits `/`, the system shall redirect them to `/modules`.
4. **FR-AUTH-04** — When a valid access token is present, the system shall resolve the authenticated user on every request via middleware.
5. **FR-AUTH-05** — When the access token is expired but a valid refresh token exists, the system shall silently refresh the session and rewrite the cookies on the response.
6. **FR-AUTH-06** — When both tokens are invalid or absent on a protected route, the system shall clear auth cookies and redirect to `/`.
7. **FR-AUTH-07** — When an email does not match `COMPANY_EMAIL_DOMAIN`, the system shall deny access unless the user has the `ADMIN` role in the `presence.employees` table.
8. **FR-AUTH-08** — When the auth callback is reached at `/auth/callback`, the system shall exchange the code for a session and set auth cookies.
9. **FR-AUTH-09** — When a user signs out via `/api/auth/sign-out`, the system shall clear both auth cookies.

---

## Non-Functional Requirements

- **NFR-AUTH-01** — Auth cookies must be `httpOnly: true`, `sameSite: lax`, `secure: true` in production.
- **NFR-AUTH-02** — Session validation must run in Next.js middleware (Edge-compatible) on every non-static request.
- **NFR-AUTH-03** — No sensitive tokens stored in `localStorage` or client-accessible cookies.

---

## Data Model

### Cookie Names
| Cookie | Value | Max Age |
|---|---|---|
| `bh_employee_at` | Supabase JWT access token | 3600s (1h) |
| `bh_employee_rt` | Supabase refresh token | 2592000s (30d) |

### `AuthenticatedEmployeeUser` Type
```ts
{
  id: string          // Supabase auth user UUID
  email: string
  fullName: string | null
  avatarUrl: string | null
}
```

---

## Access Control Rules

| Condition | Result |
|---|---|
| Employee `is_active = false` | Denied — always, regardless of domain or role |
| Employee not yet in DB + email matches `COMPANY_EMAIL_DOMAIN` | Allowed (will sync on first Server Action) |
| `is_active = true` + email matches `COMPANY_EMAIL_DOMAIN` | Allowed |
| `is_active = true` + email does NOT match domain, but `employees.roles.code = 'ADMIN'` | Allowed |
| Neither condition met | Denied (treated as unauthenticated) |

---

## Route Protection Map

| Path | Auth Required |
|---|---|
| `/` | Public (redirects to `/modules` if authenticated) |
| `/auth/callback` | Public (exchange code) |
| `/api/auth/session` | Public |
| `/api/auth/sign-out` | Public |
| `/sign-in/**` | Public |
| `/sign-up/**` | Public |
| `/presence`, `/account-request`, `/modules`, `/dashboard` | Protected → redirect `/` if unauthenticated |

---

## Known Issues / Gap Analysis

- **GAP-AUTH-01** ✅ RESOLVED — `clerk_user_id` renamed to `auth_user_id` in DB (migration `rename_clerk_user_id_to_auth_user_id`) and in all code references (`lib/auth/shared.ts`, `lib/employee/sync.ts`).
- **GAP-AUTH-02** ✅ RESOLVED — `isSameOriginRequest()` origin check added to both `/api/auth/session` and `/api/auth/sign-out`. Cross-origin POST requests receive `403 Forbidden`.
- **GAP-AUTH-03** ✅ RESOLVED — Refresh fallback removed from `lib/auth/server.ts`. `getCurrentEmployeeUser()` is now access-token-only; middleware is the single refresh path.
- **GAP-AUTH-04** ✅ RESOLVED — `is_active` gate added to `isAllowedEmployeeUser()` in `lib/auth/shared.ts`. Inactive employees are denied at the token validation layer (middleware + session route). `is_active` check also added to `/api/auth/session` route after `syncEmployee()`.

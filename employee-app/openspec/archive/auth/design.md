# Design: Authentication & Session Management

> Status: **SHIPPED** — Retrospective SDD artifact.

---

## Component Breakdown

### New Components
| Component | Type | Path | Responsibility |
|---|---|---|---|
| `UserMenu` | Client Component | `components/auth/user-menu.tsx` | Avatar dropdown with sign-out action |
| `GoogleSignInButton` | Client Component | `components/auth/google-sign-in-button.tsx` | Triggers Supabase Google OAuth flow |
| Sign-in page | Server Component | `app/sign-in/page.tsx` (or root `/`) | Sign-in form UI |
| Auth callback | Route Handler | `app/auth/callback/route.ts` | Exchanges code for session, sets cookies |

### Existing / Utility
| Module | Path | Responsibility |
|---|---|---|
| `middleware.ts` | `middleware.ts` | Edge middleware — token validation, silent refresh, cookie rewrite, route guard |
| `lib/auth/shared.ts` | `lib/auth/shared.ts` | Token validation, refresh, cookie config, domain check, user mapping |
| `lib/auth/server.ts` | `lib/auth/server.ts` | `getCurrentEmployeeUser()`, `requireEmployeeUser()` — server-only helpers |
| `lib/employee/sync.ts` | `lib/employee/sync.ts` | `syncEmployee()` — upsert employee record on every authenticated Server Action |

---

## Data Flow

### Sign-In Flow
```
Browser
  → GET / (sign-in page)
  → clicks "Sign in with Google"
  → Supabase OAuth redirect → Google consent
  → GET /auth/callback?code=XXX
  → Route Handler: exchanges code → Supabase session
  → Sets bh_employee_at + bh_employee_rt cookies
  → Redirect → /modules
```

### Per-Request Auth Flow (Middleware)
```
Browser Request
  → middleware.ts (edge)
      ├─ path in publicPaths? → pass through
      ├─ has bh_employee_at?
      │   ├─ valid (getEmployeeUserFromAccessToken) → rewrite cookies → pass through
      │   └─ invalid → has bh_employee_rt?
      │       ├─ valid (refreshEmployeeSession) → set new cookies → pass through
      │       └─ invalid → clearAuthCookies → redirect /
      └─ no bh_employee_at → isPublicRoute? pass through : redirect /
```

### Server Component Auth
```
Server Component
  → requireEmployeeUser()
      → getCurrentEmployeeUser()
          → reads cookies()
          → getEmployeeUserFromAccessToken(accessToken)
              → supabase.auth.getUser(token)
              → isAllowedEmployeeUser(mapped) → domain check || ADMIN role DB lookup
          → if invalid: refreshEmployeeSession(refreshToken)
      → if null: redirect('/')
      → return AuthenticatedEmployeeUser
```

### Employee Sync (per Server Action)
```
Server Action
  → ensureEmployee() / syncEmployee()
      → lookup by clerk_user_id in presence.employees
      → if found: UPDATE (email, full_name, avatar_url)
      → if not found: lookup by email
          → if found: UPDATE (clerk_user_id, ...)
          → if not found: INSERT
              → on 23505: retry email lookup → UPDATE
      → return SyncedEmployee { id, full_name, email, is_active, role }
```

---

## File Layout

```
middleware.ts                          ← Edge auth middleware
lib/
  auth/
    shared.ts                          ← server-only: token ops, cookie config, domain check
    server.ts                          ← server-only: getCurrentEmployeeUser, requireEmployeeUser
  employee/
    sync.ts                            ← server-only: syncEmployee upsert
  supabase/
    admin.ts                           ← createSupabaseAdminClient (service role)
  env.ts                               ← getServerEnv() — typed env access
app/
  page.tsx                             ← Sign-in page (root route)
  sign-up/
    page.tsx                           ← Sign-up page
  auth/
    callback/
      route.ts                         ← OAuth callback handler
components/
  auth/
    user-menu.tsx                      ← Avatar + sign-out dropdown
    google-sign-in-button.tsx          ← Google OAuth trigger
```

---

## Database Schema

```sql
-- Schema: presence

CREATE TABLE presence.roles (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code      text NOT NULL UNIQUE,    -- e.g. 'ADMIN', 'EMPLOYEE'
  name      text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE presence.employees (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id  text UNIQUE,        -- NOTE: stores Supabase auth UUID despite column name
  email          text NOT NULL UNIQUE,
  full_name      text,
  avatar_url     text,
  is_active      boolean NOT NULL DEFAULT true,
  role_id        uuid NOT NULL REFERENCES presence.roles(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by auth user id
CREATE INDEX employees_clerk_user_id_idx ON presence.employees(clerk_user_id);
```

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (auth operations) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (admin DB operations — server only) |
| `COMPANY_EMAIL_DOMAIN` | ✅ | e.g. `bithealth.id` — restricts employee sign-in |

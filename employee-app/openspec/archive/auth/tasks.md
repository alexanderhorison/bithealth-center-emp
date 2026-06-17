# Tasks: Authentication & Session Management

> Status: **SHIPPED** — Retrospective SDD artifact.
> All tasks below are completed. Listed in implementation order for reference.

---

## Phase 1 — Infrastructure (Blocking)

- [infra] Create `presence` schema in Supabase database
- [infra] Create `presence.roles` table with columns: `id`, `code` (UNIQUE), `name`, `is_system`, `created_at`
- [infra] Seed default roles: `EMPLOYEE` and `ADMIN`
- [infra] Create `presence.employees` table with columns: `id`, `clerk_user_id` (UNIQUE), `email` (UNIQUE), `full_name`, `avatar_url`, `is_active`, `role_id` (FK → roles), `created_at`, `updated_at`
- [infra] Add index on `presence.employees(clerk_user_id)` for fast token-to-employee lookups
- [infra] Enable Google OAuth provider in Supabase Auth dashboard
- [infra] Configure `COMPANY_EMAIL_DOMAIN`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` in environment
- [infra] Apply RLS policies on `presence.employees`: allow service role full access; deny anon/authenticated direct access (all reads go through admin client)
  - Verification: `select * from presence.employees` with anon key returns permission denied

## Phase 2 — Auth Core

- [backend] Implement `lib/env.ts` — typed `getServerEnv()` with all required env var validation
- [backend] Implement `lib/supabase/admin.ts` — `createSupabaseAdminClient()` using service role key
- [backend] Implement `lib/auth/shared.ts`:
  - Cookie constants (`bh_employee_at`, `bh_employee_rt`)
  - `getEmployeeAuthCookieConfig()` — cookie options factory
  - `isAllowedEmployeeEmail()` — domain check
  - `mapSupabaseUser()` — Supabase `User` → `AuthenticatedEmployeeUser`
  - `getEmployeeUserFromAccessToken()` — validate token + domain/ADMIN check
  - `refreshEmployeeSession()` — refresh + re-validate
  - Verification: unit test domain check with company and non-company emails
- [backend] Implement `lib/auth/server.ts`:
  - `getCurrentEmployeeUser()` — reads cookies, validates or refreshes
  - `requireEmployeeUser()` — redirects to `/` if unauthenticated
  - Verification: calling `requireEmployeeUser()` from a Server Component without cookies redirects to `/`
- [backend] Implement `lib/employee/sync.ts` — `syncEmployee()` with three-path upsert logic (by `clerk_user_id` → by email → insert → on 23505 fallback)
  - Verification: call `syncEmployee()` twice with the same user — second call updates without error

## Phase 3 — Middleware

- [backend] Implement `middleware.ts`:
  - Public path list (`/`, `/auth/callback`, `/api/auth/session`, `/api/auth/sign-out`)
  - Token validation flow (access → refresh fallback → clear + redirect)
  - Cookie rewrite on every passing request
  - Authenticated user visiting `/` → redirect `/modules`
  - Matcher config: excludes static files
  - Verification: visit `/modules` without cookies → redirect to `/`; valid session → passes through

## Phase 4 — UI

- [frontend] Implement sign-in page at `/` — Google sign-in button + email/password form
- [frontend] Implement `components/auth/google-sign-in-button.tsx` — calls `supabase.auth.signInWithOAuth`
- [frontend] Implement `app/auth/callback/route.ts` — exchange OAuth code → set cookies → redirect `/modules`
- [frontend] Implement sign-up page at `/sign-up`
- [frontend] Implement `components/auth/user-menu.tsx` — avatar, name, email display + sign-out action
- [frontend] Implement sign-out API route / Server Action — clears cookies, redirects to `/`
  - Verification: sign in with Google → land on `/modules` → sign out → land on `/` → `/modules` redirects back to `/`

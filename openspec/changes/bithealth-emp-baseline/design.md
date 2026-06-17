# Design: Bithealth Center Employee App — Baseline Architecture

## Directory Layout

```
app/
  (employee)/                  # Route group — requires authentication
    layout.tsx                 # Shared layout with AppFooter
    dashboard/
      page.tsx                 # Redirects to /presence
    modules/
      page.tsx                 # Server Component: module hub grid
    presence/
      page.tsx                 # Server Component: fetches today's record + last 7
      actions.ts               # 'use server': submitPresenceAction, uploadSelfieAction
      _components/
        presence-form.tsx      # 'use client': status buttons + selfie upload + note
        presence-history.tsx   # 'use client': list of last 7 presence entries
    account-request/
      page.tsx                 # Server Component: fetches request history
      actions.ts               # 'use server': createAccessRequestAction
      _components/
        account-request-form.tsx  # 'use client': provider/type/fields form
        request-history.tsx       # 'use client': paginated history table
  api/
    auth/
      session/route.ts         # POST: exchange tokens → set httpOnly cookies
      sign-out/route.ts        # POST: clear cookies
  auth/
    callback/
      page.tsx                 # 'use client': polls Supabase session, POSTs to /api/auth/session
  page.tsx                     # Public: sign-in page (Google OAuth button)
  layout.tsx                   # Root layout: fonts, providers, bg-stone-100
  providers.tsx                # TanStack Query provider + 30s stale time

components/
  auth/
    auth-shell.tsx             # Sign-in page layout wrapper
    google-sign-in-button.tsx  # OAuth initiation button
    user-menu.tsx              # Dropdown: avatar, name, sign-out
  layout/
    app-footer.tsx             # Footer for authenticated pages
  pwa/
    register-service-worker.tsx
  ui/                          # shadcn/ui: Button, Card, Input, Label, Textarea

lib/
  auth/
    server.ts                  # requireEmployeeUser(), getCurrentEmployeeUser()
    shared.ts                  # mapEmployee(), cookieConfig, token validation
  employee/
    sync.ts                    # syncEmployee() — 3-step upsert
  supabase/
    admin.ts                   # createAdminClient() — service role (server-only)
    browser.ts                 # createBrowserClient() — anon key (auth callback only)
  validations/
    presence.ts                # Zod: PresenceFormSchema, SubmitPresenceSchema
    access-request.ts          # Zod: AccessRequestFormSchema, SearchParamsSchema
  env.ts                       # Server env: validates all SUPABASE_* vars
  env.client.ts                # Client env: NEXT_PUBLIC_* vars only

store/
  use-presence-form.ts         # Zustand: { status, setStatus } — UI sync for presence form

middleware.ts                  # Edge: validates bh_employee_at, refreshes if expired
```

---

## Authentication Flow

```
1. User clicks "Sign in with Google"
   └─ google-sign-in-button.tsx → supabase.auth.signInWithOAuth()
      └─ Redirects to Google → returns to /auth/callback?code=...

2. /auth/callback (client component)
   └─ supabase.auth.exchangeCodeForSession(code)
   └─ GET /api/auth/session with {access_token, refresh_token}

3. /api/auth/session (Route Handler)
   └─ Validates access token via Supabase
   └─ Checks email domain vs COMPANY_EMAIL_DOMAIN
   └─ Checks ADMIN role (bypasses domain check)
   └─ Sets httpOnly cookies: bh_employee_at (1h), bh_employee_rt (30d)
   └─ Returns 200 on success, 403 on domain mismatch

4. middleware.ts (runs on every non-public request)
   └─ Reads bh_employee_at cookie
   └─ If expired: uses bh_employee_rt to refresh → re-sets both cookies
   └─ If invalid: clears cookies, redirects to /
   └─ If valid: allows request through

5. Server Action (e.g. submitPresenceAction)
   └─ requireEmployeeUser() → extracts user from cookie
   └─ syncEmployee() → upsert employee record
   └─ Perform DB operation via createAdminClient().schema('presence')
```

---

## Data Layer

### Supabase Setup
- **Project URL:** `NEXT_PUBLIC_SUPABASE_URL`
- **Schema:** All tables in `presence` schema — queries use `.schema('presence')`
- **Access pattern:** Server Actions only use `createAdminClient()` (service role key) — never the anon key for mutations

### Schema Diagram

```
roles
  id (PK)
  code          -- "ADMIN" | "EMPLOYEE"
  name
  is_system

employees
  id (PK)
  clerk_user_id -- FK to Supabase Auth uid
  email
  full_name
  avatar_url
  is_active
  role_id       -- FK → roles.id

presences
  employee_id   -- FK → employees.id
  presence_date -- date
  status        -- PRESENT | WFH | NOT_PRESENT | GO_TO_CLIENT
  selfie_url
  note          -- max 250 chars
  updated_at
  UNIQUE (employee_id, presence_date)

access_requests
  id (PK)
  employee_id   -- FK → employees.id
  provider      -- GITHUB | FIGMA
  request_type  -- REPO_ACCESS | NEW_REPO | FIGMA_FILE | FIGMA_PROJECT
  target_url
  display_name  -- 2-120 chars
  justification -- 5-500 chars
  extra_info    -- max 500 chars, nullable
  status        -- PENDING | APPROVED | DENIED
  admin_note    -- nullable
  resolved_by   -- nullable
  resolved_at   -- nullable timestamptz
  created_at
```

### Storage
- **Bucket:** `presence-selfies`
- **Upload path:** `uploadSelfieAction` → `{supabaseUserId}/{YYYY-MM-DD}/{uuid}.{ext}`
- **Client never touches storage directly** — upload goes through Server Action which uses admin client

---

## Component Architecture

### Presence Module
```
presence/page.tsx (Server Component)
  → fetches: today's presence record + last 7 records
  → passes: presenceToday, recentPresences as props
  ↓
  _components/presence-form.tsx ('use client')
    → Zustand: usePresenceFormStore (selected status ↔ hidden form input)
    → React Hook Form + PresenceFormSchema (Zod)
    → TanStack Query useMutation → submitPresenceAction
    → File input → useMutation → uploadSelfieAction → selfie URL stored in form
    → Status buttons: PRESENT | WFH | NOT_PRESENT | GO_TO_CLIENT
    → Optional: selfie upload, note textarea

  _components/presence-history.tsx ('use client')
    → Renders list of last 7 presences
    → Shows: date, status badge, note excerpt, selfie thumbnail
```

### Account Request Module
```
account-request/page.tsx (Server Component)
  → fetches: paginated access requests for current employee
  → reads: page, pageSize from searchParams (validated with SearchParamsSchema)
  ↓
  _components/account-request-form.tsx ('use client')
    → React Hook Form + AccessRequestFormSchema (Zod)
    → Cross-field validation: targetUrl required when type is REPO_ACCESS or FIGMA_FILE
    → TanStack Query useMutation → createAccessRequestAction
    → Provider selector (GITHUB | FIGMA) → drives requestType options

  _components/request-history.tsx ('use client')
    → Paginated table with prev/next controls
    → Status badges: PENDING (yellow) | APPROVED (green) | DENIED (red)
    → Columns: display name, provider, type, status, admin note, date
```

---

## Validation Schemas (Zod)

### `lib/validations/presence.ts`
```ts
PresenceStatusEnum = z.enum(['PRESENT', 'WFH', 'NOT_PRESENT', 'GO_TO_CLIENT'])

PresenceFormSchema = z.object({
  status: PresenceStatusEnum,
  selfieUrl: z.string().url().or(z.literal('')).optional(),
  note: z.string().max(250).optional(),
})
```

### `lib/validations/access-request.ts`
```ts
ProviderEnum = z.enum(['GITHUB', 'FIGMA'])
RequestTypeEnum = z.enum(['REPO_ACCESS', 'NEW_REPO', 'FIGMA_FILE', 'FIGMA_PROJECT'])

AccessRequestFormSchema = z.object({
  provider: ProviderEnum,
  requestType: RequestTypeEnum,
  targetUrl: z.string().url().optional(),
  displayName: z.string().min(2).max(120),
  justification: z.string().min(5).max(500),
  extraInfo: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  // targetUrl required when type is REPO_ACCESS or FIGMA_FILE
})

SearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.union([z.literal(10), z.literal(20)]).default(10),
})
```

---

## Planned Module Designs

### Leave Request (Planned)

**Proposed schema:**
```sql
CREATE TABLE presence.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES presence.employees(id),
  leave_type text NOT NULL CHECK (leave_type IN ('ANNUAL', 'SICK', 'PERSONAL', 'UNPAID')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DENIED')),
  approver_id uuid REFERENCES presence.employees(id),
  approver_note text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Route:** `/leave-request`
**Pattern:** Same Server Component + `_components/` structure as Account Request

### Asset Request (Planned)

**Proposed schema:**
```sql
CREATE TABLE presence.asset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES presence.employees(id),
  asset_type text NOT NULL,
  asset_name text NOT NULL,
  justification text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'FULFILLED', 'DENIED')),
  ops_note text,
  fulfilled_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Route:** `/asset-request`
**Pattern:** Same Server Component + `_components/` structure as Account Request

---

## Environment & Deployment

```
.env.local
  NEXT_PUBLIC_SUPABASE_URL      - public (browser-safe)
  NEXT_PUBLIC_SUPABASE_ANON_KEY - public (browser-safe, limited RLS access)
  SUPABASE_SERVICE_ROLE_KEY     - secret (server-only, bypasses RLS)
  COMPANY_EMAIL_DOMAIN          - secret (e.g. "bithealth.com")
```

**Docker:** Multi-stage build, Node 20 Alpine, `next build` with `output: 'standalone'`, non-root `nextjs` user, port 3000.

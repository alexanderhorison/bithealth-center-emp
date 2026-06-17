# Design: Account Request

> Status: **SHIPPED** — Retrospective SDD artifact.

---

## Component Breakdown

### New Components (this feature)
| Component | Type | Path | Responsibility |
|---|---|---|---|
| Account Request page | Server Component | `app/(employee)/account-request/page.tsx` | Auth, search param parsing, data fetch, page render |
| `AccountRequestForm` | Client Component | `app/(employee)/account-request/_components/account-request-form.tsx` | Provider/type form with conditional fields + submit mutation |
| `RequestHistory` | Client Component | `app/(employee)/account-request/_components/request-history.tsx` | Collapsible paginated history list |

### Reused Components
| Component | Path | Responsibility |
|---|---|---|
| `requireEmployeeUser()` | `lib/auth/server.ts` | Auth enforcement |
| `syncEmployee()` | `lib/employee/sync.ts` | Upsert employee record |
| shadcn/ui `Card`, `Button`, `Input`, `Label`, `Textarea`, `Select` | `components/ui/` | Form primitives |

---

## Data Flow

### Page Load (Server)
```
app/(employee)/account-request/page.tsx (server)
  → requireEmployeeUser()
  → syncEmployee({ userId, email, fullName, avatarUrl })     — upsert, get employee.id
  → parse searchParams with accessRequestSearchParamsSchema  — page, pageSize (defaults: 1, 10)
  → fetchAccessRequests(employee.id, { page, pageSize })     — ordered by created_at DESC
  → render <AccountRequestForm /> + <RequestHistory requests={...} pagination={...} />
```

### Form Submit (Client → Server Action)
```
AccountRequestForm (client)
  → RHF handleSubmit(onSubmit)
  → submitMutation.mutate({ provider, requestType, displayName, targetUrl, justification, additionalInfo })
      → createAccessRequestAction(input)   [Server Action]
          → requireEmployeeUser()
          → createAccessRequestSchema.safeParse(input)   — re-validate server-side
          → syncEmployee(...)                             — ensure fresh employee.id
          → supabaseAdmin.schema('presence').from('access_requests').insert({
              employee_id, provider, request_type, target_url, display_name,
              justification, extra_info
            })
          → revalidatePath('/account-request')
          → return { success: true, message: 'Request submitted' }
  → on success: reset(), toast success
  → on error: display error message
```

### Pagination (Client → URL)
```
RequestHistory (client)
  → user clicks page N
  → router.push(`/account-request?page=${N}`)
  → page.tsx re-runs on server with new searchParams
  → fetchAccessRequests(employee.id, { page: N, pageSize })
  → new page of results rendered
```

---

## File Layout

```
app/
  (employee)/
    account-request/
      page.tsx                             ← Server Component
      actions.ts                           ← createAccessRequestAction
      _components/
        account-request-form.tsx           ← 'use client' — form + submit mutation
        request-history.tsx                ← 'use client' — collapsible paginated list

lib/
  validations/
    access-request.ts                      ← createAccessRequestSchema, accessRequestSearchParamsSchema (Zod)
  supabase/
    admin.ts                               ← reused: createSupabaseAdminClient
```

---

## Database Schema

```sql
-- In schema: presence

CREATE TYPE presence.access_request_provider AS ENUM ('GITHUB', 'FIGMA');
CREATE TYPE presence.access_request_type AS ENUM (
  'REPO_ACCESS',
  'NEW_REPO',
  'FIGMA_FILE',
  'FIGMA_PROJECT'
);

-- Status type — defines lifecycle states for a request
CREATE TYPE presence.access_request_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

CREATE TABLE presence.access_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   uuid NOT NULL REFERENCES presence.employees(id) ON DELETE CASCADE,
  provider      presence.access_request_provider NOT NULL,
  request_type  presence.access_request_type NOT NULL,
  target_url    text,
  display_name  text NOT NULL,
  justification text NOT NULL,
  extra_info    text,
  status        presence.access_request_status NOT NULL DEFAULT 'PENDING',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX access_requests_employee_id_created_at_idx
  ON presence.access_requests(employee_id, created_at DESC);
```

---

## Zod Schemas

```ts
// lib/validations/access-request.ts

export const accessRequestProviderSchema = z.enum(['GITHUB', 'FIGMA']);
export const accessRequestTypeSchema = z.enum(['REPO_ACCESS', 'NEW_REPO', 'FIGMA_FILE', 'FIGMA_PROJECT']);

export const createAccessRequestSchema = z.object({
  provider:       accessRequestProviderSchema,
  requestType:    accessRequestTypeSchema,
  targetUrl:      z.string().trim(),
  displayName:    z.string().min(2).max(120),
  justification:  z.string().min(5).max(500),
  additionalInfo: z.string().max(500).optional().or(z.literal(''))
}).superRefine((value, ctx) => {
  // Cross-field: provider ↔ type compatibility
  const isGithubType = value.requestType === 'REPO_ACCESS' || value.requestType === 'NEW_REPO';
  const isFigmaType  = value.requestType === 'FIGMA_FILE'  || value.requestType === 'FIGMA_PROJECT';
  if ((value.provider === 'GITHUB' && !isGithubType) || (value.provider === 'FIGMA' && !isFigmaType)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['requestType'],
      message: 'Invalid request type for selected provider' });
  }
  // Cross-field: URL required for REPO_ACCESS and FIGMA_FILE
  const isUrlRequired = value.requestType === 'REPO_ACCESS' || value.requestType === 'FIGMA_FILE';
  if (isUrlRequired && !value.targetUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetUrl'],
      message: 'Target URL is required for this request type' });
    return;
  }
  if (value.targetUrl && !z.string().url().safeParse(value.targetUrl).success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetUrl'],
      message: 'Please enter a valid URL' });
  }
});

export const accessRequestSearchParamsSchema = z.object({
  page:     z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1)).optional(),
  pageSize: z.enum(['10', '20']).transform(Number).optional()
});
```

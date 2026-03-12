# Design: Presence Tracking

> Status: **SHIPPED** — Retrospective SDD artifact.

---

## Component Breakdown

### New Components (this feature)
| Component | Type | Path | Responsibility |
|---|---|---|---|
| Presence page | Server Component | `app/(employee)/presence/page.tsx` | Auth, employee sync, parallel data fetch, render gate |
| `PresenceForm` | Client Component | `app/(employee)/presence/_components/presence-form.tsx` | Status selector, selfie upload, note, submit |
| `loading.tsx` | — | `app/(employee)/presence/loading.tsx` | Skeleton placeholders shown during server fetch |
| `error.tsx` | Client Component | `app/(employee)/presence/error.tsx` | Error boundary with Retry button |

### Reused Components
| Component | Path | Responsibility |
|---|---|---|
| `requireEmployeeUser()` | `lib/auth/server.ts` | Auth session enforcement |
| `syncEmployee()` | `lib/employee/sync.ts` | Upsert employee record on load |
| shadcn/ui `Card`, `Button`, `Input`, `Label`, `Textarea` | `components/ui/` | Form primitives |

---

## Data Flow

### Page Load (Server)
```
app/(employee)/presence/page.tsx (server)
  → requireEmployeeUser()                        — validate session
  → Promise.all([
      syncEmployee({ userId, email, ... }),       — upsert employee, get { id, is_active, role }
      fetchRecentPresences(userId, limit=7)       — last 7 records, date DESC
    ])
  → if employee.is_active === false:
      → render <InactiveAccountMessage />
  → else:
      → render <PresenceForm employee={employee} history={recentPresences} />
```

### Selfie Upload (Client → Server Action)
```
PresenceForm (client)
  → user picks file
  → onChange: validate type + size client-side
  → onUpload click: build FormData { file }
  → uploadSelfieAction(formData)   [Server Action]
      → getCurrentEmployeeUser()
      → validate MIME type + size (server-side re-validation)
      → ext = getSelfieExtension(file)
      → filePath = `{userId}/{date}/{uuid}.{ext}`
      → supabaseAdmin.storage.from('presence-selfies').upload(filePath, buffer, { upsert: false })
      → return { success: true, url: publicUrl }
  → store url in form state (RHF setValue('selfieUrl', url))
```

### Presence Submit (Client → Server Action)
```
PresenceForm (client)
  → RHF handleSubmit(onSubmit)
  → submitPresenceMutation.mutate({ status, selfieUrl, note })
      → submitPresenceAction(input)   [Server Action]
          → submitPresenceSchema.parse(input)       — Zod validation
          → ensureEmployee()                         — getCurrentEmployeeUser + syncEmployee
          → date = new Date().toISOString().slice(0, 10)
          → supabaseAdmin.schema('presence').from('presences').upsert(
              { employee_id, presence_date: date, status, selfie_url, note },
              { onConflict: 'employee_id,presence_date' }
            )
          → revalidatePath('/presence')
          → return { success: true, message: 'Presence updated successfully' }
  → on success: toast / success state
  → on error: display message
```

---

## File Layout

```
app/
  (employee)/
    presence/
      page.tsx                          ← Server Component — orchestrates page
      loading.tsx                       ← Skeleton loading state
      error.tsx                         ← Error boundary with Retry
      actions.ts                        ← submitPresenceAction, uploadSelfieAction
      _components/
        presence-form.tsx               ← 'use client' — form + upload + mutations

lib/
  validations/
    presence.ts                         ← presenceStatusSchema, submitPresenceSchema (Zod)
  supabase/
    admin.ts                            ← reused: createSupabaseAdminClient
```

---

## Database Schema

```sql
-- In schema: presence

CREATE TYPE presence.presence_status AS ENUM (
  'PRESENT',
  'WFH',
  'NOT_PRESENT',
  'GO_TO_CLIENT'
);

CREATE TABLE presence.presences (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    uuid NOT NULL REFERENCES presence.employees(id) ON DELETE CASCADE,
  presence_date  date NOT NULL,
  status         presence.presence_status NOT NULL,
  selfie_url     text,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT presences_employee_date_unique UNIQUE (employee_id, presence_date)
);

CREATE INDEX presences_employee_id_date_idx
  ON presence.presences(employee_id, presence_date DESC);
```

---

## Storage Configuration

| Property | Value |
|---|---|
| Bucket name | `presence-selfies` |
| Access | Public (getPublicUrl returns direct URL) |
| File path pattern | `{userId}/{YYYY-MM-DD}/{uuid}.{ext}` |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Max size | 5MB |
| Upsert | `false` — each upload is a unique file |

---

## State Management

| State | Location | Reason |
|---|---|---|
| Current status (display) | Zustand store | Persists status across component re-renders, synced with RHF |
| Form values (submit) | React Hook Form | Handles validation + submission |
| Upload mutation | TanStack Query `useMutation` | Loading/error state for selfie upload |
| Submit mutation | TanStack Query `useMutation` | Loading/error state for presence submission |

> ⚠️ GAP-PRES-02: Dual state (Zustand + RHF) for status creates sync complexity. Consider removing Zustand and using RHF `watch('status')` as the single source of truth.

---

## Zod Schema

```ts
// lib/validations/presence.ts
export const presenceStatusSchema = z.enum(['PRESENT', 'WFH', 'NOT_PRESENT', 'GO_TO_CLIENT']);

export const submitPresenceSchema = z.object({
  status:    presenceStatusSchema,
  selfieUrl: z.string().url().optional().or(z.literal('')),
  note:      z.string().max(250).optional().or(z.literal(''))
});
```

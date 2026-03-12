# Spec: Account Request

> Status: **SHIPPED** — Living spec derived from code analysis.
> Schema: `presence` (Supabase)
> Key files: `app/(employee)/account-request/`, `lib/validations/access-request.ts`

---

## Overview

Employees request access to external tools — currently GitHub repositories/organizations and Figma files/projects. Each request is submitted to admins for review. The page shows a submission form and a paginated history of the employee's past requests with their current status.

---

## Functional Requirements

### Request Submission
1. **FR-ACCT-01** — When an employee submits a request, the system shall create a new record in `presence.access_requests` with status `PENDING`.
2. **FR-ACCT-02** — The system shall support two providers: `GITHUB` and `FIGMA`.
3. **FR-ACCT-03** — GitHub requests shall support two types: `REPO_ACCESS` (access to existing repo) and `NEW_REPO` (create new repo).
4. **FR-ACCT-04** — Figma requests shall support two types: `FIGMA_FILE` (access to existing file) and `FIGMA_PROJECT` (create/access project).
5. **FR-ACCT-05** — When the provider changes, the system shall automatically reset the request type to the first valid type for that provider.
6. **FR-ACCT-06** — `targetUrl` shall be required for `REPO_ACCESS` and `FIGMA_FILE`, and optional for `NEW_REPO` and `FIGMA_PROJECT`.
7. **FR-ACCT-07** — When `targetUrl` is provided, it must be a valid URL.
8. **FR-ACCT-08** — `displayName` is required (min 2, max 120 chars). `justification` is required (min 5, max 500 chars). `additionalInfo` is optional (max 500 chars).
9. **FR-ACCT-09** — When submission succeeds, the system shall reset the form to defaults (`GITHUB`, `REPO_ACCESS`) and revalidate `/account-request`.

### Request History
10. **FR-ACCT-10** — The system shall display the employee's requests in a collapsible history panel, ordered by `created_at` descending.
11. **FR-ACCT-11** — The history shall be paginated: 10 records per page by default, with prev/next navigation via URL search params (`?page=N&pageSize=N`).
12. **FR-ACCT-12** — Each history row shall show: provider badge, request type, status badge, display name, target URL (as link), justification, additional info, created date, resolved date (if any), and admin note (if any).
13. **FR-ACCT-13** — Search params (`page`, `pageSize`) shall be validated with Zod before use; invalid values fall back to defaults (page 1, size 10).

### Admin Review (out of scope for this app)
- Admin approval/denial UI lives in a separate admin application. This app only reads the `status`, `admin_note`, `resolved_by`, and `resolved_at` fields.

---

## Non-Functional Requirements

- **NFR-ACCT-01** — DB error on history load must be shown as an inline error banner, not a page crash.
- **NFR-ACCT-02** — Pagination must use URL params (not state) so the page is bookmarkable and shareable.
- **NFR-ACCT-03** — The submit button must be disabled while the mutation is pending.

---

## Data Model

### `presence.access_requests` table (inferred)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `employee_id` | uuid FK | References `presence.employees.id` |
| `provider` | enum | `GITHUB \| FIGMA` |
| `request_type` | enum | `REPO_ACCESS \| NEW_REPO \| FIGMA_FILE \| FIGMA_PROJECT` |
| `target_url` | text | Required for REPO_ACCESS, FIGMA_FILE |
| `display_name` | text | Short name, 2–120 chars |
| `justification` | text | 5–500 chars |
| `extra_info` | text\|null | 0–500 chars |
| `status` | enum | `PENDING \| APPROVED \| DENIED` |
| `admin_note` | text\|null | Set by admin on resolution |
| `resolved_by` | uuid\|null | Admin user ID |
| `resolved_at` | timestamptz\|null | |
| `created_at` | timestamptz | Auto-set |

### Zod Schema (cross-field validation)
```ts
createAccessRequestSchema = z.object({
  provider: z.enum(['GITHUB', 'FIGMA']),
  requestType: z.enum(['REPO_ACCESS', 'NEW_REPO', 'FIGMA_FILE', 'FIGMA_PROJECT']),
  targetUrl: z.string().trim(),
  displayName: z.string().min(2).max(120),
  justification: z.string().min(5).max(500),
  additionalInfo: z.string().max(500).optional().or(z.literal(''))
}).superRefine(/* provider↔type cross-validation + URL required/optional logic */)
```

### Request Type ↔ Provider Matrix
| Provider | Valid Types | URL Required |
|---|---|---|
| GITHUB | REPO_ACCESS, NEW_REPO | REPO_ACCESS only |
| FIGMA | FIGMA_FILE, FIGMA_PROJECT | FIGMA_FILE only |

---

## Component Map

```
app/(employee)/account-request/
  page.tsx                          [server] — auth, employee sync, DB fetch (paginated), render
  actions.ts                        [server] — createAccessRequestAction
  _components/
    account-request-form.tsx        [client] — provider selector, type select, fields, submit
    request-history.tsx             [server-renderable] — collapsible history + pagination
```

### Data Flow
```
page.tsx (server)
  → requireEmployeeUser() → syncEmployee()
  → parse & validate search params (page, pageSize)
  → fetch paginated access_requests for employee
  → render <RequestHistory> (server) + <AccountRequestForm> (client)

AccountRequestForm (client)
  → provider change → auto-reset requestType
  → submit → createAccessRequestAction (Server Action) → form.reset() + router.refresh()
```

---

## Known Issues / Gap Analysis

- **GAP-ACCT-01** ✅ RESOLVED — `createAccessRequestAction` queries for an existing `PENDING` record with the same `employee_id + provider + request_type + target_url` before inserting. Returns `"You already have a pending request for this resource."` if found.
- **GAP-ACCT-02** ✅ RESOLVED — `RequestHistory` now renders a 10 / 20 per-page toggle using `<Link>` navigation (no client JS needed). Selecting a size navigates to `?page=1&pageSize=N`; active size is highlighted.
- **GAP-ACCT-03** ✅ RESOLVED — `normalizeUrl()` in `actions.ts` uses `new URL()` to lowercase scheme + host and strips trailing slashes from non-root paths. Runs before the duplicate check and before insert.
- **GAP-ACCT-04** — Requires email infrastructure (Resend + DB webhook or trigger). Deferred — no email service is currently configured.

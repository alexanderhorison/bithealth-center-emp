# Specs: Account Request

> Status: **SHIPPED** — Retrospective SDD artifact.

---

## Functional Requirements

### Page Load
- **FR-ACCT-01** — The page shall call `requireEmployeeUser()` before rendering; unauthenticated requests shall redirect to `/`.
- **FR-ACCT-02** — The page shall fetch the employee's access request history server-side, applying pagination from `?page` and `?pageSize` search params.
- **FR-ACCT-03** — Default page shall be `1`; default page size shall be `10`.
- **FR-ACCT-04** — Search params shall be validated with `accessRequestSearchParamsSchema` (Zod); invalid values shall fall back to defaults.
- **FR-ACCT-05** — `pageSize` shall accept only `10` or `20`; any other value shall default to `10`.

### Request Form — Provider & Type
- **FR-ACCT-06** — The form shall present a provider selector with options: `GITHUB` and `FIGMA`.
- **FR-ACCT-07** — The request type options shall be filtered based on the selected provider:
  - GITHUB → `REPO_ACCESS`, `NEW_REPO`
  - FIGMA → `FIGMA_FILE`, `FIGMA_PROJECT`
- **FR-ACCT-08** — Switching provider shall reset the request type field to prevent invalid provider/type combinations.

### Request Form — Fields
- **FR-ACCT-09** — `displayName` shall be required, minimum 2 characters, maximum 120 characters.
- **FR-ACCT-10** — `justification` shall be required, minimum 5 characters, maximum 500 characters.
- **FR-ACCT-11** — `additionalInfo` (extra info) shall be optional, maximum 500 characters.
- **FR-ACCT-12** — `targetUrl` shall be conditionally required:
  - Required for: `REPO_ACCESS`, `FIGMA_FILE`
  - Optional for: `NEW_REPO`, `FIGMA_PROJECT`
- **FR-ACCT-13** — When `targetUrl` is provided, it shall be validated as a valid URL (`z.string().url()`).
- **FR-ACCT-14** — Provider/type cross-validation shall use Zod `superRefine` — mismatched provider/type combinations shall produce a field-level error on `requestType`.

### Form Submission
- **FR-ACCT-15** — On submit, the system shall call `createAccessRequestAction(input)`.
- **FR-ACCT-16** — The Server Action shall re-validate all inputs with `createAccessRequestSchema.safeParse()` before any DB operation.
- **FR-ACCT-17** — On successful insert, the system shall call `revalidatePath('/account-request')` and return `{ success: true }`.
- **FR-ACCT-18** — On DB error, the system shall return `{ success: false, message }`.
- **FR-ACCT-19** — On success, the form shall be reset to its initial state.

### Request History
- **FR-ACCT-20** — History shall be displayed in a collapsible section, showing requests ordered by `created_at` descending.
- **FR-ACCT-21** — Each history entry shall display: provider badge, request type, display name, justification, status badge, and creation date.
- **FR-ACCT-22** — History shall be paginated. The current page is controlled by the `?page` URL search param.
- **FR-ACCT-23** — Pagination controls shall update the URL (`?page=N`) for deep-linking.

---

## Non-Functional Requirements

- **NFR-ACCT-01** — The page shall be a Server Component; only the form and history interaction require `'use client'`.
- **NFR-ACCT-02** — Form validation errors shall appear inline at the field level (React Hook Form + Zod).
- **NFR-ACCT-03** — The layout shall be mobile-first and usable at ≥ 375px.

---

## Out of Scope

- Admin view to approve/reject requests
- Email notifications to employee on status change (known gap: GAP-ACCT-04)
- Duplicate request prevention for PENDING requests (known gap: GAP-ACCT-01)
- Editing or cancelling an existing request
- URL normalization / trailing slash cleanup (known gap: GAP-ACCT-03)
- File attachments alongside the request

---

## Provider ↔ Type Matrix

| Provider | Valid Request Types | URL Required? |
|---|---|---|
| GITHUB | REPO_ACCESS | ✅ Yes |
| GITHUB | NEW_REPO | ❌ No |
| FIGMA | FIGMA_FILE | ✅ Yes |
| FIGMA | FIGMA_PROJECT | ❌ No |

---

## Edge Cases

| Scenario | Expected Behaviour |
|---|---|
| GITHUB provider + FIGMA_FILE type | Zod `superRefine` rejects: "Invalid request type for selected provider" |
| REPO_ACCESS type + empty `targetUrl` | Zod `superRefine` rejects: "Target URL is required for this request type" |
| `targetUrl` provided but not a valid URL | Zod rejects: "Please enter a valid URL" |
| `?page=0` or `?page=-1` | Fails `z.number().int().min(1)` — defaults to page 1 |
| `?pageSize=50` | Not in enum('10','20') — defaults to 10 |
| Employee submits same request twice | Both records inserted (no duplicate prevention — GAP-ACCT-01) |
| No request history yet | History section renders empty state |
| `?page` exceeds total pages | Returns empty list (no redirect — empty page) |

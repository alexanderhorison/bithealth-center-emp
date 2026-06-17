# CLAUDE.md — Bithealth Center Employee App

> Single source of truth for all conventions, stack, design system, and sub-agent definitions.
> All tools (Superpowers, OpenSpec) inherit context from this file.

---

## Project Overview

**App:** Employee self-service portal for Bithealth Center employees.
**Repo:** `employee-app` (standalone Next.js app)
**Primary modules:** Presence tracking, Account Request
**Auth:** Supabase (Google OAuth + email/password)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| React | React 18 |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (do NOT introduce additional UI libraries) |
| Auth | Supabase Auth (`@supabase/supabase-js`) |
| Server State | TanStack Query v5 |
| Client State | Zustand v5 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Containerization | Docker + Docker Compose |

---

## Project Structure

```
app/
  (employee)/           # Authenticated employee area
    dashboard/          # Redirects to /presence
    presence/           # Presence tracking module
    account-request/    # Account request module
    modules/            # Module directory page
    layout.tsx          # Shared layout with AppFooter
  auth/                 # Auth callbacks
  sign-in/              # Sign-in page
  sign-up/              # Sign-up page
  layout.tsx            # Root layout (fonts, providers)
  providers.tsx         # TanStack Query + other providers
components/
  auth/                 # Auth shell, user menu, Google sign-in button
  layout/               # AppFooter, shared layout components
  ui/                   # shadcn/ui primitives (button, card, input, label, textarea)
lib/                    # Utilities, Supabase client, shared logic
store/                  # Zustand stores
openspec/               # SDD spec artifacts (see SDD Workflow section)
```

---

## Design System

### Fonts
- **Primary:** Noto Sans JP + Manrope (loaded via `next/font`)
- **Monospace:** IBM Plex Mono (for code/technical displays if needed)

### Visual Language
- MUJI-inspired minimalism: clean whitespace, neutral tones, subtle borders
- **Background:** `bg-stone-100` (root layout)
- **No shadows** on cards/panels — use subtle borders instead
- **Border radius:** flat/minimal (`rounded-none` or `rounded-sm` preferred, never `rounded-xl` or larger)
- Neutral color palette: stone, slate, zinc tones

### Tailwind Tokens (CSS variables)
- `--background`, `--foreground`, `--border`, `--input`, `--ring`
- `--primary`, `--primary-foreground`
- `--muted`, `--muted-foreground`
- `--card`, `--card-foreground`
- `--destructive`, `--destructive-foreground`

### Component Rules
- Use shadcn/ui primitives from `components/ui/` — do not re-implement
- Do NOT introduce Radix UI directly, MUI, Chakra, Mantine, or any other UI library
- Custom components live in `_components/` inside their route folder (colocation pattern)

---

## Architecture Patterns

### Next.js App Router Conventions
- Server Components by default; add `'use client'` only when needed (event handlers, hooks, browser APIs)
- Route-specific components in `_components/` subdirectories (colocation)
- Shared components in `components/` at root
- `layout.tsx` wraps persistent UI (header, footer, nav)
- `error.tsx` and `loading.tsx` for route-level error and suspense boundaries

### Data Fetching
- **Server:** fetch in Server Components or Server Actions
- **Client:** TanStack Query v5 (`useQuery`, `useMutation`, `useQueryClient`)
- Supabase client: use the appropriate client helper for server vs client context

### State Management
- Server state: TanStack Query
- Client/UI state: Zustand (stores in `store/`)
- Form state: React Hook Form + Zod schemas

### Forms
- Always use React Hook Form + `zodResolver`
- Define Zod schemas co-located with forms or in `lib/schemas/`
- Use shadcn/ui form primitives (`Input`, `Label`, `Textarea`, `Button`)

### Authentication & Session
- **Flow:** Google OAuth → Supabase → `/auth/callback` → `POST /api/auth/session` → httpOnly cookies → middleware
- **Cookies:** `bh_employee_at` (access token, 1h TTL), `bh_employee_rt` (refresh token, 30d TTL)
- **Domain restriction:** Only emails matching `COMPANY_EMAIL_DOMAIN` may sign in; `ADMIN` role users bypass this
- **Middleware** (`middleware.ts`) validates/refreshes tokens on every non-public route
- **`syncEmployee()`**: On every authenticated action, upserts employee by `clerk_user_id` → by `email` → insert if new
- **No client-side Supabase calls** after auth callback — all DB access via Server Actions using admin client
- Auth UI components in `components/auth/`; auth callback at `app/auth/callback/`

### Server Actions (mutations)
- All mutations are Server Actions (`'use server'`) — no REST endpoints for data mutations
- `submitPresenceAction` — upsert today's presence record (status, selfie URL, note)
- `uploadSelfieAction` — upload selfie to `presence-selfies` bucket; max 5MB, JPEG/PNG/WEBP
- `createAccessRequestAction` — insert new access request
- TanStack Query `useMutation` wraps Server Actions on the client for loading/error state

---

## Data Models

All tables live in the Supabase `presence` schema (accessed via `.schema('presence')`).

### `employees`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `clerk_user_id` | text | Supabase auth user UUID |
| `email` | text | Unique |
| `full_name` | text \| null | |
| `avatar_url` | text \| null | |
| `is_active` | boolean | Default true; inactive blocks presence submission |
| `role_id` | uuid | FK → roles.id |

### `roles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `code` | text | e.g. `ADMIN`, `EMPLOYEE` |
| `name` | text | Display name |
| `is_system` | boolean | |

### `presences`
| Column | Type | Notes |
|---|---|---|
| `employee_id` | uuid | FK → employees.id |
| `presence_date` | date | |
| `status` | enum | PRESENT \| WFH \| NOT_PRESENT \| GO_TO_CLIENT |
| `selfie_url` | text \| null | Supabase Storage URL |
| `note` | text \| null | Max 250 chars |
| `updated_at` | timestamptz | |

Unique constraint: `(employee_id, presence_date)` — upsert on conflict.

### `access_requests`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `employee_id` | uuid | FK → employees.id |
| `provider` | enum | GITHUB \| FIGMA |
| `request_type` | enum | REPO_ACCESS \| NEW_REPO \| FIGMA_FILE \| FIGMA_PROJECT |
| `target_url` | text | Required for REPO_ACCESS, FIGMA_FILE |
| `display_name` | text | 2–120 chars |
| `justification` | text | 5–500 chars |
| `extra_info` | text \| null | Max 500 chars |
| `status` | enum | PENDING \| APPROVED \| DENIED (default PENDING) |
| `admin_note` | text \| null | Admin response |
| `resolved_by` | text \| null | Admin user ID |
| `resolved_at` | timestamptz \| null | |
| `created_at` | timestamptz | |

### Supabase Storage
- **Bucket:** `presence-selfies`
- **Path pattern:** `{userId}/{YYYY-MM-DD}/{uuid}.{ext}`
- **Constraints:** JPEG/PNG/WEBP, max 5MB

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/session` | POST | Exchange Supabase tokens → httpOnly cookies; validates domain + ADMIN role |
| `/api/auth/sign-out` | POST | Clear `bh_employee_at` and `bh_employee_rt` cookies |
| `/auth/callback` | GET | OAuth callback handler (Supabase redirect target) |

No other REST endpoints — all mutations use Server Actions.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
COMPANY_EMAIL_DOMAIN=
```

---

## Module Status

| Module | Route | Status |
|---|---|---|
| Authentication | `/sign-in`, `/auth/callback` | Implemented |
| Presence Tracking | `/presence` | Implemented |
| Account Request | `/account-request` | Implemented |
| Module Directory | `/modules` | Implemented |
| Dashboard | `/dashboard` | Redirect → /presence |
| Leave Request | `/leave-request` | Planned (Coming Soon) |
| Asset Request | `/asset-request` | Planned (Coming Soon) |

---

## Spec-Driven Development (SDD) Workflow

This project uses **Superpowers + OpenSpec** for spec-driven development.

### Methodology Stack
- **Superpowers** — brainstorming, planning, TDD, debugging, code review
- **OpenSpec** — formal spec artifacts (proposal → specs → design → tasks)

### Workflow Order
1. `/brainstorming` — Refine requirements before any code
2. `/opsx:propose <feature>` or `/opsx:ff <feature>` — Generate spec artifacts
3. Review and approve specs in `openspec/changes/<feature>/`
4. `/execute-plan` — TDD implementation with subagent delegation and code review
5. `/opsx:archive <feature>` — Archive completed specs

### Context Rules
- All conventions, tech stack, design system, and sub-agent definitions are defined HERE. Do not duplicate them in OpenSpec config.
- When generating specs via `/opsx:*` commands, apply all conventions defined here.
- When Superpowers skills activate, they must respect the architecture and patterns defined here.
- `openspec/project.md` references this file as the authoritative project context.

### Task Routing
- Database schema, migrations, RLS policies, Supabase config → **Infrastructure sub-agent** (Supabase MCP)
- UI components, pages, routing, styling → Follow MUJI design system + shadcn/ui conventions above
- API routes, middleware, business logic → Handle directly in server components / Server Actions
- Spec generation and planning → OpenSpec commands + Superpowers brainstorming

---

## Implementation Standards

### TDD
- Write failing test first → minimal implementation → refactor
- Co-locate tests with implementation where possible

### Code Review (two-stage via Superpowers)
1. Spec compliance check — does implementation match the approved spec?
2. Code quality check — patterns, naming, no unnecessary complexity

### Debugging (4-phase via Superpowers)
1. Reproduce & isolate
2. Identify root cause (don't guess)
3. Fix the root cause (not the symptom)
4. Verify fix + add regression test

### Branching
- Verify tests pass before merge/PR
- Use descriptive branch names: `feat/`, `fix/`, `chore/`

---

## Global Plugins, Agents & Skills

> Installed at `~/.claude/plugins/` — available in every session automatically.
> Always reach for the right tool before writing code from scratch.

---

### `warmstone-frontend` — ACTIVE
Frontend toolkit for Next.js + shadcn/ui with warmstone MUJI aesthetic.

| Tool | Type | What it does |
|---|---|---|
| `frontend-expert` | agent (Opus) | Builds, refactors, and reviews React/Next.js code. Applies DRY, TypeScript, design system. Uses shadcn MCP + Supabase MCP directly. Use for any substantial frontend task. |
| `shadcn-muji` | skill | shadcn/ui scaffolding via MCP + MUJI design overrides, `cva()` variant patterns, CSS variable theming. **Project font override:** use Noto Sans JP + Manrope, not the global defaults. |
| `nextjs-app-router` | skill | App Router conventions, Server/Client Components, Server Actions, layouts, data fetching, caching strategies. |
| `tanstack-query` | skill | Query key factory pattern, service layer, mutation patterns, optimistic updates, cache invalidation. |
| `ui-design` | skill | Warmstone design tokens, component overrides, AdminShell layout, dashboard/form/table page patterns. |

---

### `supabase` — ACTIVE
Supabase database, auth, and storage.

| Tool | Type | What it does |
|---|---|---|
| `supabase` | agent | Full Supabase tasks via Supabase MCP — schema changes, migration execution, RLS policies, storage rules. Use for any infra task touching the database. |
| `supabase` | skill | Schema design guidance, RLS policy patterns, migration structure, storage bucket configuration. |

---

### `infra` — ACTIVE
Cross-stack infrastructure skills for containerization, file storage, and email.

| Tool | Type | What it does |
|---|---|---|
| `docker-compose` | skill | Multi-stage Dockerfile, docker-compose service definitions, health checks, non-root user, CI/CD pipelines, GitHub Actions. |
| `file-storage` | skill | File upload patterns, presigned PUT URLs, Cloudflare R2/S3, avatar storage, UUID storage keys. Never proxy file bytes through the server. |
| `email` | skill | Transactional email with Resend + React Email templates. Email verification flows, password reset, fire-and-forget sending patterns. |

---

### `strategy` — available
Architecture consulting before writing code.

| Tool | Type | What it does |
|---|---|---|
| `solution-architect` | agent (Opus) | Technical architecture consulting — system design, design patterns, technology selection, trade-off analysis. Use before writing code for any major feature. |

---

### `feature-dev` — available
Structured end-to-end feature development workflow.

| Tool | Type | What it does |
|---|---|---|
| `/feature-dev` | command | 7-phase workflow: **Discovery → Codebase Exploration (parallel `code-explorer` agents) → Clarifying Questions → Architecture Design (parallel `code-architect` agents) → Implementation → Quality Review (parallel `code-reviewer` agents) → Summary**. Use for features touching multiple files or requiring architectural decisions. Not for single-line fixes. |
| `code-explorer` | agent | Traces execution paths, data flow, architecture layers. Auto-launched in Phase 2. |
| `code-architect` | agent | Designs feature architectures with multiple approaches + trade-off analysis. Auto-launched in Phase 4. |
| `code-reviewer` | agent | Reviews for CLAUDE.md compliance, bugs, conventions. Scores issues 0-100, reports ≥80 confidence. Auto-launched in Phase 6. |

---

### `code-review` — available
Automated PR review with confidence-based filtering.

| Tool | Type | What it does |
|---|---|---|
| `/code-review` | command | Launches 4 parallel agents (2× CLAUDE.md compliance, 1× bug detection, 1× git blame context). Scores every issue 0-100 — only posts issues ≥80 confidence to GitHub PR. Skips closed, draft, trivial, or already-reviewed PRs. |

---

### `pr-review-toolkit` — available
Six specialized review agents for targeted PR analysis.

| Tool | Type | What it does |
|---|---|---|
| `/review-pr` | command | Run full toolkit review on a PR. |
| `code-reviewer` | agent | CLAUDE.md compliance, bugs, style. Scores 0-100 (critical = 91-100). |
| `code-simplifier` | agent | Identifies unnecessary complexity, redundant code, excessive nesting. Run after code review passes. |
| `comment-analyzer` | agent | Checks comment accuracy vs actual code, detects comment rot and outdated docs. |
| `pr-test-analyzer` | agent | Behavioral coverage gaps, edge cases, error conditions. Rates gaps 1-10 (10 = must fix). |
| `silent-failure-hunter` | agent | Finds swallowed errors, empty catch blocks, missing error logging, bad fallback behavior. |
| `type-design-analyzer` | agent | Rates TypeScript type design on 4 dimensions (encapsulation, invariants, usefulness, enforcement) each 1-10. |

---

### `commit-commands` — available
Git workflow automation.

| Tool | Type | What it does |
|---|---|---|
| `/commit` | command | Analyzes staged/unstaged changes, matches repo commit style, stages files, creates commit. |
| `/commit-push-pr` | command | Full workflow: creates branch if on main → commits → pushes → opens PR with summary + test plan checklist via `gh`. |
| `/clean_gone` | command | Removes local branches whose remote has been deleted. Handles worktrees too. Run after merging PRs. |

---

### `playwright-testing` — available
E2E testing skill for writing and running Playwright tests.

| Tool | Type | What it does |
|---|---|---|
| `playwright-testing` | skill | Playwright test structure, page object patterns, selector strategies, assertions, CI integration. |

---

### `node-backend` — available (partial relevance)
Backend toolkit for Node.js APIs. This project uses Next.js Server Actions, not a standalone backend — but these skills apply when building server-side logic.

| Tool | Type | What it does |
|---|---|---|
| `backend-expert` | agent (Opus) | Builds/refactors Node.js backends with SOLID principles, service-repository pattern, type-safe data access. |
| `api-design` | skill | REST conventions, URL structure, HTTP semantics, response envelopes, error formats, pagination, OpenAPI. |
| `database-design` | skill | PostgreSQL schema naming, indexing strategy, FK constraints, soft deletes, multi-tenancy, migrations. |
| `backend-testing` | skill | Unit + integration tests with Vitest, test isolation, DB seeding, test factories. |
| `hono-drizzle` | skill | Not applicable (project uses Next.js, not standalone Hono API). |
| `redis-caching` | skill | Cache-aside patterns, TTL strategy, distributed locks, rate limiting — only if Redis is added. |

---

### `n8n` — available (not currently used)
Automation workflow design and debugging.

| Tool | Type | What it does |
|---|---|---|
| `n8n-automator` | agent (Sonnet) | Designs, builds, debugs n8n workflows — HTTP nodes, webhook triggers, data transformation, error handling. Use only if webhook-driven automation is added. |

---

## Sub-Agent Task Routing

| Task | Tool to reach for |
|---|---|
| DB schema, migrations, RLS policies | `supabase` agent + Supabase MCP |
| UI components, pages, routing, styling | `frontend-expert` agent → `shadcn-muji` + `nextjs-app-router` skills |
| Data fetching, cache, mutations | `tanstack-query` skill |
| Server Actions, API routes, middleware | direct, or `backend-expert` agent for complex logic |
| File uploads / storage | `file-storage` skill |
| Transactional email | `email` skill |
| Docker / CI config | `docker-compose` skill |
| Architecture decisions (pre-code) | `solution-architect` agent |
| New feature (multi-file) | `/feature-dev` command |
| Spec generation / planning | `/opsx:*` commands + `/brainstorming` |
| PR review (automated) | `/code-review` command |
| Targeted code review | `pr-review-toolkit` agents |
| Git commit | `/commit` command |
| Commit + push + open PR | `/commit-push-pr` command |
| Clean stale branches | `/clean_gone` command |

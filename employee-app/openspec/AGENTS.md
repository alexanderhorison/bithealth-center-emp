# OpenSpec — Agent Instructions

> Extends CLAUDE.md with OpenSpec-specific agent behavior.
> All general conventions are in `/CLAUDE.md` — do not repeat them here.

---

## Spec Generation Rules

When executing `/opsx:*` commands:

### Proposal (`proposal.md`)
- State the problem/need in one paragraph
- List explicit user stories in EARS format: `"When [trigger], the system shall [behavior]"`
- Call out which existing modules are affected (see `openspec/project.md` for current module list)
- Flag any schema changes required (`[infra]` tag)

### Specs (`specs.md`)
- Functional requirements: numbered, testable, unambiguous
- Non-functional requirements: performance, accessibility (WCAG AA), mobile-first
- Out of scope: explicitly list what this change does NOT include
- Edge cases: error states, empty states, loading states

### Design (`design.md`)
- Component breakdown: which new components, which existing components are reused/extended
- Data flow: server vs client, which queries/mutations are needed
- File layout: exact paths for new files following colocation pattern (`_components/` inside route)
- Schema changes: if any, provide the Supabase migration SQL

### Tasks (`tasks.md`)
- Ordered list, each task on a single line
- Tag each task: `[infra]`, `[frontend]`, or `[backend]`
- Database/RLS tasks come first (blocking)
- Each task should be completable in one focused session
- Include a verification step at the end of each task

---

## Agent Routing

| Tag | Routes to | Uses |
|---|---|---|
| `[infra]` | Infrastructure sub-agent | Supabase MCP for schema/migration/RLS |
| `[frontend]` | Frontend agent | shadcn/ui, Tailwind, Next.js App Router |
| `[backend]` | Backend agent | Server Actions, API routes, middleware |

---

## Review Checklist (appended to every `/opsx:verify`)

- [ ] All functional requirements from `specs.md` are implemented
- [ ] Design system constraints respected (no shadows, flat corners, stone palette)
- [ ] No new UI libraries introduced
- [ ] Server Components used by default; `'use client'` justified
- [ ] Forms use React Hook Form + Zod
- [ ] Error state, loading state, and empty state handled
- [ ] Mobile-first responsive layout
- [ ] No TypeScript `any` types
- [ ] Supabase RLS policies applied for any new tables

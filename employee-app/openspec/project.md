# OpenSpec — Project Context

> **All conventions, tech stack, design system, and agent definitions are defined in `/CLAUDE.md`.**
> This file exists solely to point OpenSpec at that authoritative source.
> Do not duplicate or contradict CLAUDE.md here.

---

## Project Reference

- **Project:** Bithealth Center Employee App
- **Type:** Brownfield (existing codebase)
- **Source of truth:** See [`/CLAUDE.md`](../CLAUDE.md) for full tech stack, design system, architecture patterns, and SDD workflow.

---

## Key Facts for Spec Generation

When generating proposals, specs, designs, and tasks via `/opsx:*` commands, apply these constraints (all derived from CLAUDE.md):

### Stack Summary
- Next.js 14 App Router, React 18, TypeScript (strict)
- Tailwind CSS + shadcn/ui only (no other UI libraries)
- Supabase Auth, TanStack Query v5, Zustand v5, React Hook Form + Zod

### Design Constraints
- MUJI minimalism: neutral tones, flat corners, no shadows
- Fonts: Noto Sans JP + Manrope
- Background: stone-100
- Colors: stone/slate/zinc palette only

### Architecture Constraints
- Server Components by default; `'use client'` only when required
- Route-specific components in `_components/` (colocation)
- TanStack Query for server state, Zustand for client state
- All forms: React Hook Form + Zod

### Task Routing for Spec Tasks
- Database/auth/RLS → label as `[infra]` — routes to Infrastructure sub-agent
- UI/pages/styling → label as `[frontend]` — follows design system
- API/Server Actions/middleware → label as `[backend]`

---

## Existing Modules (Brownfield Context)

| Module | Route | Status |
|---|---|---|
| Presence Tracking | `/presence` | Implemented |
| Account Request | `/account-request` | Implemented |
| Module Directory | `/modules` | Implemented |
| Dashboard | `/dashboard` | Redirect → /presence |

---

## openspec Directory Layout

```
openspec/
  project.md        ← this file (points to CLAUDE.md)
  AGENTS.md         ← agent instructions for OpenSpec operations
  specs/            ← living specifications (updated after archive)
  changes/          ← active feature work
    <feature>/
      proposal.md
      specs.md
      design.md
      tasks.md
  archive/          ← completed/shipped features
```

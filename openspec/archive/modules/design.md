# Design: Module Directory (App Home)

> Status: **SHIPPED** — Retrospective SDD artifact.

---

## Component Breakdown

### New Components (this feature)
| Component | Type | Path | Responsibility |
|---|---|---|---|
| Modules page | Server Component | `app/(employee)/modules/page.tsx` | Auth, greeting, module grid |

### Reused Components
| Component | Type | Path | Responsibility |
|---|---|---|---|
| `UserMenu` | Client Component | `components/auth/user-menu.tsx` | Avatar dropdown in header |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` | Server | `components/ui/card.tsx` | shadcn/ui card primitives |

---

## Data Flow

```
app/(employee)/modules/page.tsx (server)
  → requireEmployeeUser()            — reads session cookies, validates token
      → returns { id, email, fullName, avatarUrl }
  → const displayName = fullName ?? email
  → render:
      Header: { displayName, UserMenu(fullName, email) }
      Grid:   [ Active: Link→/presence, Link→/account-request ]
              [ Static: Leave Request (coming soon), Asset Request (coming soon) ]
```

No database queries. No TanStack Query. No Zustand. Pure Server Component render.

---

## File Layout

```
app/
  (employee)/
    modules/
      page.tsx        ← Server Component — modules grid page
      loading.tsx     ← (MISSING — known gap, no loading skeleton)
      error.tsx       ← (MISSING — known gap, no error boundary)
components/
  auth/
    user-menu.tsx     ← reused: avatar + sign-out dropdown
  ui/
    card.tsx          ← reused: shadcn Card primitives
```

---

## Visual Design Tokens

| Element | Tailwind Classes |
|---|---|
| Page background | `min-h-screen bg-stone-100` |
| Max width container | `mx-auto max-w-3xl px-6 py-8` |
| Greeting heading | `text-2xl font-bold` |
| Subtitle | `text-sm text-muted-foreground` |
| Grid | `grid gap-4 sm:grid-cols-2` |
| Active card | `border-stone-300 bg-stone-50 transition hover:border-stone-400` |
| Active card label | `text-sm font-medium text-zinc-700` |
| Coming Soon card | `border-dashed border-stone-300 bg-stone-100/70 text-zinc-500` |
| Coming Soon badge | `rounded-full border border-stone-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500` |

---

## Schema Changes

None required.

---

## Future Considerations

- **Config-driven registry**: Move module list to a typed config array `modules.config.ts` so adding a new module doesn't require touching `page.tsx` directly.
- **RBAC visibility**: If modules need to be gated by role, add a `roles` filter to the config array and derive visible modules from `user.role`.
- **`error.tsx`**: Add a route-level error boundary to catch unexpected `requireEmployeeUser()` failures gracefully.

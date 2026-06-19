# BitHealth Design System Integration

**Date:** 2026-06-19
**Project:** Bithealth Center monorepo (`admin-cms` + `employee-app`)
**Source:** `~/Downloads/BitHealth Homepage.html`
**Scope:** Integrate the BitHealth homepage design tokens into both Next.js apps — replacing the current generic shadcn warm-stone defaults.

---

## Goal

Both apps (`admin-cms` port 3001, `employee-app` port 3000) should reflect the official BitHealth visual identity as defined in the homepage: orange brand primary, navy secondary, Inter + IBM Plex Mono fonts, and the full semantic token layer. Existing shadcn components should automatically adopt the new brand with zero component-level changes.

---

## Approach: CSS Variables + Tailwind Bridge (Option C)

CSS vars are the **source of truth** (defined in `globals.css`). Tailwind config **references** those vars — so you get full Tailwind DX (`bg-brand-500`, `text-text-primary`) while staying 1:1 with the homepage HTML token names.

---

## Token System

### Color Scales (base — in `:root`)

| Scale | Range | Key value |
|---|---|---|
| Brand (orange) | `--brand-25` → `--brand-950` | `--brand-500: #F34B1F` |
| Navy (blue) | `--navy-25` → `--navy-950` | `--navy-600: #122A67` |
| Gray | `--gray-25` → `--gray-950` | `--gray-900: #101828` |
| Success | `--success-25` → `--success-700` | `--success-500: #12B76A` |
| Warning | `--warning-25` → `--warning-700` | `--warning-500: #F79009` |
| Error | `--error-25` → `--error-700` | `--error-500: #F04438` |
| White | `--white: #FFFFFF` | — |

### Semantic Aliases (use these in product code)

**Text**
```
--text-primary      → navy-900   (body text)
--text-secondary    → gray-700
--text-tertiary     → gray-500
--text-placeholder  → gray-400
--text-disabled     → gray-400
--text-on-brand     → white      (text on orange)
--text-brand        → brand-700
--text-navy         → navy-600
--text-error        → error-600
--text-success      → success-700
```

**Surfaces**
```
--surface-page      → white
--surface-subtle    → gray-50
--surface-muted     → gray-100
--surface-card      → white
--surface-brand     → brand-500
--surface-brand-soft→ brand-50
--surface-navy      → navy-600
--surface-inverse   → navy-900
```

**Borders**
```
--border-subtle     → gray-200
--border-default    → gray-300
--border-strong     → gray-400
--border-brand      → brand-500
--border-error      → error-500
```

**Interactive**
```
--action-primary        → brand-500
--action-primary-hover  → brand-600
--action-primary-press  → brand-700
--action-secondary      → white
--action-secondary-hover→ gray-50
--link                  → brand-700
--focus-ring            → brand-400
```

### Spacing (4px base grid)
`--space-0` (0) → `--space-40` (10rem / 160px) in standard T-shirt steps.

### Border Radius
```
--radius-xs:   4px
--radius-sm:   6px
--radius-md:   8px
--radius-lg:   10px
--radius-xl:   12px
--radius-2xl:  16px
--radius-3xl:  20px
--radius-4xl:  24px
--radius-full: 9999px
```

### Shadows (cool, low-contrast)
```
--shadow-xs:  0 1px 2px rgba(16,24,40,0.05)
--shadow-sm:  0 1px 3px rgba(16,24,40,0.10), 0 1px 2px rgba(16,24,40,0.06)
--shadow-md:  0 4px 8px -2px rgba(16,24,40,0.10), 0 2px 4px -2px rgba(16,24,40,0.06)
--shadow-lg:  0 12px 16px -4px rgba(16,24,40,0.08), 0 4px 6px -2px rgba(16,24,40,0.03)
--shadow-xl:  0 20px 24px -4px rgba(16,24,40,0.08), 0 8px 8px -4px rgba(16,24,40,0.03)
--shadow-2xl: 0 24px 48px -12px rgba(16,24,40,0.18)
```

### Typography
```
--font-sans:    'Inter', system fallbacks
--font-mono:    'IBM Plex Mono', mono fallbacks
--font-display: var(--font-sans)
```

**Display scale:** `--display-2xl` (4.5rem) → `--display-xs` (1.5rem)
**Text scale:** `--text-xl` (1.25rem) → `--text-xs` (0.75rem)
**Tracking:** `--tracking-display: -0.02em`, `--tracking-tight: -0.01em`, `--tracking-normal: 0em`

---

## Shadcn Compatibility Bridge

Shadcn components use its own var set. We remap them to BitHealth tokens in `globals.css` so existing components adopt the brand automatically. **No component edits required.**

> Shadcn's `hsl(var(--x))` pattern is dropped — we switch to direct hex via CSS vars referenced directly in Tailwind config (no `hsl()` wrapper needed).

| shadcn var | BitHealth token | Visual result |
|---|---|---|
| `--primary` | `var(--brand-500)` | Buttons → brand orange |
| `--primary-foreground` | `var(--white)` | Text on orange |
| `--background` | `var(--surface-page)` | Page bg → white |
| `--foreground` | `var(--text-primary)` | Body text → navy-900 |
| `--card` | `var(--surface-card)` | Cards → white |
| `--card-foreground` | `var(--text-primary)` | Card text |
| `--muted` | `var(--surface-muted)` | Muted bg → gray-100 |
| `--muted-foreground` | `var(--text-secondary)` | Muted text → gray-700 |
| `--border` | `var(--border-default)` | Borders → gray-300 |
| `--input` | `var(--border-default)` | Input borders |
| `--ring` | `var(--focus-ring)` | Focus ring → brand-400 |
| `--destructive` | `var(--error-500)` | Destructive → error red |
| `--destructive-foreground` | `var(--white)` | Text on red |

---

## Fonts

**Switch from:** Noto Sans JP + Manrope
**Switch to:** Inter + IBM Plex Mono

Loaded via `next/font/google` in each app's `layout.tsx`. Next.js self-hosts the fonts (no CDN dependency).

```tsx
import { Inter, IBM_Plex_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})
```

Both variables are applied to `<html>` — `globals.css` then picks them up via `font-family: var(--font-sans)` on `body`.

---

## Files Changed

| File | Action | Notes |
|---|---|---|
| `admin-cms/app/globals.css` | Replace | Full BitHealth `:root` + shadcn bridge |
| `admin-cms/tailwind.config.ts` | Replace | BitHealth token mappings |
| `admin-cms/app/layout.tsx` | Update | Swap font imports, inject CSS var classes |
| `employee-app/app/globals.css` | Replace | Same as admin-cms |
| `employee-app/tailwind.config.ts` | Replace | Same as admin-cms |
| `employee-app/app/layout.tsx` | Update | Same as admin-cms |

**Not changed:** All components, pages, middleware, Supabase schema, Docker/deployment config.

---

## Out of Scope

- **Dark mode tokens** — homepage only defines light mode. Dark mode scaffold (`darkMode: ['class']`) is kept in Tailwind config for future use.
- **Component-level redesign** — this phase is tokens only. Layout/component visual polish is a separate phase.
- **Shared package extraction** — no monorepo workspace setup. Each app duplicates the same token files. A shared `packages/tokens` extraction is a future improvement if the two apps diverge significantly.

---

## Tailwind Class Reference (after integration)

```
Colors:     bg-brand-500  text-navy-600  bg-surface-card  text-text-primary
Semantic:   bg-surface-subtle  text-text-secondary  border-border-default
Radius:     rounded-xs  rounded-sm  rounded-md  rounded-lg  rounded-xl  rounded-2xl  rounded-full
Shadows:    shadow-xs  shadow-sm  shadow-md  shadow-lg  shadow-xl  shadow-2xl
Fonts:      font-sans (Inter)  font-mono (IBM Plex Mono)
```

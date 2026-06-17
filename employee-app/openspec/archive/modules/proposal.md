# Proposal: Module Directory (App Home)

> Status: **SHIPPED** — Retrospective SDD artifact.

---

## Problem Statement

After sign-in, employees need a clear, consistent landing page that gives them an overview of what the portal offers and direct access to each available module. The page must also signal upcoming features to set expectations about the product roadmap.

---

## User Stories (EARS Format)

- When an authenticated employee lands on `/modules`, the system shall display all available modules as a navigable grid of cards.
- When an employee clicks an active module card, the system shall navigate to that module's route.
- When a module is not yet available, the system shall render its card as a non-interactive placeholder with a "Coming Soon" badge.
- When the employee is not authenticated, the system shall redirect them to the sign-in page before rendering the modules grid.
- When the page loads, the system shall greet the employee by name (or email if name is unavailable).
- When the employee opens the user menu, the system shall provide account management actions (sign out, profile info).

---

## Affected Modules

- **Auth** — depends on `requireEmployeeUser()` for session enforcement.
- **Presence Tracking** — linked from modules grid.
- **Account Request** — linked from modules grid.
- **Leave Request** (planned) — placeholder card displayed.
- **Asset Request** (planned) — placeholder card displayed.

---

## Schema Changes Required

None — this page makes no database queries.

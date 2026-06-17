# Proposal: Bithealth Center Employee App — Baseline SDD Spec

## Problem / Need

The Bithealth Center Employee App is an internal employee self-service portal that has been developed and deployed without a formal Software Design Document. This baseline spec captures the current state of the system — its modules, architecture decisions, data models, and constraints — as the authoritative specification that all future development must remain compatible with.

Establishing this baseline enables the team to:
- Onboard new contributors with a clear, accurate picture of what was built and why
- Use OpenSpec's `/opsx:propose` workflow to add new modules without re-explaining the foundation
- Provide Superpowers with the full system context for TDD, debugging, and code reviews
- Track future changes as deltas against a known-good specification

---

## Scope

This spec covers the **complete current implementation** of the app plus the **planned next modules** (Leave Request, Asset Request) as requirements for upcoming work.

### In Scope
- Authentication system (Google OAuth + Supabase + httpOnly cookies + middleware)
- Presence Tracking module (`/presence`)
- Account Request module (`/account-request`)
- Module Hub page (`/modules`)
- All shared infrastructure (Supabase schema, storage, env config, Docker)

### Out of Scope
- Admin panel (not yet built)
- Push notifications / email notifications (not yet built)
- Reporting / data export (not yet built)

---

## User Stories (EARS Format)

### Authentication
- When an employee visits the app for the first time, the system shall redirect them to the sign-in page.
- When an employee signs in with a valid Google account matching `COMPANY_EMAIL_DOMAIN`, the system shall create or update their employee record and issue session cookies.
- When an employee with `ADMIN` role signs in from any email domain, the system shall grant access without domain restriction.
- When a session cookie expires, the system shall automatically refresh it using the refresh token without requiring the employee to sign in again.
- When a session is invalid and cannot be refreshed, the system shall redirect the employee to the sign-in page and clear invalid cookies.

### Presence Tracking
- When an employee submits their daily status, the system shall upsert a presence record for today's date, replacing any prior submission for the same day.
- When an employee submits status PRESENT or WFH, the system shall optionally accept a selfie photo (JPEG/PNG/WEBP, max 5MB).
- When an employee submits a note, the system shall enforce a maximum of 250 characters.
- When an employee loads the presence page, the system shall display today's current submission and the last 7 entries in chronological order.
- When an employee account is marked inactive (`is_active = false`), the system shall show a disabled state message and prevent form submission.

### Account Request
- When an employee submits a GitHub request, the system shall accept request types REPO_ACCESS (target URL required) or NEW_REPO (target URL optional).
- When an employee submits a Figma request, the system shall accept request types FIGMA_FILE (target URL required) or FIGMA_PROJECT (target URL optional).
- When an employee views their request history, the system shall display paginated results (10 or 20 per page) with status badge, admin notes, and resolution date.
- When an admin resolves a request, the system shall record the admin note, resolver ID, and resolution timestamp.

### Module Hub
- When an employee signs in successfully, the system shall redirect them to `/modules`.
- When an employee views the modules page, the system shall display active module cards and placeholder cards for coming-soon modules.

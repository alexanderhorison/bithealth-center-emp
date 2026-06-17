# Presence Application

This repository contains 2 Next.js 14 applications:

- `employee-app`: Employee app to submit daily presence (`PRESENT`, `WFH`, `NOT_PRESENT`, `GO_TO_CLIENT`) with optional selfie.
- `admin-cms`: Admin CMS for employee and presence management.

Both apps use:

- Supabase Auth for authentication (Google sign-in)
- Supabase for database (`presence` schema, not `public`)

## 1) Setup Supabase

1. Create a Supabase project.
2. Run the SQL migration:
   - `supabase/migrations/20260219154000_init_presence.sql`
3. Confirm tables are created under schema `presence`.

## 2) Setup Supabase Auth (Google)

1. In Supabase Dashboard, open `Authentication > Providers`.
2. Enable `Google`.
3. Add redirect URLs:
   - Employee app: `http://localhost:3000/auth/callback`
   - Admin CMS: `http://localhost:3001/auth/callback`
4. Configure Google OAuth credentials in Supabase provider settings.

## 3) Environment Variables

Copy and fill env files:

- `employee-app/.env.example` -> `employee-app/.env.local`
- `admin-cms/.env.example` -> `admin-cms/.env.local`

Required in both apps:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Employee app:

- `COMPANY_EMAIL_DOMAIN` (optional, for domain restriction)

Admin CMS:

- `ADMIN_EMAIL_ALLOWLIST` (comma-separated admin emails)

## 4) Install & Run (Separated Apps)

Employee app:

```bash
cd employee-app
npm install
npm run dev
```

Admin CMS:

```bash
cd admin-cms
npm install
npm run dev
```

Apps:

- Employee: [http://localhost:3000](http://localhost:3000)
- Admin CMS: [http://localhost:3001](http://localhost:3001)

## 5) Run With Docker (Separated Apps)

Each app has its own `docker-compose.yml`:

Employee app:

```bash
cd employee-app
cp .env.docker.example .env
docker compose up -d --build
```

Admin CMS:

```bash
cd admin-cms
cp .env.docker.example .env
docker compose up -d --build
```

## Functional Notes

- Employee records are auto-created/updated when users open modules/presence or submit presence, based on Supabase Auth identity.
- Presence is one record per employee per day.
- Admin CMS includes:
  - Employee Management: edit employee data and enable/disable account.
  - Presence Management: list/filter/delete presence entries.

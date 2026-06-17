# Employee App

Standalone Next.js app for employee modules (Presence, Account Request).

## Local Development

1. Copy env file:

```bash
cp .env.example .env.local
```

2. Install and run:

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`.

## Docker (Standalone)

1. Create Docker env file:

```bash
cp .env.docker.example .env
```

2. Fill required values in `.env`, then run:

```bash
npm run docker:up
```

Useful commands:

```bash
npm run docker:logs
npm run docker:down
```

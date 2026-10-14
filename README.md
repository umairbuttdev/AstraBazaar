# AstraBazaar

Ecommerce platform monorepo.

## Apps

- `apps/web` — Next.js storefront
- `apps/api` — NestJS API

## Setup

1. Copy `.env.example` to `.env` and set your Supabase database URLs.
2. Install dependencies:

```bash
npm install
```

3. Run the apps:

```bash
npm run dev:web
npm run dev:api
```

- Web: http://localhost:3000
- API: http://localhost:3001

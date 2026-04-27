# Contributing

Thanks for helping improve **storra.host**.

## Before you start

1. Read [README.md](./README.md) for architecture (Next.js app, **Cloudflare R2**, **Supabase** metadata, **AES-256-GCM** on the server). For sensitive issues, use [SECURITY.md](./SECURITY.md) instead of a public issue with exploit details.
2. Copy [`.env.example`](./.env.example) to `.env`, fill values for local development, and **never** commit `.env`, real keys, or webhook URLs. `.env.example` is the template for others-keep it updated when you add new optional variables (see README’s environment table).

## Local setup

1. `npm install`
2. Apply Supabase SQL migrations in order (see README).
3. `npm run dev` - open the app at `http://localhost:3000`.

## Before a pull request

- `npm run lint`
- `npm run build`

## Pull requests

- Prefer one focused change per PR (feature, fix, or docs).
- Describe what changed and why in the PR body.
- Do not commit secrets, personal data, or build output (e.g. `.next/`).
- If you change the database shape, add a new file under `supabase/migrations/` and document it in the PR so operators can run it in order.

## Code style

Match existing patterns (TypeScript, Zod where used, Tailwind classes, component layout). Avoid drive-by refactors unrelated to your change.

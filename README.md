# storra.host

Uploads use a **per-file AES-256 key** in the browser; the **browser encrypts** with Web Crypto and **PUTs ciphertext straight to R2** (presigned URL). Only small JSON calls hit the Next.js server—so this works on **Vercel**, which caps request bodies at 4.5 MB. Self-hosted instances can use the same path. Row metadata (expiry, limits, etc.) is in Supabase Postgres. Supabase is not used for file blobs.

Default mode is true E2EE for new uploads: the file key is shared as URL fragment (`#k=...`), which browsers do not send to the server. The server cannot decrypt these files. A legacy mode is still available for compatibility, where the server can decrypt.

**Stack:** Next.js, React, TypeScript, Tailwind, Zod, S3-compatible R2, Postgres via Supabase.

## Features (roughly)

- Upload on `/`, with optional expiry, download cap, optional per-file password, and dual encryption mode (E2EE default + legacy compatibility mode).
- Blog at `/blog`, changelog at `/changelog` (copy: [content/changelog.md](./content/changelog.md)).
- Optional Ko-fi + Discord in the header, optional bug report to Discord if `DISCORD_WEBHOOK_URL` is set, theme toggle.
- Optional X link in the footer, optional announcement bar.
- Old `/f/:id` links redirect to `/?f=:id`.

## How data is split

- **Postgres (Supabase):** metadata. Use the service role on the server only.
- **R2:** encrypted object bytes, private bucket.
- **Upload:** `POST /api/files/upload/prepare` with JSON `{ "metadata": "<stringified upload metadata>" }`.
  - E2EE mode (`encryptionMode: "e2ee_client"`): metadata includes browser-generated `iv`; response includes `fileId`, `iv`, and presigned `PUT` URL. Browser key never leaves the client.
  - Legacy mode (`encryptionMode: "legacy_server"`): response also includes one-time `dataKey` for old server-decrypt flow.
  Then client encrypts, `PUT`s ciphertext to R2, and calls `POST /api/files/upload/complete` with `{ "fileId" }`.
  The legacy `POST /api/files/upload` multipart route returns 410 (stub for old clients).
- **Download:** `GET /api/files/{id}` checks limits and mode.
  - E2EE files return ciphertext; browser decrypts with `#k=...`.
  - Legacy files return server-decrypted data.
  Passworded files need header `X-Access-Password` (the in-app form sets this when you enter the password).
- **Optional:** `GET` or `POST` `/api/cron/cleanup` for expired files (use `CRON_SECRET` in production).
- **Optional:** `POST /api/bug-report` to Discord when the webhook is set.

## Supabase

1. Create a project.
2. In **Project → Settings → API**, take the project URL and **service_role** key into `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (use the service key only on the server).
3. In the **SQL** editor, run the migration scripts from this repo’s `supabase/migrations` folder **in name order**. File blobs are not in Supabase Storage; they stay in R2.

## R2

1. Create a private bucket and S3 API tokens.
2. Copy [`.env.example`](./.env.example) to `.env` and fill in `R2_*`. You need either `R2_ENDPOINT` or `R2_ACCOUNT_ID` so the client can reach Cloudflare. For many setups `R2_REGION=auto` is enough; `R2_FORCE_PATH_STYLE` helps with MinIO.
3. **CORS (required in production):** Browsers send the encrypted `PUT` to your R2 endpoint, which is a different origin than the app. In the Cloudflare dashboard, open the bucket → **Settings** → **CORS policy** and allow your site origin, e.g.:

```json
[
  {
    "AllowedOrigins": ["https://your-domain.com"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Add `http://localhost:3000` to `AllowedOrigins` while developing.

## Local dev

```bash
cp .env.example .env
# Set Supabase, R2, and ENCRYPTION_KEY; run the DB migrations (see above).
npm install
npm run dev
```

32-byte `ENCRYPTION_KEY` (hex):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Check build:** `npm run lint` and `npm run build`.

At build time the short git ref is stored as `STORRA_GIT_COMMIT`. On Vercel, `VERCEL_GIT_COMMIT_SHA` is set for you. You can override with `GIT_COMMIT_SHA` if needed (bug report footer, version string).

## Environment

Copy [`.env.example`](./.env.example) to `.env` and fill it in. You need `ENCRYPTION_KEY`, Supabase URL + `SUPABASE_SERVICE_ROLE_KEY`, and the R2 variables. Optional stuff includes cron auth, rate limits, Discord, and public URLs. Search under `src/` for `process.env` if you need a full list of names.

## License

[MIT](LICENSE)

## Contributing / security

[CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) for sensitive issues.

**Operational notes:** protect DB/R2 access (and `ENCRYPTION_KEY` for legacy mode). The R2 bucket should stay private. In-memory rate limits do not sync across many servers; scale out carefully or add another layer. In E2EE mode, losing the `#k=...` fragment means the file cannot be decrypted. Review your own risk before going public.

## latest

## v3 (current)

- **Security hardening pass** - Added signed one-time finalize tokens for upload completion, stricter file API response normalization, hardened cron auth (POST-only, fail-closed unless explicitly allowed in local dev), global security headers (CSP/HSTS/nosniff/frame/referrer/permissions), safer external URL validation, and DB integrity constraints in migration `005`. E2EE key-fragment leak risks were reduced further by avoiding automatic secret-link clipboard copy and preserving key-safety warnings in UI.
- **Full E2EE mode** - Added a true end-to-end encrypted workflow where the browser manages the decryption key locally and the server stores only ciphertext and metadata. The secret link is the only way to unlock a file, so keep it safe.
## prior

## v2

- **Direct R2 uploads (Vercel-safe)** - `POST /api/files/upload/prepare` issues a per-file key and presigned `PUT` URL; the browser encrypts (AES-256-GCM, same format as before) and uploads ciphertext to R2, then `POST /api/files/upload/complete` finalizes metadata. Avoids Vercel’s 4.5 MB function body limit. DB adds optional `wrapped_file_key` (migration `003`); legacy rows still decrypt with the global key only. **Configure R2 CORS** for your app origin (see README).
- **Open Graph & link previews** - Default site title, description, and `banner.png` for embeds (e.g. Discord) via root metadata; `og:image` resolves with `metadataBase` / public URL in production.
- **Terms of Service & AUP** - `/tos` and `/aup` with the same server-rendered layout as the rest of the app; on wide screens, an **On this page** table of contents stays sticky and tracks the section in view.
- **Footer** - Links to Terms of Service and Acceptable use under the storage disclaimer.
- **Nav** - GitHub icon pointing at the public repo in the top bar (next to Donate and Discord).
- **Upload size** - **500 MiB** default, documented as optional `MAX_FILE_SIZE_BYTES` in `.env.example`; the home blurb, API limit, and upload form use the same value, with a toast if a file is over the limit before upload starts.

## v1.5

- **Upload API shape** -Successful `POST /api/files/upload` returns only `fileId`; the app builds the share link from the page origin. File metadata at `?meta=1` no longer repeats derived share URLs in JSON.
- **More options (modal)** -Expiry, max downloads, and optional access password are configured in a dialog instead of an inline block. **Expires** is one menu: presets (no expiry through 30 days) plus **Choose your own** for a custom amount in minutes, hours, or days.
- **Access password (optional)** -Set under **More options**; show/hide (eye) and copy on the field. Recipients need the password to download; it is stored as a [bcrypt](https://en.wikipedia.org/wiki/Bcrypt) hash. The server still holds `ENCRYPTION_KEY` for at-rest storage—an extra gate on the link, not end-to-end zero-knowledge file encryption.
- **Changelog** -[Changelog](/changelog) page (layout aligned with the blog) with **Latest** / **Prior** / **Initial** in `content/changelog.md`; Changelog in the header next to Discord, optional bug report, and theme.
- **UI & theming** -Dialogs (More options, bug report) use the same zinc palette and borders as the main shell; overlays and close controls match. Selects and dropdowns were restyled (focus, shadow, stacking over modals) for upload and the bug form.
- **Branding & nav** -The home header no longer shows an icon above the **storra.host** title; Donate uses the Ko-fi-style mark instead of a Ko-fi-style mark instead of a generic heart.
- **README** -Shorter and plainer, with database steps pointing at the `supabase/migrations` folder in name order.

## initial

## v1

- **Encrypted file sharing** -Upload from the browser; the server encrypts with AES-256-GCM and stores only ciphertext in Cloudflare R2, with file metadata in Supabase Postgres.
- **Share links** -Short links (`/?f=…`) with no decryption keys in the URL; optional expiry and download limits.
- **Blog** -[How Storra works](/blog) article; light/dark theme; optional announcement strip; community links (e.g. Discord, Ko-fi) and optional bug reports via Discord webhook.
- **Self-hosting** -MIT open source, env-based configuration, SQL migrations, optional cron cleanup for expired files.

import { countWords, minutesToRead } from "@/lib/reading-time";

export const BLOG_ARTICLE_PLAIN = `
Storra.host is a minimal file-sharing flow: you upload from the browser, the app server
encrypts the bytes, and you get a short link to share. Recipients open the link and
download through the same server - no keys in the URL.

What Storra is
Storra is built so
most people can use it on
storra.host
without running anything: upload from the browser, get a short share link, and recipients
download through the same service.
Encryption is server-side
(the file is turned into ciphertext before it is written to object storage-raw bytes are not
what we keep in the bucket). We have
no in-product way to open or read your file contents
-no admin viewer, no back door, no “recover plaintext” button for us. In plain terms, the
product does not offer a way for operators to open or browse your file contents-no
administrative viewer, no support back door, and no hidden control that exposes
plaintext. If you outgrow that or need full control, the same
project is self-hostable
- you run the
Next.js
app, point it at
Cloudflare R2
for objects,
Supabase
(Postgres) for metadata, and keep the master encryption key on the server. Either way, it
is a practical alternative to dumping raw files in a public bucket or pasting big binaries
into chat.

Upload path
You choose a file in the browser. The file is sent to your Storra app over HTTPS as the
raw bytes (TLS protects the wire).
The server generates a random IV, encrypts the file with AES-256-GCM using
a secret ENCRYPTION_KEY
that never leaves the server.
Only ciphertext
(plus auth tag) is written to
Cloudflare R2
via the S3 API. Filenames, size, MIME, expiry, and download limits live as rows in
Supabase Postgres
- not in
Supabase
Storage.
You receive a share URL like /?f=…. There is no decryption key in the link.

Download path
When someone opens the link, the app loads metadata for that file id, checks expiry and
optional download caps, fetches the blob from
R2
, decrypts it in your app
process, and streams the original bytes to the browser with a sensible filename and
content type.

Security model (plain language)
This is not zero-knowledge.
The server holds the master key and can decrypt any stored file. That is intentional for a
simple self-hosted design: you control the host and the key, and you should protect both.
Because share links do
not
contain
secrets, anyone who gets the link can download while the file is still valid - treat links
like capability URLs. The footer on the site repeats the storage / key disclaimer.

Code and operations
The app is open source. You configure
R2
,
Supabase
, and
ENCRYPTION_KEY
via environment variables; optional cron can clean up expired rows and objects. See the
project README for migrations and deployment notes.
`.trim();

export const blogArticleReadMinutes = minutesToRead(BLOG_ARTICLE_PLAIN);
export const blogArticleWordCount = countWords(BLOG_ARTICLE_PLAIN);

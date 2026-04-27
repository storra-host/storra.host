import type { Metadata } from "next";
import Link from "next/link";
import { siCloudflare, siNextdotjs, siSupabase } from "simple-icons";
import { ArrowLeft } from "lucide-react";
import { TechInlineName } from "@/components/tech-inline-icon";
import {
  blogArticleReadMinutes,
  blogArticleWordCount,
} from "@/app/blog/article-plain-text";

export const metadata: Metadata = {
  title: "How Storra works - Storra.host",
  description:
    "How to use Storra on storra.host, how self-hosting works, and how uploads, R2, and Supabase fit together.",
  authors: [{ name: "Storra Team" }],
};

const link = "text-sky-700 underline decoration-sky-500/40 underline-offset-2 hover:decoration-sky-600 dark:text-sky-400 dark:decoration-sky-500/30";

const hrefNext = "https://nextjs.org/";
const hrefR2 = "https://developers.cloudflare.com/r2/";
const hrefSupabase = "https://supabase.com/";
const hrefSupabaseDatabase = "https://supabase.com/docs/guides/database";
const hrefSupabaseStorage = "https://supabase.com/docs/guides/storage";

export default function BlogPage() {
  return (
    <article className="w-full max-w-prose pb-12 text-left">
      <p className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Home
        </Link>
      </p>

      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        How Storra works
      </h1>
      <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">
        <span>By Storra Team</span>
        <span className="mx-1.5 text-zinc-400 dark:text-zinc-600" aria-hidden>
          ·
        </span>
        <time
          dateTime={`PT${blogArticleReadMinutes}M`}
          title={`~${blogArticleWordCount} words at 200 wpm`}
        >
          {blogArticleReadMinutes} min read
        </time>
        <span className="sr-only"> about {blogArticleWordCount} words</span>
      </p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        Storra.host is a minimal file-sharing flow: you upload from the browser, the app server
        encrypts the bytes, and you get a short link to share. Recipients open the link and
        download through the same server - no keys in the URL.
      </p>

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        What Storra is
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <strong className="font-medium text-zinc-800 dark:text-zinc-200">Storra</strong> is built so
        most people can use it on{" "}
        <Link href="/" className={link}>
          storra.host
        </Link>{" "}
        without running anything: upload from the browser, get a short share link, and recipients
        download through the same service.{" "}
        <strong className="font-medium text-zinc-800 dark:text-zinc-200">Encryption is server-side</strong>{" "}
        (the file is turned into ciphertext before it is written to object storage-raw bytes are not
        what we keep in the bucket). We have{" "}
        <strong className="font-medium text-zinc-800 dark:text-zinc-200">
          no in-product way to open or read your file contents
        </strong>
        -no admin viewer, no back door, no “recover plaintext” button for us.         In plain terms, the product does not offer a way for operators to open or
        browse your file contents-no administrative viewer, no support back door, and
        no hidden control that exposes plaintext. If you
        outgrow that or need full control, the same project is{" "}
        <strong className="font-medium text-zinc-800 dark:text-zinc-200">self-hostable</strong> - you
        run the{" "}
        <TechInlineName href={hrefNext} icon={siNextdotjs}>
          Next.js
        </TechInlineName>{" "}
        app, point it at{" "}
        <TechInlineName href={hrefR2} icon={siCloudflare}>
          Cloudflare R2
        </TechInlineName>{" "}
        for objects,{" "}
        <TechInlineName href={hrefSupabase} icon={siSupabase}>
          Supabase
        </TechInlineName>{" "}
        (Postgres) for metadata, and keep the master encryption key on the server. Either way, it
        is a practical alternative to dumping raw files in a public bucket or pasting big binaries
        into chat.
      </p>

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Upload path
      </h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-zinc-600 marker:text-zinc-500 dark:text-zinc-400">
        <li>
          You choose a file in the browser. The file is sent to your Storra app over HTTPS as the
          raw bytes (TLS protects the wire).
        </li>
        <li>
          The server generates a random IV, encrypts the file with{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">AES-256-GCM</strong> using
          a secret <code className="rounded bg-zinc-200/80 px-1 font-mono text-[0.8rem] dark:bg-zinc-800">ENCRYPTION_KEY</code>{" "}
          that never leaves the server.
        </li>
        <li>
          Only <strong className="font-medium text-zinc-800 dark:text-zinc-200">ciphertext</strong>{" "}
          (plus auth tag) is written to{" "}
          <TechInlineName href={hrefR2} icon={siCloudflare}>
            Cloudflare R2
          </TechInlineName>{" "}
          via the S3 API. Filenames, size, MIME, expiry, and download limits live as rows in{" "}
          <TechInlineName href={hrefSupabaseDatabase} icon={siSupabase}>
            Supabase Postgres
          </TechInlineName>{" "}
          - not in{" "}
          <TechInlineName href={hrefSupabaseStorage} icon={siSupabase}>
            Supabase
          </TechInlineName>{" "}
          Storage.
        </li>
        <li>
          You receive a share URL like <code className="rounded bg-zinc-200/80 px-1 font-mono text-[0.8rem] dark:bg-zinc-800">/?f=…</code>. There is no decryption key in the link.
        </li>
      </ol>

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Download path
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        When someone opens the link, the app loads metadata for that file id, checks expiry and
        optional download caps, fetches the blob from{" "}
        <TechInlineName href={hrefR2} icon={siCloudflare}>
          R2
        </TechInlineName>
        , decrypts it in your app
        process, and streams the original bytes to the browser with a sensible filename and
        content type.
      </p>

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Security model (plain language)
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <strong className="font-medium text-zinc-800 dark:text-zinc-200">This is not zero-knowledge.</strong>{" "}
        The server holds the master key and can decrypt any stored file. That is intentional for a
        simple self-hosted design: you control the host and the key, and you should protect both.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        Because share links do{" "}
        <strong className="font-medium text-zinc-800 dark:text-zinc-200">not</strong> contain
        secrets, anyone who gets the link can download while the file is still valid - treat links
        like capability URLs. The footer on the site repeats the storage / key disclaimer.
      </p>

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Code and operations
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        The app is open source. You configure{" "}
        <span className="inline-block whitespace-nowrap align-middle">
          <TechInlineName href={hrefR2} icon={siCloudflare}>
            R2
          </TechInlineName>
          ,{" "}
          <TechInlineName href={hrefSupabase} icon={siSupabase}>
            Supabase
          </TechInlineName>
        </span>
        , and{" "}
        <code className="rounded bg-zinc-200/80 px-1 font-mono text-[0.8rem] dark:bg-zinc-800">ENCRYPTION_KEY</code>{" "}
        via environment variables; optional cron can clean up expired rows and objects. See the
        project README for migrations and deployment notes.
      </p>

      <p className="mt-10">
        <Link href="/" className={link}>
          ← Back to upload
        </Link>
      </p>
    </article>
  );
}

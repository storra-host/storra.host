import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LegalDocumentLayout } from "@/components/legal/legal-document-layout";
import { TOS_SECTIONS } from "@/lib/legal-sections";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Storra.host: file hosting, user responsibility, storage, limits, and liability.",
  authors: [{ name: "Storra Team" }],
};

const link =
  "text-sky-700 underline decoration-sky-500/40 underline-offset-2 hover:decoration-sky-600 dark:text-sky-400 dark:decoration-sky-500/30";

const h2 =
  "mt-10 scroll-mt-20 text-sm font-semibold text-zinc-900 first:mt-6 dark:text-zinc-100";
const p = "mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400";
const ul = "mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400";

export default function TermsOfServicePage() {
  return (
    <LegalDocumentLayout
      sections={TOS_SECTIONS}
      header={
        <>
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
            Terms of Service (TOS)
          </h1>
          <p className="mt-1.5 text-xs text-zinc-500">
            Last updated:{" "}
            <time dateTime="2026-04-26" className="text-zinc-500">
              April 26, 2026
            </time>
          </p>

          <p className={p}>
            By using Storra.host, you agree to these Terms.
          </p>
        </>
      }
    >
      <article className="w-full min-w-0 text-left" aria-label="Terms of Service content">
        <h2 className={h2} id="service">
          1. Service
        </h2>
        <p className={p}>
          Storra.host is a file hosting service that allows users to upload and share files.
        </p>
        <p className={p}>
          Files are stored using server-side encryption. The service may be modified, limited, or
          discontinued at any time.
        </p>

        <h2 className={h2} id="user-responsibility">
          2. User responsibility
        </h2>
        <p className={p}>You are fully responsible for:</p>
        <ul className={ul}>
          <li>All files you upload</li>
          <li>Any links you share</li>
          <li>Any use of the service through your activity</li>
        </ul>
        <p className={p}>Storra.host does not take responsibility for user content.</p>

        <h2 className={h2} id="data-storage">
          3. Data and storage
        </h2>
        <ul className={ul}>
          <li>Files are stored using server-side encryption</li>
          <li>There is no guarantee of permanence or availability</li>
          <li>
            Files may be deleted at any time, for any reason, with or without notice
          </li>
        </ul>
        <p className={p}>Do not use Storra.host for important or long-term storage.</p>

        <h2 className={h2} id="limits">
          4. Limits
        </h2>
        <p className={p}>We may enforce limits including:</p>
        <ul className={ul}>
          <li>File size limits</li>
          <li>Upload limits</li>
          <li>Download limits</li>
          <li>Storage limits</li>
        </ul>
        <p className={p}>These limits may change at any time.</p>

        <h2 className={h2} id="availability">
          5. Availability
        </h2>
        <p className={p}>The service is provided without guarantees:</p>
        <ul className={ul}>
          <li>Uptime is not guaranteed</li>
          <li>Files may be lost, deleted, or unavailable</li>
          <li>Features may change at any time</li>
        </ul>

        <h2 className={h2} id="enforcement">
          6. Enforcement
        </h2>
        <p className={p}>We reserve full control over the platform and may:</p>
        <ul className={ul}>
          <li>Remove any file</li>
          <li>Restrict or block access</li>
          <li>Limit usage</li>
        </ul>
        <p className={p}>All decisions are final.</p>

        <h2 className={h2} id="disclaimer">
          7. Disclaimer
        </h2>
        <p className={p}>
          The service is provided “as is” without warranties of any kind.
        </p>
        <p className={p}>We are not liable for:</p>
        <ul className={ul}>
          <li>Data loss</li>
          <li>Service interruptions</li>
          <li>Any damages resulting from use of the service</li>
        </ul>

        <h2 className={h2} id="acceptance">
          8. Acceptance
        </h2>
        <p className={p}>By using Storra.host, you agree to these Terms.</p>

        <p className="mt-10">
          <Link href="/" className={link}>
            ← Back to upload
          </Link>
        </p>
      </article>
    </LegalDocumentLayout>
  );
}

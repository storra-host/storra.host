import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LegalDocumentLayout } from "@/components/legal/legal-document-layout";
import { AUP_SECTIONS } from "@/lib/legal-sections";

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description:
    "Acceptable Use Policy for Storra.host: general use, abuse, content, and enforcement.",
  authors: [{ name: "Storra Team" }],
};

const link =
  "text-sky-700 underline decoration-sky-500/40 underline-offset-2 hover:decoration-sky-600 dark:text-sky-400 dark:decoration-sky-500/30";

const h2 =
  "mt-10 scroll-mt-20 text-sm font-semibold text-zinc-900 first:mt-6 dark:text-zinc-100";
const p = "mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400";
const ul = "mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400";

export default function AcceptableUsePolicyPage() {
  return (
    <LegalDocumentLayout
      sections={AUP_SECTIONS}
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
            Acceptable Use Policy (AUP)
          </h1>
          <p className="mt-1.5 text-xs text-zinc-500">
            Last updated:{" "}
            <time dateTime="2026-04-26" className="text-zinc-500">
              April 26, 2026
            </time>
          </p>

          <p className={p}>
            This policy defines acceptable use of Storra.host.
          </p>
        </>
      }
    >
      <article className="w-full min-w-0 text-left" aria-label="Acceptable use policy content">
        <h2 className={h2} id="general-use">
          1. General use
        </h2>
        <p className={p}>
          Storra.host is intended for file hosting and sharing.
        </p>
        <p className={p}>You agree not to use the service in a way that:</p>
        <ul className={ul}>
          <li>Disrupts or degrades the service</li>
          <li>Interferes with other users</li>
          <li>Abuses system resources</li>
        </ul>

        <h2 className={h2} id="abuse">
          2. Abuse
        </h2>
        <p className={p}>We may take action against:</p>
        <ul className={ul}>
          <li>Excessive or automated usage</li>
          <li>Attempts to bypass limits or restrictions</li>
          <li>Behavior that impacts performance or stability</li>
        </ul>

        <h2 className={h2} id="content-control">
          3. Content control
        </h2>
        <p className={p}>We do not actively monitor content.</p>
        <p className={p}>However:</p>
        <ul className={ul}>
          <li>Files may be removed at any time</li>
          <li>Access may be restricted at any time</li>
          <li>No explanation is required</li>
        </ul>

        <h2 className={h2} id="no-guarantees">
          4. No guarantees
        </h2>
        <ul className={ul}>
          <li>Files may be deleted at any time</li>
          <li>Access may be revoked at any time</li>
          <li>The service may change at any time</li>
        </ul>

        <h2 className={h2} id="aup-enforcement">
          5. Enforcement
        </h2>
        <p className={p}>Violation of this policy may result in:</p>
        <ul className={ul}>
          <li>File removal</li>
          <li>Access restriction</li>
          <li>Permanent blocking</li>
        </ul>

        <p className="mt-10">
          <Link href="/" className={link}>
            ← Back to upload
          </Link>
        </p>
      </article>
    </LegalDocumentLayout>
  );
}

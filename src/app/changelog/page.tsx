import type { Metadata } from "next";
import Link from "next/link";
import { ChangelogRichContent } from "@/components/changelog/changelog-md";
import { getChangelogSections } from "@/lib/changelog-markdown";

export const metadata: Metadata = {
  title: "Changelog - Storra.host",
  description:
    "What changed on storra.host: features, security notes, and improvements.",
  authors: [{ name: "Storra Team" }],
};

const link =
  "text-sky-700 underline decoration-sky-500/40 underline-offset-2 hover:decoration-sky-600 dark:text-sky-400 dark:decoration-sky-500/30";

const versionBorder =
  "my-10 border-0 border-t border-zinc-200/90 dark:border-zinc-800/90";

const sectionH2 = "text-xs font-semibold tracking-wide text-zinc-500 normal-case";

export default async function ChangelogPage() {
  const body = await getChangelogSections();

  return (
    <article className="w-full max-w-prose pb-12 text-left">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Changelog
      </h1>
      <p className="mt-1.5 text-xs text-zinc-500">
        Newest first. Notable updates to the public app and self-hosted project. Edit the narrative in{" "}
        <code className="rounded bg-zinc-200/80 px-1 font-mono text-[0.7rem] dark:bg-zinc-800">content/changelog.md</code>
        .
      </p>

      <section className="mt-10">
        <h2 className={sectionH2}>Latest</h2>
        <ChangelogRichContent content={body.latest} />
      </section>

      <hr className={versionBorder} aria-hidden />

      <section>
        <h2 className={sectionH2}>Prior update</h2>
        <ChangelogRichContent content={body.prior} />
      </section>

      <hr className={versionBorder} aria-hidden />

      <section>
        <h2 className={sectionH2}>Initial release</h2>
        <ChangelogRichContent content={body.initial} />
      </section>

      <p className="mt-10">
        <Link href="/" className={link}>
          ← Back to upload
        </Link>
      </p>
    </article>
  );
}

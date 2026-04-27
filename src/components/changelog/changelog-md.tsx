import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const linkClass =
  "text-sky-700 underline decoration-sky-500/40 underline-offset-2 hover:decoration-sky-600 dark:text-sky-400 dark:decoration-sky-500/30";

const codeClass =
  "rounded bg-zinc-200/80 px-1 font-mono text-[0.8rem] dark:bg-zinc-800";

const listClass =
  "mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400";

const strongClass = "font-medium text-zinc-800 dark:text-zinc-200";

type ChangelogRichContentProps = {
  /** Markdown (lists, bold, links, inline code) */
  content: string;
  /** Filled when a section is missing or empty in the file */
  emptyMessage?: string;
};

export function ChangelogRichContent({ content, emptyMessage }: ChangelogRichContentProps) {
  if (!content.trim()) {
    return (
      <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-500">
        {emptyMessage ?? "Nothing here yet. Add notes under this heading in content/changelog.md."}
      </p>
    );
  }

  return (
    <ReactMarkdown
      components={{
        ul: (props) => <ul className={listClass} {...props} />,
        ol: (props) => (
          <ol
            className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"
            {...props}
          />
        ),
        li: (props) => <li className="pl-0.5" {...props} />,
        p: (props) => <p className="mt-2 text-sm first:mt-0" {...props} />,
        a: ({ href, children }) => {
          if (href?.startsWith("/")) {
            return (
              <Link href={href} className={linkClass}>
                {children}
              </Link>
            );
          }
          return (
            <a
              href={href}
              className={linkClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          );
        },
        code: ({ className, children, ...rest }) => {
          if (className?.includes("language-")) {
            return (
              <code
                className={cn("block whitespace-pre text-xs text-zinc-200 dark:text-zinc-200", className)}
                {...rest}
              >
                {children}
              </code>
            );
          }
          return (
            <code className={codeClass} {...rest}>
              {children}
            </code>
          );
        },
        pre: (props) => (
          <pre
            className="mt-2 overflow-x-auto rounded-md border border-zinc-200/50 bg-zinc-900/90 p-2.5 first:mt-0 dark:border-zinc-800/80 dark:bg-zinc-900/60"
            {...props}
          />
        ),
        strong: (props) => <strong className={strongClass} {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

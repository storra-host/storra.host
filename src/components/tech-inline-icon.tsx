import type { ReactNode } from "react";
import type { SimpleIcon } from "simple-icons";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  icon: SimpleIcon;
  className?: string;
};

function BrandMark({ icon, className }: BrandMarkProps) {
  const isNext = icon.slug === "nextdotjs";

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("inline-block h-3.5 w-3.5 shrink-0", className)}
      aria-hidden
    >
      {isNext ? (
        <path
          d={icon.path}
          className="fill-zinc-900 dark:fill-zinc-50"
        />
      ) : (
        <path d={icon.path} fill={`#${icon.hex}`} />
      )}
    </svg>
  );
}

type TechInlineNameProps = {
  icon: SimpleIcon;
  children: ReactNode;
  className?: string;
  href?: string;
};

const inlineName =
  "align-middle inline-flex max-w-full shrink-0 items-center gap-1 whitespace-nowrap";

const linkShell =
  "rounded-sm no-underline transition hover:opacity-90 " +
  "focus-visible:ring-2 focus-visible:ring-sky-500/60 " +
  "focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950";

export function TechInlineName({ icon, children, className, href }: TechInlineNameProps) {
  const isNext = icon.slug === "nextdotjs";

  const inner = (
    <>
      <BrandMark icon={icon} />
      {isNext ? (
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{children}</span>
      ) : (
        <span
          className="font-medium"
          style={{ color: `#${icon.hex}` }}
        >
          {children}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(inlineName, linkShell, className)}
      >
        {inner}
      </a>
    );
  }

  return <span className={cn(inlineName, className)}>{inner}</span>;
}

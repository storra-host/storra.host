import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeExternalHttpsUrl } from "@/lib/safe-url";

const defaultHref = "/blog";
const defaultLabel = "Encrypts on upload - share one link";

type AnnouncementBarProps = {
  href?: string;
  label?: string;
  className?: string;
};

export function AnnouncementBar({
  href: hrefProp,
  label: labelProp,
  className,
}: AnnouncementBarProps) {
  const configuredHref = sanitizeExternalHttpsUrl(process.env.NEXT_PUBLIC_ANNOUNCEMENT_URL);
  const propHref = sanitizeExternalHttpsUrl(hrefProp);
  const href = configuredHref || propHref || hrefProp || defaultHref;
  const label =
    process.env.NEXT_PUBLIC_ANNOUNCEMENT_TEXT?.trim() || labelProp || defaultLabel;

  const isExternal = /^https?:\/\//i.test(href);
  const linkClass =
    "group inline-flex items-center justify-center gap-0.5 px-3 text-[0.7rem] font-medium tracking-wide text-white/95 no-underline [text-shadow:0_1px_1px_rgb(0_0_0/0.12)] dark:[text-shadow:0_1px_2px_rgb(0_0_0/0.45)]";

  const inner = (
    <>
      <span>{label}</span>
      <ChevronRight
        className="h-3 w-3 shrink-0 opacity-90 transition group-hover:translate-x-px"
        aria-hidden
      />
    </>
  );

  return (
    <div
      className={cn(
        "relative z-30 w-full border-b border-rose-950/15 py-1.5 text-center dark:border-white/5",
        "bg-[linear-gradient(90deg,#4c0f0c_0%,#b32520_32%,#e85d3e_50%,#b32520_68%,#4c0f0c_100%)]",
        "dark:bg-[linear-gradient(90deg,#2a0a08_0%,#7c2d12_40%,#f59e0b_50%,#7c2d12_60%,#2a0a08_100%)]",
        className
      )}
    >
      {isExternal ? (
        <a href={href} target="_blank" rel="noreferrer" className={linkClass}>
          {inner}
        </a>
      ) : (
        <Link href={href} className={linkClass}>
          {inner}
        </Link>
      )}
    </div>
  );
}

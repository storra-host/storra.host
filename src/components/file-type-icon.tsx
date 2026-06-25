import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** SVG paths - same set as cloud.storra.host / cloud dashboard */
const FILE_ICONS: Record<string, ReactNode> = {
  EXE: (
    <>
      <path
        stroke="#D5D7DA"
        strokeWidth="1.5"
        d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
      />
      <path stroke="#D5D7DA" strokeWidth="1.5" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
      <rect width="26" height="16" x="1" y="18" fill="#444CE7" rx="2" />
      <path
        fill="#fff"
        d="M4.935 30v-7.273h4.9v1.268H6.472v1.733h3.111v1.268h-3.11v1.736H9.85V30zm7.565-7.273 1.466 2.479h.057l1.474-2.479h1.736l-2.22 3.637L17.284 30h-1.768l-1.492-2.482h-.057L12.475 30h-1.762l2.277-3.636-2.234-3.637zM18.206 30v-7.273h4.9v1.268h-3.362v1.733h3.11v1.268h-3.11v1.736h3.377V30z"
      />
    </>
  ),
  TXT: (
    <>
      <path
        stroke="#D5D7DA"
        strokeWidth="1.5"
        d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
      />
      <path stroke="#D5D7DA" strokeWidth="1.5" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
      <rect width="27" height="16" x="1" y="18" fill="#475467" rx="2" />
      <path
        fill="#fff"
        d="M4.601 23.995v-1.268h5.973v1.268H8.348V30h-1.52v-6.005zM13 22.727l1.466 2.479h.057l1.474-2.479h1.736l-2.22 3.637L17.784 30h-1.768l-1.492-2.482h-.057L12.975 30h-1.762l2.277-3.636-2.234-3.637zm5.43 1.268v-1.268h5.972v1.268h-2.226V30h-1.52v-6.005z"
      />
    </>
  ),
  ZIP: (
    <>
      <path
        stroke="#D5D7DA"
        strokeWidth="1.5"
        d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
      />
      <path stroke="#D5D7DA" strokeWidth="1.5" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
      <rect width="22" height="16" x="1" y="18" fill="#344054" rx="2" />
      <path
        fill="#fff"
        d="M4.58 30v-.913l3.63-5.092H4.573v-1.268h5.568v.913L6.51 28.732h3.64V30zm8.286-7.273V30h-1.538v-7.273zM14.131 30v-7.273h2.87q.826 0 1.41.316.58.314.887.87.309.555.309 1.279t-.312 1.278-.906.863q-.59.309-1.428.309h-1.828V26.41h1.58q.444 0 .731-.153.292-.156.434-.43.145-.276.145-.635 0-.363-.145-.632a.97.97 0 0 0-.434-.423q-.291-.153-.738-.153h-1.037V30z"
      />
    </>
  ),
  DLL: (
    <>
      <path
        stroke="#D5D7DA"
        strokeWidth="1.5"
        d="M4.75 4A3.25 3.25 0 0 1 8 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 32 39.25H8A3.25 3.25 0 0 1 4.75 36z"
      />
      <path stroke="#D5D7DA" strokeWidth="1.5" d="M24 .5V8a4 4 0 0 0 4 4h7.5" />
      <path
        stroke="#6366f1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M11.9 19.5h16.2m-16.2 3.6h16.2m-16.2 3.6h16.2m-16.2 3.6h12.6"
      />
    </>
  ),
};

const DEFAULT_FILE_ICON = (
  <>
    <path
      stroke="#D5D7DA"
      strokeWidth="1.5"
      d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
    />
    <path stroke="#D5D7DA" strokeWidth="1.5" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
    <rect width="26" height="16" x="1" y="18" fill="#475467" rx="2" />
  </>
);

function extensionOf(filename: string): string {
  const base = filename.trim();
  if (!base || base === "." || base.endsWith("/") || base.endsWith("\\")) return "";
  const i = base.lastIndexOf(".");
  if (i <= 0 || i === base.length - 1) return "";
  return base.slice(i + 1).toLowerCase();
}

function iconKeyForExtension(ext: string): keyof typeof FILE_ICONS | null {
  if (!ext) return null;
  if (
    ext === "exe" ||
    ext === "com" ||
    ext === "msi" ||
    ext === "scr" ||
    ext === "msix" ||
    ext === "appx" ||
    ext === "app" ||
    ext === "dmg" ||
    ext === "pkg"
  ) {
    return "EXE";
  }
  if (
    ext === "txt" ||
    ext === "md" ||
    ext === "log" ||
    ext === "nfo" ||
    ext === "rst" ||
    ext === "cfg" ||
    ext === "ini" ||
    ext === "readme"
  ) {
    return "TXT";
  }
  if (
    ext === "zip" ||
    ext === "rar" ||
    ext === "7z" ||
    ext === "tar" ||
    ext === "gz" ||
    ext === "bz2" ||
    ext === "xz" ||
    ext === "tgz" ||
    ext === "zipx" ||
    ext === "cab"
  ) {
    return "ZIP";
  }
  if (ext === "dll" || ext === "ocx" || ext === "sys" || ext === "drv" || ext === "so") {
    return "DLL";
  }
  return null;
}

function ScrapedFileIcon({
  ext,
  className,
}: {
  ext: string;
  className?: string;
}) {
  const key = iconKeyForExtension(ext);
  const icon = key ? FILE_ICONS[key] : null;
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn("h-6 w-6 shrink-0", className)}
      aria-hidden
    >
      {icon ?? DEFAULT_FILE_ICON}
    </svg>
  );
}

function ImageThumbnail({
  alt,
  src,
  className,
}: {
  alt: string;
  src: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-md border border-slate-200/90 bg-slate-100/80 dark:border-zinc-700/80 dark:bg-zinc-900/50",
        className
      )}
      style={{ width: 24, height: 24 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={alt} src={src} className="absolute inset-0 h-full w-full object-cover" />
    </div>
  );
}

export function FileTypeIcon({
  filename,
  className,
  mimeType,
  previewUrl,
}: {
  filename: string;
  className?: string;
  mimeType?: string | null;
  previewUrl?: string | null;
}) {
  const ext = extensionOf(filename);
  const mime = mimeType?.trim() ?? "";

  if (mime.startsWith("image/") && previewUrl) {
    return <ImageThumbnail alt={filename} src={previewUrl} className={className} />;
  }

  return <ScrapedFileIcon ext={ext} className={className} />;
}

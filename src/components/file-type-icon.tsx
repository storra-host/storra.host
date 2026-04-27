import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  Binary,
  Blocks,
  BookOpen,
  Disc,
  Disc3,
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileVideo,
  FileType2,
  Package2,
  Presentation,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IconInfo = { Icon: LucideIcon; className: string };

function getIconInfoForExtension(ext: string): IconInfo {
  const e = ext.toLowerCase();

  if (
    e === "exe" ||
    e === "com" ||
    e === "msi" ||
    e === "scr" ||
    e === "pif" ||
    e === "cpl" ||
    e === "msix" ||
    e === "appx" ||
    e === "ps1" ||
    e === "vbs" ||
    e === "wsf"
  ) {
    return { Icon: AppWindow, className: "text-sky-500 dark:text-sky-400" };
  }

  if (e === "bat" || e === "cmd") {
    return { Icon: Binary, className: "text-slate-500 dark:text-zinc-400" };
  }

  if (e === "dll" || e === "ocx" || e === "sys" || e === "drv" || e === "efi" || e === "mui") {
    return { Icon: Package2, className: "text-amber-600 dark:text-amber-400" };
  }

  if (e === "so" || e === "o" || e === "a" || e === "lib" || e === "obj") {
    return { Icon: Blocks, className: "text-violet-600 dark:text-violet-400" };
  }

  if (e === "dylib" || e === "framework") {
    return { Icon: Blocks, className: "text-fuchsia-600 dark:text-fuchsia-400" };
  }

  if (e === "dmg" || e === "sparseimage" || e === "sparsebundle") {
    return { Icon: Disc3, className: "text-rose-500 dark:text-rose-400" };
  }

  if (e === "pkg" || e === "mpkg") {
    return { Icon: FileType2, className: "text-rose-500 dark:text-rose-400" };
  }

  if (e === "iso" || e === "img" || e === "nrg" || e === "cue" || e === "bin" || e === "toast" || e === "uif") {
    return { Icon: Disc, className: "text-orange-500 dark:text-orange-400" };
  }

  if (e === "deb" || e === "rpm" || e === "flatpak" || e === "snappy") {
    return { Icon: FileType2, className: "text-orange-600 dark:text-orange-400" };
  }

  if (e === "apk" || e === "aab" || e === "xapk") {
    return { Icon: Smartphone, className: "text-emerald-500 dark:text-emerald-400" };
  }

  if (e === "ipa" || e === "app") {
    return { Icon: Smartphone, className: "text-sky-500 dark:text-sky-400" };
  }

  if (
    e === "zip" ||
    e === "rar" ||
    e === "7z" ||
    e === "tar" ||
    e === "gz" ||
    e === "bz2" ||
    e === "xz" ||
    e === "zst" ||
    e === "zipx" ||
    e === "cab" ||
    e === "lzh" ||
    e === "tgz"
  ) {
    return { Icon: FileArchive, className: "text-amber-600 dark:text-amber-400" };
  }

  if (e === "png" || e === "jpg" || e === "jpeg" || e === "gif" || e === "webp" || e === "bmp" || e === "tiff" || e === "tif" || e === "ico" || e === "heic" || e === "avif" || e === "svg" || e === "raw" || e === "cr2" || e === "nef") {
    return { Icon: FileImage, className: "text-cyan-600 dark:text-cyan-400" };
  }

  if (
    e === "mp4" ||
    e === "webm" ||
    e === "avi" ||
    e === "mkv" ||
    e === "mov" ||
    e === "m4v" ||
    e === "wmv" ||
    e === "flv" ||
    e === "ogv" ||
    e === "3gp" ||
    e === "ts" ||
    e === "m2ts" ||
    e === "f4v"
  ) {
    return { Icon: FileVideo, className: "text-fuchsia-600 dark:text-fuchsia-400" };
  }

  if (
    e === "mp3" ||
    e === "wav" ||
    e === "flac" ||
    e === "aac" ||
    e === "m4a" ||
    e === "ogg" ||
    e === "opus" ||
    e === "wma" ||
    e === "aiff" ||
    e === "aif" ||
    e === "mid" ||
    e === "oga"
  ) {
    return { Icon: FileAudio, className: "text-violet-500 dark:text-violet-400" };
  }

  if (e === "pdf") {
    return { Icon: FileText, className: "text-red-500 dark:text-red-400" };
  }

  if (e === "doc" || e === "docx" || e === "odt" || e === "rtf" || e === "epub" || e === "pages" || e === "tex" || e === "wpd" || e === "wps") {
    return { Icon: BookOpen, className: "text-blue-600 dark:text-blue-400" };
  }

  if (e === "xls" || e === "xlsx" || e === "ods" || e === "csv" || e === "tsv" || e === "numbers" || e === "nb") {
    return { Icon: FileSpreadsheet, className: "text-green-600 dark:text-green-400" };
  }

  if (e === "ppt" || e === "pptx" || e === "odp" || e === "key" || e === "pps" || e === "ppsx") {
    return { Icon: Presentation, className: "text-amber-600 dark:text-amber-500" };
  }

  if (e === "md" || e === "txt" || e === "log" || e === "nfo" || e === "cfg" || e === "ini" || e === "license" || e === "readme" || e === "rst") {
    return { Icon: FileText, className: "text-slate-500 dark:text-zinc-400" };
  }

  if (e === "html" || e === "htm" || e === "mhtml") {
    return { Icon: FileCode, className: "text-orange-500 dark:text-orange-400" };
  }

  if (
    e === "js" ||
    e === "mjs" ||
    e === "cjs" ||
    e === "ts" ||
    e === "tsx" ||
    e === "jsx" ||
    e === "json" ||
    e === "json5" ||
    e === "jsonc"
  ) {
    return e === "json" || e === "json5" || e === "jsonc"
      ? { Icon: FileJson, className: "text-amber-500 dark:text-amber-300" }
      : { Icon: FileCode, className: "text-blue-500 dark:text-blue-400" };
  }

  if (e === "rs" || e === "go" || e === "py" || e === "rb" || e === "php" || e === "java" || e === "kt" || e === "swift" || e === "c" || e === "h" || e === "cpp" || e === "hpp" || e === "cc" || e === "cs" || e === "sql" || e === "r" || e === "pl" || e === "sh" || e === "zsh" || e === "bash" || e === "fish" || e === "lua" || e === "ex" || e === "exs" || e === "scala" || e === "clj" || e === "hs" || e === "ml" || e === "elm" || e === "vue" || e === "svelte" || e === "zig" || e === "v" || e === "psm1" || e === "psd1" || e === "dart" || e === "nim" || e === "groovy" || e === "gradle" || e === "cmake" || e === "make" || e === "dockerfile" || e === "toml" || e === "yaml" || e === "yml" || e === "xml" || e === "css" || e === "scss" || e === "sass" || e === "less" || e === "wasm") {
    return { Icon: FileCode, className: "text-sky-500 dark:text-sky-400" };
  }

  if (e === "woff" || e === "woff2" || e === "ttf" || e === "otf" || e === "eot" || e === "tff") {
    return { Icon: FileType2, className: "text-slate-500 dark:text-zinc-400" };
  }

  return { Icon: File, className: "text-slate-500 dark:text-zinc-500" };
}

function extensionOf(filename: string): string {
  const base = filename.trim();
  if (!base || base === "." || base.endsWith("/") || base.endsWith("\\")) return "";
  const i = base.lastIndexOf(".");
  if (i <= 0 || i === base.length - 1) return "";
  return base.slice(i + 1);
}

export function FileTypeIcon({ filename, className }: { filename: string; className?: string }) {
  const ext = extensionOf(filename);
  const { Icon, className: tint } = getIconInfoForExtension(ext);
  return (
    <span title={ext ? `.${ext}` : "file"} className="inline-flex shrink-0">
      <Icon
        className={cn("h-4 w-4", tint, className)}
        aria-hidden
        strokeWidth={1.75}
      />
    </span>
  );
}

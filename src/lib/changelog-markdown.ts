import { readFile } from "node:fs/promises";
import path from "node:path";

export const changelogSections = ["latest", "prior", "initial"] as const;
export type ChangelogSection = (typeof changelogSections)[number];

function sliceSection(raw: string, name: ChangelogSection): string {
  const header = new RegExp(`^##\\s*${name}\\s*$`, "m");
  const m = raw.match(header);
  if (!m || m.index === undefined) return "";
  const after = raw.slice(m.index + m[0].length);
  const next = after.search(/^##\s*(?:latest|prior|initial)\s*$/m);
  return (next === -1 ? after : after.slice(0, next)).trim();
}

export async function getChangelogSections(): Promise<Record<ChangelogSection, string>> {
  const f = path.join(process.cwd(), "content", "changelog.md");
  let raw: string;
  try {
    raw = await readFile(f, "utf-8");
  } catch {
    return { latest: "", prior: "", initial: "" };
  }
  return {
    latest: sliceSection(raw, "latest"),
    prior: sliceSection(raw, "prior"),
    initial: sliceSection(raw, "initial"),
  };
}

import { Caveat } from "next/font/google";
import Link from "next/link";

const caveat = Caveat({ weight: "600", subsets: ["latin"] });

export function BrandTitle() {
  return (
    <Link
      href="/"
      className={`${caveat.className} text-4xl text-slate-900 tracking-tight hover:opacity-90 dark:text-zinc-50 sm:text-5xl`}
    >
      storra.host
    </Link>
  );
}

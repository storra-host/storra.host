import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AppToaster } from "@/components/site/app-toaster";
import { SiteShell } from "@/components/site/shell";
import { THEME_INIT } from "@/components/site/theme-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

const defaultDescription =
  "Upload files securely with browser-first E2EE, fast sharing, and private links.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "storra.host",
    template: "%s · storra.host",
  },
  description: defaultDescription,
  icons: { icon: [{ url: "/favicon.ico", type: "image/x-icon" }] },
  openGraph: {
    type: "website",
    siteName: "storra.host",
    title: "storra.host",
    description: defaultDescription,
    url: new URL(siteUrl).href,
    images: [
      {
        url: "/banner.png",
        alt: "Storra.host",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "storra.host",
    description: defaultDescription,
    images: ["/banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name='admaven-placement' content='Bqjs6rdg8' />
      </head>
      <body className="min-h-full">
        <Script
          id="storra-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT }}
        />
        <SiteShell showBugReport={Boolean(process.env.DISCORD_WEBHOOK_URL)}>
          {children}
        </SiteShell>
        <AppToaster />
      </body>
    </html>
  );
}

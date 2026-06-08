import { execSync } from "node:child_process";
import type { NextConfig } from "next";

function storraGitShortForBuild(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

const nextConfig: NextConfig = {
  env: {
    STORRA_GIT_COMMIT: storraGitShortForBuild() || "unknown",
  },
  // Block streaming until generateMetadata resolves for link-preview bots.
  htmlLimitedBots:
    /Discordbot|discordbot|Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|TelegramBot|WhatsApp/i,
  serverExternalPackages: ["@aws-sdk/client-s3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  async redirects() {
    return [{ source: "/upload", destination: "/", permanent: false }];
  },
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";
    const cspBase = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      scriptSrc,
      "connect-src 'self' https:",
      "form-action 'self'",
      "media-src 'self' blob:",
      "upgrade-insecure-requests",
    ];
    const siteCsp = [...cspBase, "frame-ancestors 'none'"].join("; ");
    const embedCsp = [...cspBase, "frame-ancestors *"].join("; ");
    const sharedHeaders = [
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      },
    ];
    return [
      {
        source: "/e/:path*",
        headers: [
          { key: "Content-Security-Policy", value: embedCsp },
          ...sharedHeaders,
        ],
      },
      {
        source: "/v/:path*",
        headers: [
          { key: "Content-Security-Policy", value: siteCsp },
          { key: "X-Frame-Options", value: "DENY" },
          ...sharedHeaders,
        ],
      },
      {
        source: "/api/files/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, HEAD, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Range, X-Access-Password, Content-Type",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: siteCsp },
          { key: "X-Frame-Options", value: "DENY" },
          ...sharedHeaders,
        ],
      },
    ];
  },
};

export default nextConfig;

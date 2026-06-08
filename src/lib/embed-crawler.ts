const CRAWLER_PATTERN =
  /Discordbot|facebookexternalhit|Twitterbot|Slackbot|LinkedInBot|TelegramBot|WhatsApp/i;

export function isEmbedCrawler(request: Request): boolean {
  const ua = request.headers.get("user-agent") ?? "";
  return CRAWLER_PATTERN.test(ua);
}

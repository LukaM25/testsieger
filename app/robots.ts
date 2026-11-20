import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

const PRIVATE = ['/admin', '/api/', '/dashboard', '/login', '/reset-password', '/precheck/claim', '/precheck/details', '/precheck/success'];

export default function robots(): MetadataRoute.Robots {
  // Suchmaschinen UND KI-Suchsysteme ausdrücklich zulassen (Google, Bing, ChatGPT-Suche,
  // Claude, Perplexity, Gemini, Apple, Amazon, DuckDuckGo). Private Bereiche bleiben gesperrt.
  const aiBots = [
    'OAI-SearchBot',
    'ChatGPT-User',
    'GPTBot',
    'Claude-SearchBot',
    'Claude-User',
    'ClaudeBot',
    'anthropic-ai',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'Applebot',
    'Applebot-Extended',
    'Amazonbot',
    'DuckAssistBot',
    'Bingbot',
  ];
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      ...aiBots.map((userAgent) => ({ userAgent, allow: '/', disallow: PRIVATE })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

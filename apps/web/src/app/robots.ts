import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://jornadaleve.com.br').replace(/\/$/, '');
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/app/', '/api/', '/admin/', '/onboarding/'] },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

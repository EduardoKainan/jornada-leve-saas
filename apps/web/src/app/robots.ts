import type { MetadataRoute } from 'next';
import { getAppUrlWithoutTrailingSlash } from '@/lib/app-url';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppUrlWithoutTrailingSlash();
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/app/', '/api/', '/admin/', '/onboarding/'] },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

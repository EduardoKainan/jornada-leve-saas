import type { MetadataRoute } from 'next';
import { getAppUrlWithoutTrailingSlash } from '@/lib/app-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppUrlWithoutTrailingSlash();
  const lastModified = new Date();
  return [
    { url: baseUrl, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/cadastro`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/entrar`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/recuperar`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];
}

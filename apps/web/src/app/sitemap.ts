import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://jornadaleve.com.br').replace(/\/$/, '');
  const lastModified = new Date();
  return [
    { url: baseUrl, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/cadastro`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/entrar`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/recuperar`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];
}

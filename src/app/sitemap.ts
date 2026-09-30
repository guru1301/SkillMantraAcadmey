import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://skillmantraacademy.com';

  const routes = [
    '',
    '/about',
    '/programs',
    '/for-institutions',
    '/for-corporates',
    '/faculty-development',
    '/student-development',
    '/resources',
    '/events',
    '/contact',
    '/privacy',
    '/terms',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1.0 : route === '/for-institutions' ? 0.9 : 0.8,
  }));
}

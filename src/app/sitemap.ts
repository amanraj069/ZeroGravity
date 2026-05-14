import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://zerogravity.vercel.app';
  
  const routes = [
    '',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/cancellation',
    '/shipping',
    '/login',
    '/signup',
    '/shop',
    '/dashboard',
    '/goals',
    '/quizzes',
    '/leaderboard',
    '/academia',
    '/notes',
    '/studentsHub',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }));
}

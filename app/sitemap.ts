import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { readContent } from '@/lib/content/store';
import { getCourseKinds } from '@/lib/coursesData';
import { absoluteUrl, localeAlternates } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const content = readContent();
  const kindSlugs = getCourseKinds('en').map((kind) => kind.slug);

  const staticPaths = [
    { path: '', priority: 1 },
    { path: '/courses', priority: 0.8 },
    ...content.ageGroups.map((g) => ({ path: `/courses/${g.slug}`, priority: 0.6 })),
    ...kindSlugs.map((slug) => ({ path: `/course/kind/${slug}`, priority: 0.6 })),
    ...content.courses.map((c) => ({ path: `/course/${c.slug}`, priority: 0.5 })),
  ];

  return routing.locales.flatMap((locale) =>
    staticPaths.map(({ path, priority }) => ({
      url: absoluteUrl(locale, path),
      lastModified: new Date(),
      priority,
      alternates: { languages: localeAlternates(path) },
    }))
  );
}

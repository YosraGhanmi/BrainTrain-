import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { readContent } from '@/lib/content/store';
import { getCourseKinds } from '@/lib/coursesData';
import { offeredCourses } from '@/lib/content/summer';
import { absoluteUrl, localeAlternates } from '@/lib/seo';

// Built from the database on request, not at build time
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await readContent();
  const kindSlugs = (await getCourseKinds('en')).map((kind) => kind.slug);

  const staticPaths = [
    { path: '', priority: 1 },
    { path: '/courses', priority: 0.8 },
    { path: '/about', priority: 0.7 },
    ...content.ageGroups.map((g) => ({ path: `/courses/${g.slug}`, priority: 0.6 })),
    ...kindSlugs.map((slug) => ({ path: `/course/kind/${slug}`, priority: 0.6 })),
    ...offeredCourses(content).map((c) => ({ path: `/course/${c.slug}`, priority: 0.5 })),
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

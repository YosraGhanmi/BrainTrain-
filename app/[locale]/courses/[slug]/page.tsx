import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  ArrowLeft,
  Send,
  Star,
  Sparkles,
  Circle,
  Puzzle,
  Feather,
  MoonStar,
  Heart,
  Code2,
  X,
  Pin,
  Ghost,
  TreePine,
  Mic,
  Dices,
  Scissors,
  Droplet,
  Leaf,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import CourseCard from '@/components/course/CourseCard';
import { Link } from '@/i18n/navigation';
import { courseRegisterHref } from '@/lib/preinscription/course-link';
import { getDbPreinscriptionSetting } from '@/lib/db/preinscriptions';
import { getAgeGroup, getCoursesForAgeGroup } from '@/lib/coursesData';
import type { AppLocale } from '@/i18n/routing';
import { absoluteUrl, localeAlternates } from '@/lib/seo';

export const revalidate = 300;

// Rendered on first visit, then cached: see generateStaticParams in
// app/[locale]/layout.tsx
export function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: { params: Promise<{ slug: string; locale: AppLocale }> }): Promise<Metadata> {
  const params = await props.params;
  const group = await getAgeGroup(params.slug, params.locale);
  if (!group) return { title: params.locale === 'fr' ? 'Cours | Braintrain Academy' : 'Courses | Braintrain Academy' };

  const title = params.locale === 'fr' ? `Cours ${group.label} | Braintrain Academy` : `${group.label} Courses | Braintrain Academy`;
  const path = `/courses/${params.slug}`;
  const url = absoluteUrl(params.locale, path);

  return {
    title,
    description: group.description,
    alternates: { canonical: url, languages: localeAlternates(path) },
    openGraph: { title, description: group.description, url, type: 'website' },
  };
}

const decorativeIcons: { icon: LucideIcon; top: string; left: string; size: number; rotate: number }[] = [
  { icon: Send, top: '3%', left: '6%', size: 26, rotate: -20 },
  { icon: Circle, top: '6%', left: '18%', size: 12, rotate: 0 },
  { icon: Code2, top: '5%', left: '32%', size: 24, rotate: 0 },
  { icon: CheckCircle2, top: '4%', left: '46%', size: 22, rotate: 0 },
  { icon: TreePine, top: '7%', left: '60%', size: 24, rotate: 8 },
  { icon: Star, top: '4%', left: '80%', size: 18, rotate: -8 },
  { icon: MoonStar, top: '8%', left: '92%', size: 26, rotate: 10 },
  { icon: Sparkles, top: '20%', left: '96%', size: 20, rotate: 0 },

  { icon: Puzzle, top: '30%', left: '3%', size: 26, rotate: -10 },
  { icon: Mic, top: '38%', left: '10%', size: 22, rotate: -6 },
  { icon: Heart, top: '55%', left: '2%', size: 20, rotate: 8 },
  { icon: Dices, top: '68%', left: '9%', size: 24, rotate: -8 },
  { icon: Feather, top: '82%', left: '5%', size: 22, rotate: 12 },
  { icon: TreePine, top: '92%', left: '14%', size: 22, rotate: -10 },

  { icon: X, top: '18%', left: '90%', size: 20, rotate: 6 },
  { icon: Ghost, top: '34%', left: '95%', size: 24, rotate: -6 },
  { icon: Circle, top: '48%', left: '98%', size: 14, rotate: 0 },
  { icon: Star, top: '62%', left: '97%', size: 18, rotate: -6 },
  { icon: Scissors, top: '74%', left: '92%', size: 20, rotate: 10 },
  { icon: Droplet, top: '88%', left: '96%', size: 18, rotate: -8 },

  { icon: Pin, top: '45%', left: '48%', size: 20, rotate: 12 },
  { icon: Leaf, top: '95%', left: '55%', size: 22, rotate: -10 },
];

export default async function AgeGroupCoursesPage(props: { params: Promise<{ slug: string; locale: AppLocale }> }) {
  const params = await props.params;
  const group = await getAgeGroup(params.slug, params.locale);
  if (!group) notFound();

  const [groupCourses, routeToForm] = await Promise.all([
    getCoursesForAgeGroup(group, params.locale),
    getDbPreinscriptionSetting(),
  ]);
  const t = await getTranslations({ locale: params.locale, namespace: 'courses' });
  const tc = await getTranslations({ locale: params.locale, namespace: 'coursePage' });

  return (
    <div className="flex min-h-screen flex-col text-ink">
      <Navbar />

      <main className="relative flex-1 overflow-hidden bg-surface px-6 pb-24 pt-32 md:px-10 lg:px-16">
        <div className="pointer-events-none absolute inset-0">
          {decorativeIcons.map(({ icon: Icon, top, left, size, rotate }, i) => (
            <Icon
              key={i}
              className="absolute text-[#1f4fd1]/20"
              style={{ top, left, width: size, height: size, transform: `rotate(${rotate}deg)` }}
              strokeWidth={2}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-6xl">
          <Link
            href={`/courses?age=${group.slug}`}
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('allAgeGroups')}
          </Link>

          {group.stage ? (
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">{group.stage}</p>
          ) : null}
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            {group.label}
          </h1>
          <p className="mt-3 max-w-xl text-stone">{group.description}</p>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            {groupCourses.map(({ slug, title, category, summary, description, icon, color, image, summer }) => (
              <CourseCard
                key={slug}
                title={title}
                category={category}
                summary={summary || description}
                icon={icon}
                color={color}
                image={image}
                ageLabel={group.label}
                summerLabel={summer ? tc('summerBadge') : undefined}
                detailsHref={`/course/${slug}?age=${group.slug}`}
                detailsLabel={t('discoverProgram')}
                enrollHref={courseRegisterHref(routeToForm, slug, `/courses/${group.slug}`)}
                enrollLabel={t('enroll')}
              />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

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
import CourseIllustration from '@/components/illustrations/CourseIllustration';
import { Link } from '@/i18n/navigation';
import { getAgeGroup, getCoursesForAgeGroup } from '@/lib/coursesData';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { slug: string; locale: AppLocale } }): Metadata {
  const group = getAgeGroup(params.slug, params.locale);
  return {
    title: group ? `${group.label} Courses — BrainTrain` : 'Courses — BrainTrain',
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

export default async function AgeGroupCoursesPage({ params }: { params: { slug: string; locale: AppLocale } }) {
  const group = getAgeGroup(params.slug, params.locale);
  if (!group) notFound();

  const groupCourses = getCoursesForAgeGroup(group, params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'courses' });

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
            href="/courses"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('allAgeGroups')}
          </Link>

          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            {group.label}
          </h1>
          <p className="mt-3 max-w-xl text-stone">{group.description}</p>

          <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {groupCourses.map(({ slug, title, icon: Icon, color, image }, index) => (
              <div
                key={slug}
                className="relative rounded-tl-xl rounded-tr-[2.5rem] rounded-bl-[2.5rem] rounded-br-xl border border-ink/10 bg-white p-6 pt-9 text-center shadow-sm"
              >
                <span className="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full border-4 border-surface bg-accent text-sm font-extrabold text-white shadow-sm">
                  {index + 1}
                </span>

                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={title} className="h-32 w-full rounded-2xl object-cover" />
                ) : (
                  <CourseIllustration icon={Icon} color={color} className="h-32 w-full rounded-2xl" />
                )}

                <h3 className="mt-5 text-lg font-extrabold text-ink">{title}</h3>

                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href={`/course/${slug}?age=${group.slug}`}
                    className="w-full rounded-full border border-ink/10 px-4 py-2 text-sm font-bold text-ink transition hover:bg-ink/5"
                  >
                    {t('viewDetails')}
                  </Link>
                  <Link
                    href="/register"
                    className="w-full rounded-full bg-[#ff8c42] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    {t('enroll')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

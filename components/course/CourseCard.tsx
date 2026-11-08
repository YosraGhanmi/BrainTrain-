import Image from 'next/image';
import { ArrowRight, Sun, Users, type LucideIcon } from 'lucide-react';
import CourseIllustration from '@/components/illustrations/CourseIllustration';
import { Link } from '@/i18n/navigation';

// A course on its age group's page: a picture panel in the course's colour
// that curves into the white body, with a label over it. An uploaded image
// replaces the drawing; an empty label is hidden.
export default function CourseCard({
  title,
  category,
  summary,
  icon: Icon,
  color,
  image,
  ageLabel,
  summerLabel,
  detailsHref,
  detailsLabel,
  enrollHref,
  enrollLabel,
}: {
  title: string;
  category: string;
  summary: string;
  icon: LucideIcon;
  color: string;
  image?: string;
  ageLabel: string;
  // Set only on summer school courses
  summerLabel?: string;
  detailsHref: string;
  detailsLabel: string;
  enrollHref: string;
  enrollLabel: string;
}) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_45px_-20px_rgba(15,31,77,0.25)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_55px_-20px_rgba(15,31,77,0.32)] motion-reduce:transform-none motion-reduce:transition-none">
      <div
        className="relative h-52 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}1f 0%, ${color}4d 100%)` }}
      >
        {image ? (
          <Image src={image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        ) : (
          <>
            <span aria-hidden className="absolute -bottom-16 -left-10 h-48 w-64 rounded-full" style={{ backgroundColor: `${color}26` }} />
            <span aria-hidden className="absolute -right-12 -top-14 h-44 w-44 rounded-full" style={{ backgroundColor: `${color}33` }} />
            <svg aria-hidden viewBox="0 0 40 40" className="absolute left-[30%] top-20 h-9 w-9" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round">
              <path d="M6 30 13 10M18 32l6-14M28 34l8-9" />
            </svg>
            <div className="absolute -bottom-1 right-[4%] h-44 w-44 sm:right-[8%] sm:h-52 sm:w-52">
              <CourseIllustration icon={Icon} color={color} className="h-full w-full" />
            </div>
          </>
        )}

        <svg aria-hidden viewBox="0 0 500 40" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-9 w-full">
          <path d="M0 30C120 8 220 6 320 20s140 14 180-6v26H0Z" fill="#fff" />
        </svg>

        {category ? (
          <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-1.5 pr-4 text-xs font-bold uppercase tracking-wide text-[#0f1f4d] shadow-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: `${color}26`, color }}>
              <Icon className="h-4 w-4" strokeWidth={2.25} />
            </span>
            {category}
          </span>
        ) : null}
        {summerLabel ? (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800 shadow-sm">
            <Sun className="h-3 w-3" />
            {summerLabel}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h3 className="text-xl font-extrabold text-[#0f1f4d]">{title}</h3>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-stone">
            <Users className="h-3.5 w-3.5" />
            {ageLabel}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone">{summary}</p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
          {/* The whole card opens the course page; the enroll button sits above it */}
          <Link
            href={detailsHref}
            aria-label={`${detailsLabel}: ${title}`}
            className="group inline-flex items-center gap-2 text-sm font-bold text-[#0f1f4d] after:absolute after:inset-0 after:rounded-[2rem]"
          >
            {detailsLabel}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 motion-reduce:transform-none" />
          </Link>
          <Link
            href={enrollHref}
            aria-label={`${enrollLabel}: ${title}`}
            className="relative z-10 grow rounded-full bg-[#ff8c42] px-7 py-2.5 text-center text-sm font-bold text-[#0f1f4d] transition hover:opacity-90 sm:grow-0 md:grow lg:grow-0"
          >
            {enrollLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}

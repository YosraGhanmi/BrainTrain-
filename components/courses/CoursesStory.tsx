import Image from 'next/image';
import { ArrowDown, ArrowRight, Blocks, Flag, Lightbulb } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { CoursesStoryContent, CoursesStoryPoint, LocalizedString } from '@/lib/content/types';
import type { AppLocale } from '@/i18n/routing';
import { roadPath } from '@/components/courses/road';
import RoadWalker from '@/components/courses/RoadWalker';
import StoryRoulette from '@/components/courses/StoryRoulette';
import { CHAPTER_COLORS, Eyebrow, Highlighted, two } from '@/components/courses/story-parts';

// One step of the path: an age group and the courses it offers
export type PathStep = {
  slug: string;
  label: string;
  stage: string;
  description: string;
  image: string;
};

// The opening's photos, one colour per age group stage, for their hover border
const STAGE_COLORS = ['#ff8c42', '#2ec4b6', '#3d7fff', '#8b6cff'];
// The vision's qualities, in order (think, create, dare): each one's icon,
// stroked with a gradient defined once on the page
const VISION_ICONS = [
  { Icon: Lightbulb, from: '#ff8c42', to: '#ff5d73' },
  { Icon: Blocks, from: '#2ec4b6', to: '#3d7fff' },
  { Icon: Flag, from: '#3d7fff', to: '#8b6cff' },
];
// The same, deep enough for white text on them and for text on white
const STAGE_DEEP = ['#c2410c', '#0f766e', '#2563eb', '#6d28d9'];

type Chapter = { id: string; label: string; teaser: string };

// The chapters as stops along a road. On larger screens the road crosses the
// whole screen: straight from the left edge, winding through the stops, then
// straight on to the right edge. On phones it runs straight down the side.
function ChapterRoad({ chapters, label }: { chapters: Chapter[]; label: string }) {
  const { d, ys } = roadPath(chapters.length);
  // The road box is 60 units tall, drawn ROAD_PX tall: a stop's centre in px.
  // The winding part starts and ends level at mid-height (30), where the
  // straight stretches join it.
  const ROAD_PX = 112;
  const centre = (y: number) => (y / 60) * ROAD_PX;
  const marker =
    'flex items-center justify-center rounded-full font-display font-bold tabular-nums text-white transition duration-300 group-hover:scale-110 group-hover:brightness-110';
  // The stop's own colour, with a soft glow of it underneath
  const markerStyle = (c: Chapter) => {
    const color = CHAPTER_COLORS[c.id] ?? '#0f1f4d';
    return { backgroundColor: color, boxShadow: `0 0 0 5px #ffffff, 0 10px 28px ${color}66` };
  };
  // The road's surface and its dashed centre line, for the straight stretches
  const straight = 'absolute top-1/2 h-[22px] -translate-y-1/2 bg-navy';
  const straightDashes =
    'absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-[repeating-linear-gradient(to_right,rgba(255,255,255,0.8)_0_10px,transparent_10px_22px)]';

  return (
    <nav aria-label={label} className="mx-auto mt-20 max-w-6xl lg:mt-28">
      <div className="relative hidden sm:block">
        <div aria-hidden className="road-reveal absolute inset-x-0 top-0" style={{ height: ROAD_PX }}>
          <span className={`${straight} right-full w-[50vw]`} style={{ top: centre(30) }}>
            <span className={straightDashes} />
          </span>
          <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
            <path d={d} fill="none" stroke="#0f1f4d" strokeWidth={22} vectorEffect="non-scaling-stroke" />
            <path
              d={d}
              fill="none"
              stroke="#ffffff"
              strokeOpacity={0.8}
              strokeWidth={2}
              strokeDasharray="10 12"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span className={`${straight} left-full w-[50vw]`} style={{ top: centre(30) }}>
            <span className={straightDashes} />
          </span>
        </div>

        {/* Before the stops, so he passes behind the circles */}
        <RoadWalker count={chapters.length} roadHeight={ROAD_PX} />

        <ol className="pointer-events-none relative grid" style={{ gridTemplateColumns: `repeat(${chapters.length}, minmax(0, 1fr))` }}>
          {chapters.map((c, i) => (
            <li key={c.id} className="road-stop group px-3 lg:px-6" style={{ animationDelay: `${0.5 + i * 0.15}s` }}>
              {/* The road strip lets taps through to the walker; only the
                  circle and the text below it are links */}
              <div className="relative" style={{ height: ROAD_PX }}>
                <a
                  href={`#${c.id}`}
                  tabIndex={-1}
                  aria-hidden
                  className={`pointer-events-auto absolute left-1/2 h-[4.5rem] w-[4.5rem] -translate-x-1/2 text-xl ${marker}`}
                  style={{ top: centre(ys[i]) - 36, ...markerStyle(c) }}
                >
                  {two(i + 1)}
                </a>
              </div>
              <a
                href={`#${c.id}`}
                className="pointer-events-auto mt-10 block rounded-2xl text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                <span aria-hidden className="mx-auto mb-3 block h-1 w-8 rounded-full" style={{ backgroundColor: CHAPTER_COLORS[c.id] }} />
                <span className="block font-display text-xl font-semibold text-navy">{c.label}</span>
                {c.teaser ? <span className="mx-auto mt-2 line-clamp-3 block max-w-[16rem] text-sm leading-relaxed text-stone">{c.teaser}</span> : null}
              </a>
            </li>
          ))}
        </ol>
      </div>

      {/* Phones: a straight road down the side */}
      <ol className="relative space-y-8 sm:hidden">
        <span aria-hidden className="absolute bottom-7 left-[24px] top-7 w-[18px] -translate-x-1/2 bg-navy">
          <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.8)_0_10px,transparent_10px_22px)]" />
        </span>
        {chapters.map((c, i) => (
          <li key={c.id}>
            <a href={`#${c.id}`} className="group flex items-center gap-5">
              <span className={`relative h-12 w-12 shrink-0 text-base ${marker}`} style={markerStyle(c)}>
                {two(i + 1)}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-lg font-semibold text-navy">{c.label}</span>
                {c.teaser ? <span className="mt-0.5 line-clamp-2 block text-sm text-stone">{c.teaser}</span> : null}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default async function CoursesStory({
  story,
  steps,
  locale,
}: {
  story: CoursesStoryContent;
  steps: PathStep[];
  locale: AppLocale;
}) {
  const t = await getTranslations({ locale, namespace: 'coursesStory' });
  const text = (value: LocalizedString) => value[locale] || value.en;
  const shown = (points: CoursesStoryPoint[]) =>
    points.map((p) => ({ title: text(p.title), body: text(p.body) })).filter((p) => p.title);

  const problems = shown(story.problems);
  const answers = shown(story.answers);
  const visions = shown(story.visions);
  const photos = steps.filter((s) => s.image).slice(0, 4);

  // The chapters, for the index under the opening
  // The chapters, for the road under the opening: each one's name and its
  // heading as a teaser
  const plain = (value: LocalizedString) => text(value).replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  const chapters: Chapter[] = [
    { id: 'constat', label: text(story.problemEyebrow), teaser: plain(story.problemHeading) },
    { id: 'reponse', label: text(story.answerEyebrow), teaser: plain(story.answerHeading) },
    { id: 'parcours', label: text(story.pathEyebrow), teaser: plain(story.pathHeading) },
    { id: 'vision', label: text(story.visionEyebrow), teaser: plain(story.visionHeading) },
  ].filter((c) => c.label);

  return (
    <>
      {/* 1. Opening */}
      <section className="overflow-x-clip px-6 pb-16 pt-32 md:px-10 lg:px-16 lg:pb-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            {text(story.eyebrow) ? (
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">{text(story.eyebrow)}</p>
            ) : null}
            <h1 className="mt-4 text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight text-navy sm:text-5xl">
              <Highlighted text={text(story.heading)} />
            </h1>
            {text(story.intro) ? <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone">{text(story.intro)}</p> : null}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/preinscription"
                className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1a2f6b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {t('preregister')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href="#parcours"
                className="inline-flex items-center gap-2 rounded-full border border-navy/15 bg-white px-6 py-3 text-sm font-semibold text-navy transition hover:border-navy/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {t('seePath')}
                <ArrowDown className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>

          {photos.length ? (
            <div className="grid grid-cols-2 gap-4">
              {photos.map((step, i) => (
                <div key={step.slug} className={i % 2 === 1 ? 'translate-y-8' : ''}>
                  {/* On hover: a border in the stage's colour spins around the
                      photo, the card lifts and glows, the photo zooms in and
                      a "see the courses" line slides up */}
                  <Link
                    href={`/courses/${step.slug}`}
                    className="photo-frame group/photo block rounded-[1.75rem] transition duration-500 ease-out hover:-translate-y-1.5 hover:shadow-[0_28px_60px_-18px_var(--photo-color)] focus-visible:-translate-y-1.5 focus-visible:outline-none"
                    style={{ '--photo-color': STAGE_COLORS[i % STAGE_COLORS.length] } as React.CSSProperties}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-soft">
                      <Image
                        src={step.image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 270px, 45vw"
                        className="object-cover transition duration-700 ease-out group-hover/photo:scale-110"
                        priority={i < 2}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a3a]/80 via-[#0b1a3a]/5 to-transparent transition duration-500 group-hover/photo:from-[#0b1a3a]/90 group-hover/photo:via-[#0b1a3a]/25" />
                      <div className="absolute bottom-4 left-4 right-4 text-white transition duration-500 ease-out group-hover/photo:-translate-y-1">
                        <span aria-hidden className="mb-2 block h-1 w-7 rounded-full transition-all duration-500 group-hover/photo:w-12" style={{ backgroundColor: 'var(--photo-color)' }} />
                        <span className="block text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/75">{t('step', { number: i + 1 })}</span>
                        <span className="block text-sm font-semibold">{step.label}</span>
                        <span className="grid grid-rows-[0fr] transition-all duration-500 ease-out group-hover/photo:grid-rows-[1fr] group-focus-visible/photo:grid-rows-[1fr]">
                          <span className="flex items-center gap-1.5 overflow-hidden text-xs font-semibold text-white/90 opacity-0 transition duration-500 group-hover/photo:opacity-100 group-focus-visible/photo:opacity-100">
                            <span className="pt-1.5">{t('seeCourses', { group: step.label })}</span>
                            <ArrowRight className="mt-1.5 h-3.5 w-3.5 transition group-hover/photo:translate-x-0.5" aria-hidden />
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {chapters.length ? <ChapterRoad chapters={chapters} label={t('chapters')} /> : null}
      </section>

      {/* 2. The problem: the heading stays in view on the left while the
          problems pass by on the right */}
      <section id="constat" className="scroll-mt-24 px-6 py-20 md:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div className="story-reveal lg:sticky lg:top-32 lg:self-start">
            <Eyebrow number={1} text={text(story.problemEyebrow)} color={CHAPTER_COLORS.constat} />
            <h2 className="mt-5 text-balance font-display text-3xl font-semibold leading-tight tracking-tight text-navy sm:text-4xl">
              <Highlighted text={text(story.problemHeading)} tone="red" />
            </h2>
            {text(story.problemIntro) ? <p className="mt-5 text-lg leading-relaxed text-stone">{text(story.problemIntro)}</p> : null}
          </div>

          {problems.length ? (
            <ol className="space-y-5">
              {problems.map((p, i) => (
                <li key={i} className="story-reveal">
                  <div className="group relative grid grid-cols-[auto_1fr] gap-6 overflow-hidden rounded-3xl border border-ink/[0.07] bg-white p-7 shadow-[0_10px_40px_-18px_rgba(15,31,77,0.18)] transition duration-500 ease-out hover:-translate-y-1 hover:border-[#d93f3f]/25 hover:shadow-[0_24px_50px_-20px_rgba(217,63,63,0.35)] sm:gap-8 sm:p-8">
                    {/* The red edge grows down the card on hover */}
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-[#d93f3f] transition-transform duration-500 ease-out group-hover:scale-y-100"
                    />
                    <span
                      aria-hidden
                      className="font-display text-5xl font-bold leading-none tabular-nums text-transparent transition-colors duration-500 [-webkit-text-stroke:1.5px_#d93f3f] group-hover:text-[#d93f3f] sm:text-6xl"
                    >
                      {two(i + 1)}
                    </span>
                    <div className="min-w-0 self-center">
                      <h3 className="font-display text-xl font-semibold leading-snug text-navy">{p.title}</h3>
                      {p.body ? <p className="mt-2 leading-relaxed text-stone">{p.body}</p> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </section>

      {/* 3. Our answer: the main idea, large, then the answers. Larger
          screens: a wheel that turns as you scroll. Phones and tablets: a grid. */}
      <section id="reponse" className="relative scroll-mt-24 bg-navy text-white">
        {/* Clipped in its own layer: overflow on the section would stop the
            wheel below from sticking */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(61,127,255,0.35),transparent_65%)]" />
        </div>
        <div className="relative px-6 pb-16 pt-24 md:px-10 lg:px-16 lg:pb-10 lg:pt-36">
          <div className="story-reveal relative mx-auto max-w-6xl">
            <Eyebrow number={2} text={text(story.answerEyebrow)} dark />
            <h2 className="mt-6 max-w-5xl text-balance font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              <Highlighted text={text(story.answerHeading)} dark />
            </h2>
            {text(story.answerIntro) ? (
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/75 lg:text-xl">{text(story.answerIntro)}</p>
            ) : null}
          </div>
        </div>

        {answers.length ? (
          <>
            <div className="hidden lg:block">
              <StoryRoulette items={answers} dark />
            </div>
            <div className="px-6 pb-20 md:px-10 lg:hidden">
              <ul className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2">
                {answers.map((a, i) => (
                  <li key={i} className="bg-navy p-7">
                    <span className="font-display text-3xl font-semibold tabular-nums text-[#8fb4ff]/60">{two(i + 1)}</span>
                    <h3 className="mt-4 font-display text-xl font-semibold leading-snug">{a.title}</h3>
                    {a.body ? <p className="mt-3 leading-relaxed text-white/70">{a.body}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="pb-12 lg:pb-20" />
        )}
      </section>

      {/* 4. The path, one step per age group */}
      <section id="parcours" className="scroll-mt-24 px-6 py-20 md:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="story-reveal">
            <Eyebrow number={3} text={text(story.pathEyebrow)} color={CHAPTER_COLORS.parcours} />
            <h2 className="mt-5 max-w-3xl text-balance font-display text-3xl font-semibold leading-tight tracking-tight text-navy sm:text-4xl">
              <Highlighted text={text(story.pathHeading)} />
            </h2>
            {text(story.pathIntro) ? <p className="mt-5 max-w-2xl text-lg text-stone">{text(story.pathIntro)}</p> : null}
          </div>

          {/* The steps along a line that fills with colour as you scroll */}
          <div className="relative mt-14">
            <div aria-hidden className="absolute bottom-10 left-[1.1rem] top-10 w-0.5 -translate-x-1/2 rounded-full bg-navy/10 md:left-[1.4rem]">
              <div
                className="path-line h-full w-full rounded-full"
                style={{ background: `linear-gradient(to bottom, ${STAGE_COLORS.join(', ')})` }}
              />
            </div>
            <ol className="relative space-y-8 md:space-y-10">
              {steps.map((step, i) => {
                const color = STAGE_COLORS[i % STAGE_COLORS.length];
                const deep = STAGE_DEEP[i % STAGE_DEEP.length];
                return (
                  <li key={step.slug} className="relative pl-12 md:pl-20" style={{ '--stage': color } as React.CSSProperties}>
                    <span
                      aria-hidden
                      className="path-dot absolute left-0 top-8 flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-semibold text-white ring-8 ring-surface md:h-11 md:w-11 md:text-base"
                      style={{ backgroundColor: deep }}
                    >
                      {i + 1}
                    </span>
                    <div className="path-card">
                    <article className="group relative isolate flex flex-col gap-5 overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white p-3 shadow-soft transition duration-500 hover:-translate-y-1 hover:border-[var(--stage)] hover:shadow-[0_24px_60px_-28px_var(--stage)] md:flex-row md:gap-8">
                      {/* A soft wash of the stage's colour in the corner, and
                          its number, large and outlined */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full opacity-[0.14] blur-2xl transition-opacity duration-500 group-hover:opacity-25"
                        style={{ backgroundColor: color }}
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -top-5 right-5 -z-10 select-none font-display text-[7rem] font-bold leading-none text-transparent opacity-25 transition duration-500 group-hover:translate-y-1 group-hover:opacity-50 md:text-[8.5rem]"
                        style={{ WebkitTextStroke: `1.5px ${color}` }}
                      >
                        {two(i + 1)}
                      </span>

                      {step.image ? (
                        <div className="path-photo relative aspect-[16/10] shrink-0 overflow-hidden rounded-[1.25rem] md:aspect-auto md:min-h-[13rem] md:w-56 lg:w-64">
                          <Image
                            src={step.image}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 256px, (min-width: 768px) 224px, 90vw"
                            className="object-cover transition duration-700 group-hover:scale-105"
                          />
                        </div>
                      ) : null}

                      <div className="flex min-w-0 flex-1 flex-col px-3 pb-3 md:px-0 md:py-4 md:pr-5">
                        <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: deep }}>
                          {t('step', { number: i + 1 })} · {step.label}
                        </p>
                        <h3 className="mt-2 font-display text-2xl font-semibold text-navy md:text-[1.7rem]">{step.stage || step.label}</h3>
                        {step.description ? <p className="mt-3 max-w-2xl leading-relaxed text-stone">{step.description}</p> : null}
                        <div className="mt-auto flex justify-end pt-6">
                          {/* The whole card opens the age group */}
                          <Link
                            href={`/courses/${step.slug}`}
                            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition duration-300 after:absolute after:inset-0 after:rounded-[1.75rem] group-hover:gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage)]"
                            style={{ backgroundColor: deep }}
                          >
                            {t('seeCourses', { group: step.label })}
                            <ArrowRight className="h-4 w-4" aria-hidden />
                          </Link>
                        </div>
                      </div>
                    </article>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* 5. The vision: the statement, then its qualities in columns */}
      <section id="vision" className="relative scroll-mt-24 bg-white px-6 py-28 md:px-10 lg:px-16 lg:py-40">
        {/* Wavy edges into the grey sections above and below */}
        <svg aria-hidden viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-12 w-full fill-surface lg:h-20">
          <path d="M0 0H1440V34C1320 66 1200 70 1080 50C960 30 840 0 720 14C600 28 480 70 360 66C240 62 120 30 0 44Z" />
        </svg>
        <svg aria-hidden viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-12 w-full fill-surface lg:h-20">
          <path d="M0 80H1440V40C1320 18 1200 6 1080 22C960 38 840 74 720 64C600 54 480 12 360 10C240 8 120 40 0 30Z" />
        </svg>
        <div className="relative mx-auto max-w-6xl">
          <div className="story-reveal">
            <Eyebrow number={4} text={text(story.visionEyebrow)} color={CHAPTER_COLORS.vision} />
            <h2 className="mt-6 whitespace-pre-line text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight text-navy sm:text-5xl lg:text-[3.25rem]">
              <Highlighted text={text(story.visionHeading)} />
            </h2>
          </div>

          {visions.length ? (
            <>
              <svg aria-hidden className="absolute h-0 w-0">
                <defs>
                  {VISION_ICONS.map((v, i) => (
                    <linearGradient key={i} id={`vision-icon-${i}`} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor={v.from} />
                      <stop offset="1" stopColor={v.to} />
                    </linearGradient>
                  ))}
                </defs>
              </svg>
              <ul className="mt-16 grid gap-12 sm:grid-cols-3 sm:gap-10 lg:mt-20 lg:gap-16">
                {visions.map((v, i) => {
                  const { Icon } = VISION_ICONS[i % VISION_ICONS.length];
                  return (
                    <li key={i} className="story-reveal group">
                      <span className="flex h-20 w-20 items-center justify-center rounded-full border border-ink/5 bg-white shadow-[0_18px_40px_-18px_rgba(15,31,77,0.35)] transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_24px_48px_-18px_rgba(15,31,77,0.45)] lg:h-24 lg:w-24">
                        <Icon
                          aria-hidden
                          stroke={`url(#vision-icon-${i % VISION_ICONS.length})`}
                          strokeWidth={2}
                          className="h-9 w-9 transition-transform duration-500 group-hover:scale-110 lg:h-10 lg:w-10"
                        />
                      </span>
                      <h3 className="mt-8 font-display text-3xl font-semibold tracking-tight text-navy lg:text-4xl">{v.title}</h3>
                      {v.body ? <p className="mt-3 max-w-xs leading-relaxed text-stone">{v.body}</p> : null}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}

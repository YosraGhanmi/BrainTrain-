import type { CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import DoodleBackdrop from '@/components/effects/DoodleBackdrop';
import EventsHero from '@/components/events/EventsHero';
import EventVideo from '@/components/events/EventVideo';

export type EventsViewStory = {
  id: string;
  kicker: string;
  title: string;
  date: string;
  standfirst: string;
  paragraphs: string[];
  speakers: { name: string; role: string }[];
  facebookUrl: string;
  videoFile: string;
  poster: string;
  portrait: boolean;
  postUrl: string;
};

export type EventsViewData = {
  eyebrow: string;
  heading: string;
  intro: string;
  heroImages: string[];
  upcoming: {
    eyebrow: string;
    title: string;
    tagline: string;
    paragraphs: string[];
    dateLabel: string;
    image: string;
    imageAlt: string;
    facebookUrl: string;
    videoFile: string;
    poster: string;
    portrait: boolean;
  } | null;
  stories: EventsViewStory[];
  labels: { playVideo: string; closeVideo: string; viewPost: string; speakers: string; galleryLabel: string; zoomPhoto: string };
};

// The site's accents, one per story. `deep` is the readable shade for text on
// the light page.
const ACCENTS = [
  { accent: '#ef4b4b', deep: '#c83030' },
  { accent: '#7b91f4', deep: '#283880' },
  { accent: '#2ec4b6', deep: '#0f7f74' },
  { accent: '#ff8c42', deep: '#d9560f' },
];

const NAVY = '#0b1a3a';
// Video previews are tall, plain photos are wide
const VIDEO_SHAPE = 'aspect-[4/5] rounded-[1.5rem]';
const PHOTO_SHAPE = 'aspect-[4/3] rounded-[1.5rem]';

function withStars(text: string, star: (part: string, key: number) => React.ReactNode) {
  return text.split(/\*(.+?)\*/).map((part, i) => (i % 2 === 1 ? star(part, i) : part));
}

const hasVideo = (s: { videoFile: string; facebookUrl: string }) => Boolean(s.videoFile || s.facebookUrl);

function PillLink({ href, accent, children }: { href: string; accent: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ '--accent': accent } as CSSProperties}
      className="group/btn relative inline-flex items-center gap-3 rounded-full bg-[#0b1a3a] py-2.5 pl-5 pr-2.5 text-[0.8rem] font-bold uppercase tracking-wide text-white transition-all duration-200 hover:gap-4 hover:bg-[var(--accent)] hover:text-[#0b1a3a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b1a3a]"
    >
      {children}
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-colors duration-200 group-hover/btn:bg-white group-hover/btn:text-[var(--accent)]">
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </a>
  );
}

// The words of a story, straight on the page
function StoryText({ story, accent, deep, labels, large }: { story: EventsViewStory; accent: string; deep: string; labels: EventsViewData['labels']; large?: boolean }) {
  return (
    <div>
      <p className="flex items-center gap-3 text-[0.75rem] font-bold uppercase tracking-[0.25em]" style={{ color: deep }}>
        <span className="h-0.5 w-8 rounded-full" style={{ backgroundColor: accent }} aria-hidden="true" />
        {story.kicker}
        <span className="text-[#0b1a3a]/40">{story.date}</span>
      </p>
      <h2
        className={`mt-5 font-display font-extrabold leading-[0.98] tracking-tight text-[#0b1a3a] ${
          large ? 'text-5xl sm:text-6xl lg:text-7xl' : 'text-4xl sm:text-5xl'
        }`}
      >
        {story.title}
      </h2>
      {story.standfirst ? <p className="mt-6 max-w-xl text-xl font-semibold leading-snug" style={{ color: deep }}>{story.standfirst}</p> : null}
      {story.paragraphs.length > 0 ? (
        <div className="mt-6 max-w-xl space-y-4">
          {story.paragraphs.map((p, i) => (
            <p key={i} className="text-[1.02rem] leading-relaxed text-[#0b1a3a]/75">
              {p}
            </p>
          ))}
        </div>
      ) : null}
      {story.speakers.length > 0 ? (
        <div className="mt-8 max-w-xl">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-[#0b1a3a]/45">{labels.speakers}</p>
          <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {story.speakers.map((s) => (
              <li key={s.name} className="border-l-[3px] pl-3" style={{ borderColor: accent }}>
                <span className="block font-display text-lg font-bold leading-tight text-[#0b1a3a]">{s.name}</span>
                {s.role ? <span className="block text-sm text-[#0b1a3a]/60">{s.role}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {story.postUrl ? (
        <div className="mt-8">
          <PillLink href={story.postUrl} accent={accent}>
            {labels.viewPost}
          </PillLink>
        </div>
      ) : null}
    </div>
  );
}

// A big edition number, for a story with no video and no photo
function Opener({ story, accent }: { story: EventsViewStory; accent: string }) {
  const [series] = story.kicker.split('·');
  const number = /(\d+)\s*$/.exec(story.kicker)?.[1] ?? '';
  return (
    <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center rounded-[1.5rem] bg-[radial-gradient(120%_80%_at_20%_10%,#283880_0%,#0b1a3a_60%,#060d20_100%)] text-white">
      <span className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-white/70">{series.trim()}</span>
      <span className="font-display text-[9rem] font-extrabold leading-[0.85]" style={{ color: accent }} aria-hidden="true">
        {number}
      </span>
    </div>
  );
}

// The picture side of a story
function StoryMedia({ story, accent, labels, large }: { story: EventsViewStory; accent: string; labels: EventsViewData['labels']; large?: boolean }) {
  const video = hasVideo(story);
  const shape = video ? VIDEO_SHAPE : PHOTO_SHAPE;
  // Tall video previews stay narrow; wide photos fill their column
  const width = video ? (large ? 'max-w-[26rem]' : 'max-w-[22rem]') : 'max-w-none';
  return (
    <div className={`relative mx-auto w-full ${width}`}>
      <div>
        {video ? (
          <EventVideo
            title={story.title}
            videoFile={story.videoFile}
            facebookUrl={story.facebookUrl}
            poster={story.poster}
            portrait={story.portrait}
            playLabel={labels.playVideo}
            closeLabel={labels.closeVideo}
            previewClassName={shape}
          />
        ) : story.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={story.poster} alt="" className={`w-full object-cover ${shape}`} />
        ) : (
          <Opener story={story} accent={accent} />
        )}
      </div>
    </div>
  );
}

function Wave({ position }: { position: 'top' | 'bottom' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 h-8 w-full sm:h-12 lg:h-14 ${position === 'top' ? 'bottom-full translate-y-px' : 'top-full -translate-y-px'}`}
    >
      {position === 'top' ? (
        <path d="M0 30 C180 60 360 0 540 30 S900 60 1080 30 S1260 0 1440 30 V60 H0 Z" fill={NAVY} />
      ) : (
        <path d="M0 0 H1440 V30 C1260 60 1080 0 900 30 S540 60 360 30 S180 0 0 30 Z" fill={NAVY} />
      )}
    </svg>
  );
}

export default function EventsView({ data }: { data: EventsViewData }) {
  const { stories, labels } = data;
  const [lead, ...rest] = stories;
  const up = data.upcoming;

  return (
    <>
      <EventsHero
        data={{
          eyebrow: data.eyebrow,
          heading: data.heading,
          intro: data.intro,
          images: data.heroImages,
          galleryLabel: labels.galleryLabel,
          zoomLabel: labels.zoomPhoto,
        }}
      />

      <div className="relative overflow-hidden bg-surface">
        <DoodleBackdrop />

        {lead ? (
          <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-16 md:px-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-20 lg:px-16 lg:pt-20">
            <StoryText story={lead} accent={ACCENTS[0].accent} deep={ACCENTS[0].deep} labels={labels} large />
            <StoryMedia story={lead} accent={ACCENTS[0].accent} labels={labels} large />
          </section>
        ) : null}

        {up ? (
          <section className="relative my-10 py-20 text-white lg:py-28" style={{ backgroundColor: NAVY }}>
            <Wave position="top" />
            <Wave position="bottom" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-10 h-96 w-96 rounded-full bg-[#2ec4b6]/15 blur-[110px]" />
            <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:px-16">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#2ec4b6] px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#0b1a3a]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#0b1a3a] motion-reduce:animate-none" />
                  {up.eyebrow}
                </span>
                <h2 className="mt-5 font-display text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                  {withStars(up.title, (part, key) => (
                    <span key={key} className="text-[#2ec4b6]">
                      {part}
                    </span>
                  ))}
                </h2>
                {up.tagline ? <p className="mt-5 max-w-xl text-lg font-semibold text-white/90">{up.tagline}</p> : null}
                {up.paragraphs.map((p, i) => (
                  <p key={i} className="mt-4 max-w-xl leading-relaxed text-white/70">
                    {p}
                  </p>
                ))}
                {up.dateLabel ? <p className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-[#2ec4b6]">{up.dateLabel}</p> : null}
              </div>

              {/* Two pictures, one a little lower than the other */}
              <div className="mx-auto grid w-full max-w-xl grid-cols-2 gap-4 sm:gap-6">
                {up.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={up.image} alt={up.imageAlt} className={`w-full object-cover ${VIDEO_SHAPE}`} />
                ) : null}
                {hasVideo(up) ? (
                  <div className={up.image ? 'pt-10 sm:pt-14' : 'col-span-2 mx-auto max-w-xs'}>
                    <EventVideo
                      title={up.title.replace(/\*/g, '')}
                      videoFile={up.videoFile}
                      facebookUrl={up.facebookUrl}
                      poster={up.poster}
                      portrait={up.portrait}
                      playLabel={labels.playVideo}
                      closeLabel={labels.closeVideo}
                      previewClassName={VIDEO_SHAPE}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {rest.length > 0 ? (
          <div className="relative mx-auto max-w-7xl space-y-24 px-6 pb-28 pt-10 md:px-10 lg:space-y-32 lg:px-16">
            {rest.map((story, i) => {
              const { accent, deep } = ACCENTS[(i + 1) % ACCENTS.length];
              return (
                <section key={story.id} className="grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
                  <div className={i % 2 === 0 ? 'lg:order-2' : ''}>
                    <StoryMedia story={story} accent={accent} labels={labels} />
                  </div>
                  <div className={i % 2 === 0 ? 'lg:order-1' : ''}>
                    <StoryText story={story} accent={accent} deep={deep} labels={labels} />
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}
      </div>
    </>
  );
}

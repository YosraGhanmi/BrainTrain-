export type LocalizedString = { en: string; fr: string };

export type StatEntry = { value: number; label: LocalizedString };

export type ContactDetail = { value: string; href: string };

export type ContactContent = {
  email: ContactDetail;
  phone: ContactDetail;
  location: ContactDetail;
  mapsEmbedSrc: string;
};

export type TimelineEntry = {
  date: LocalizedString;
  title: LocalizedString;
  logo: boolean;
  summary: LocalizedString;
  facebookUrl?: string;
};

// One stage of a multi-phase program (e.g. "Year 1 — Discover & Control") — a
// short heading plus a handful of high-level bullet points, not a
// session-by-session breakdown. Optional: most courses are single-term and
// don't need a curriculum timeline on their detail page.
export type CurriculumPhase = {
  title: LocalizedString;
  points: LocalizedString[];
};

// One of the three labels floating around the robot on a course page
// ("Recognize"), with an icon name from HIGHLIGHT_ICON_NAMES
export type CourseHighlight = {
  icon: string;
  title: LocalizedString;
  text: LocalizedString;
};

export type CourseEntry = {
  slug: string;
  title: LocalizedString;
  icon: string;
  color: string;
  description: LocalizedString;
  sessions: number;
  price: number;
  ageGroupSlug: string;
  videoUrl?: string;
  image?: string;
  curriculum?: CurriculumPhase[];
  // Session length in hours; falls back to the standard class format's
  // when not set
  sessionHours?: number;
  // Course page content; empty values are hidden on the page.
  // tagline: line under the title, words wrapped in *stars* get highlighted
  // outcome: what the child can do by the end of the year
  // skills: checklist next to the outcome; tools: kits / software used
  tagline: LocalizedString;
  highlights: CourseHighlight[];
  outcome: LocalizedString;
  skills: LocalizedString[];
  tools: string[];
  // Summer school course: only offered while the summer school is open,
  // billed monthly or for the whole season instead of the school-year plans
  summer?: boolean;
};

// Summer school settings. Summer courses stay hidden everywhere (site and
// parent portal) until the admin opens it.
export type SummerSchoolSettings = {
  enabled: boolean;
  startDate: string; // ISO date, "YYYY-MM-DD"
  endDate: string;
  // Percent off for every child after a family's first enrolled child
  familyDiscountPercent: number;
  intro: LocalizedString;
  closingNote: LocalizedString;
};

export type AgeGroupEntry = {
  slug: string;
  label: LocalizedString;
  description: LocalizedString;
  icon: string;
  image: string;
  // Ages covered, used to place children automatically from their date of
  // birth. Read from the label ("6-9 years") when not set explicitly.
  minAge: number | null;
  maxAge: number | null;
  // Named stage shown above the label on public pages ("Little Explorers");
  // hidden when empty
  stage: LocalizedString;
};

// Standard class format shown on every course page (a course can override
// its own session length)
export type ClassFormat = {
  sessionHours: number;
  maxGroupSize: number;
};

export type SocialLink = { label: string; href: string };

// Admin-posted announcements shown on the parent-portal dashboard — plain
// text (not localized) since the portal itself isn't localized elsewhere.
// targetAgeGroups / targetCourses: empty array = no filter on that dimension
// (visible to everyone); non-empty = only children matching one of the
// listed ageGroupSlug / courseSlug values see the post.
export type NewsPost = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  targetAgeGroups: string[];
  targetCourses: string[];
};

// Admin-pinned calendar dates ("school closed", "trophy ceremony", ...) shown
// in every matching parent's schedule calendar alongside their child's
// course sessions. Same targeting convention as NewsPost: empty array = no
// filter on that dimension (visible to everyone); non-empty = only children
// matching one of the listed ageGroupSlug / courseSlug values see it.
export type CalendarEvent = {
  id: string;
  label: string;
  date: string; // ISO date, "YYYY-MM-DD"
  color: string;
  createdAt: string;
  targetAgeGroups: string[];
  targetCourses: string[];
};

// Full-screen video at the top of the home page. `poster` is the still shown
// until the video plays (and instead of it for reduced-motion visitors). The
// same file plays with sound in the "Watch the video" popup.
export type HeroVideo = { src: string; poster: string };

// Text over the hero video. In `headline`, each line break starts a new line
// and words wrapped in *stars* take the logo's colours, alternating blue/red.
export type HeroText = { headline: LocalizedString; lead: LocalizedString };

// The three cards in the home page's programmes section. Only the text is
// editable: each card's button always leads to the same place.
export const PROGRAM_KEYS = ['yearRound', 'summer', 'competitions'] as const;
export type ProgramKey = (typeof PROGRAM_KEYS)[number];
export type ProgramCard = { title: LocalizedString; body: LocalizedString };

export type SiteContent = {
  heroVideo: HeroVideo;
  heroText: HeroText;
  programs: Record<ProgramKey, ProgramCard>;
  sponsors: string[];
  stats: StatEntry[];
  achievementsImages: string[];
  timeline: TimelineEntry[];
  contact: ContactContent;
  socials: SocialLink[];
  courses: CourseEntry[];
  ageGroups: AgeGroupEntry[];
  news: NewsPost[];
  calendarEvents: CalendarEvent[];
  classFormat: ClassFormat;
  // Percent off for every child after a family's first enrolled child
  familyDiscountPercent: number;
  summerSchool: SummerSchoolSettings;
};

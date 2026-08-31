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
};

export type AgeGroupEntry = {
  slug: string;
  label: LocalizedString;
  description: LocalizedString;
  icon: string;
  image: string;
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

export type SiteContent = {
  sponsors: string[];
  stats: StatEntry[];
  achievementsImages: string[];
  timeline: TimelineEntry[];
  contact: ContactContent;
  socials: SocialLink[];
  courses: CourseEntry[];
  ageGroups: AgeGroupEntry[];
  news: NewsPost[];
};

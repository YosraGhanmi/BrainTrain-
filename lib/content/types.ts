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
};

export type AgeGroupEntry = {
  slug: string;
  label: LocalizedString;
  description: LocalizedString;
  icon: string;
  image: string;
};

export type SocialLink = { label: string; href: string };

export type SiteContent = {
  sponsors: string[];
  stats: StatEntry[];
  achievementsImages: string[];
  timeline: TimelineEntry[];
  contact: ContactContent;
  socials: SocialLink[];
  courses: CourseEntry[];
  ageGroups: AgeGroupEntry[];
};

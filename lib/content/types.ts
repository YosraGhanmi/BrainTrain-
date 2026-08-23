export type StatEntry = { value: number; label: string };

export type ContactDetail = { value: string; href: string };

export type ContactContent = {
  email: ContactDetail;
  phone: ContactDetail;
  location: ContactDetail;
  mapsEmbedSrc: string;
};

export type TimelineEntry = {
  date: string;
  title: string;
  logo: boolean;
  summary: string;
  detail: string;
  facebookUrl?: string;
};

export type CourseEntry = {
  slug: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  sessions: number;
  price: number;
  ageGroupSlug: string;
  videoUrl?: string;
  image?: string;
};

export type AgeGroupEntry = {
  slug: string;
  label: string;
  description: string;
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

export type LocalizedString = { en: string; fr: string };

export type StatEntry = { value: number; label: LocalizedString };

export type ContactDetail = { value: string; href: string };

export type PostalAddress = { street: string; city: string; postalCode: string; country: string };

// "HH:MM", 24-hour
export type DayHours = { opens: string; closes: string };

export type ContactContent = {
  email: ContactDetail;
  phone: ContactDetail;
  location: ContactDetail;
  // The address split into parts for Google's structured data (the shown
  // address is location.value). country: two-letter code, e.g. "TN"
  address: PostalAddress;
  // One entry per weekday, Monday first. Empty opens/closes = closed that day
  hours: DayHours[];
  mapsEmbedSrc: string;
  // The number the "Écrire sur WhatsApp" button opens, as typed (spaces and
  // a leading + are fine)
  whatsapp: string;
  // The home page's contact section: a two-line heading (the second line in
  // colour), an intro, a short checklist, then the card beside it
  heading: LocalizedString;
  headingAccent: LocalizedString;
  intro: LocalizedString;
  highlights: LocalizedString[];
  cardTitle: LocalizedString;
  cardText: LocalizedString;
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

// One of the three labels floating around the sprite on a course page
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
  // On the age group page's card: the label over the picture ("Emotions",
  // hidden when empty) and one short line (the description when empty)
  category: LocalizedString;
  summary: LocalizedString;
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
  // Search engine <title> and meta description of the course page; empty
  // falls back to "<title> | BrainTrain" and the description
  seoTitle: LocalizedString;
  seoDescription: LocalizedString;
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

// The Palmarès page (/palmares). Lists with an empty title are dropped on
// save; a competition only shows once it has at least one award line.
export type PalmaresCompetition = {
  title: LocalizedString;
  intro: LocalizedString;
  // One line each, "1re place – Prix". A line without " – " is a note
  // (e.g. a qualification) and shows without a medal.
  awards: LocalizedString[];
  image: string;
  imageAlt: LocalizedString;
};

export type PalmaresVideo = {
  title: LocalizedString;
  // Optional short highlight, e.g. "475 points sur 545"
  highlight: LocalizedString;
  description: LocalizedString;
  url: string;
  image: string;
};

// badge: the coloured label on the picture ("Interview"). image: shown at
// the top of the card. logo: the image is a logo, shown whole on white
// instead of filling the space
export type PalmaresMediaItem = {
  name: LocalizedString;
  badge: LocalizedString;
  description: LocalizedString;
  url: string;
  image: string;
  logo: boolean;
};

export type PalmaresPhoto = { src: string; alt: LocalizedString };

// How many photos the hero's "1re" can cycle through
export const PALMARES_HERO_PHOTO_SLOTS = 4;

export type PalmaresContent = {
  seoTitle: LocalizedString;
  seoDescription: LocalizedString;
  // heading: words in *stars* show in gold
  heading: LocalizedString;
  intro: LocalizedString;
  // The hero's big "1re": the photos that take turns inside the letters (the
  // first one alone for reduced-motion visitors) and the caption under it
  // ("3 x 1re place", then a line or two; line breaks are kept)
  heroPhotos: string[];
  heroCaptionTitle: LocalizedString;
  heroCaptionText: LocalizedString;
  // Beside the competitions timeline. awardsHeading: words in *stars* show
  // in colour
  awardsEyebrow: LocalizedString;
  awardsHeading: LocalizedString;
  awardsIntro: LocalizedString;
  competitions: PalmaresCompetition[];
  videosHeading: LocalizedString;
  videos: PalmaresVideo[];
  mediaHeading: LocalizedString;
  mediaIntro: LocalizedString;
  media: PalmaresMediaItem[];
  statsHeading: LocalizedString;
  stats: { value: number; label: LocalizedString }[];
  photos: PalmaresPhoto[];
};

// The Events page (/events), laid out like a journal: one story per event.
// A story's video plays from `videoFile` (our own player) when one is
// uploaded, otherwise from the Facebook video at `facebookUrl`; with neither,
// the story shows `poster` or a typographic panel. Stories without a title are
// dropped on save.
export type EventEntry = {
  id: string;
  // Small line above the title, e.g. "Inspire Talks · Édition 2"
  kicker: LocalizedString;
  title: LocalizedString;
  date: LocalizedString;
  // The line under the title
  standfirst: LocalizedString;
  // Paragraphs separated by a blank line
  body: LocalizedString;
  // One per line, "Name | Role" (the role is optional)
  speakers: LocalizedString[];
  // Full facebook.com/reel/... or facebook.com/<page>/videos/... address
  facebookUrl: string;
  videoFile: string;
  poster: string;
  // Reels are tall; a landscape video gets a wide frame instead
  portrait: boolean;
  // The Facebook post, for the "see the post" link
  postUrl: string;
};

// The "coming soon" block: the next competition
export type EventsUpcoming = {
  eyebrow: LocalizedString;
  // Words in *stars* are highlighted
  title: LocalizedString;
  tagline: LocalizedString;
  text: LocalizedString;
  // e.g. "2026 - 2027"
  dateLabel: LocalizedString;
  image: string;
  imageAlt: LocalizedString;
  facebookUrl: string;
  videoFile: string;
  poster: string;
  portrait: boolean;
};

export type EventsContent = {
  seoTitle: LocalizedString;
  seoDescription: LocalizedString;
  mastheadTitle: LocalizedString;
  mastheadTagline: LocalizedString;
  intro: LocalizedString;
  // The photos floating across the top of the page, in this order
  heroImages: string[];
  upcoming: EventsUpcoming;
  events: EventEntry[];
};

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

// The four cards in the home page's programmes section. Only the text and
// photo are editable: each card's button always leads to the same place.
export const PROGRAM_KEYS = ['yearRound', 'summer', 'competitions', 'events'] as const;
export type ProgramKey = (typeof PROGRAM_KEYS)[number];
export type ProgramCard = {
  title: LocalizedString;
  subtitle: LocalizedString;
  body: LocalizedString;
  // The pill over the photo, e.g. "De 4 à 18 ans"
  badge: LocalizedString;
  // The small caps line under the divider and what follows it
  detailsLabel: LocalizedString;
  details: LocalizedString;
  image: string;
};

// The home page's "Notre méthode" section: a heading, a line under it (words
// wrapped in *stars* are highlighted) and four cards. Fixed at four:
// the grid is laid out for four across.
export const METHOD_STEP_COUNT = 4;
export type MethodStep = { title: LocalizedString; body: LocalizedString };
// The heading and paragraph above the milestones timeline on the home page
export type TimelineIntro = { heading: LocalizedString; intro: LocalizedString };

export type MethodContent = { heading: LocalizedString; intro: LocalizedString; steps: MethodStep[] };

// The Courses page (/courses) tells a story before the age group picker:
// the problem, BrainTrain's answer, the path from 4 to 18 (one step per age
// group, from the age groups and their courses), the vision, then the picker.
// In headings, words wrapped in *stars* are highlighted. A point with an
// empty title is hidden.
export const COURSES_STORY_PROBLEM_COUNT = 3;
export const COURSES_STORY_ANSWER_COUNT = 4;
export const COURSES_STORY_VISION_COUNT = 3;
export type CoursesStoryPoint = { title: LocalizedString; body: LocalizedString };
export type CoursesStoryContent = {
  eyebrow: LocalizedString;
  heading: LocalizedString;
  intro: LocalizedString;
  problemEyebrow: LocalizedString;
  problemHeading: LocalizedString;
  problemIntro: LocalizedString;
  problems: CoursesStoryPoint[];
  answerEyebrow: LocalizedString;
  answerHeading: LocalizedString;
  answerIntro: LocalizedString;
  answers: CoursesStoryPoint[];
  pathEyebrow: LocalizedString;
  pathHeading: LocalizedString;
  pathIntro: LocalizedString;
  // Each step's text for parents, by age group slug; an empty one falls back
  // to the age group's description
  pathPitches: Record<string, LocalizedString>;
  visionEyebrow: LocalizedString;
  // The big statement; line breaks are kept
  visionHeading: LocalizedString;
  visions: CoursesStoryPoint[];
  pickHeading: LocalizedString;
  pickIntro: LocalizedString;
};
// Every single-text field of the story, for the admin form and the reader
export const COURSES_STORY_TEXT_KEYS = [
  'eyebrow',
  'heading',
  'intro',
  'problemEyebrow',
  'problemHeading',
  'problemIntro',
  'answerEyebrow',
  'answerHeading',
  'answerIntro',
  'pathEyebrow',
  'pathHeading',
  'pathIntro',
  'visionEyebrow',
  'visionHeading',
  'pickHeading',
  'pickIntro',
] as const satisfies readonly (keyof CoursesStoryContent)[];
export type CoursesStoryTextKey = (typeof COURSES_STORY_TEXT_KEYS)[number];

// The "À propos" page: a flip gallery of photos beside the academy's story.
// In the heading and the story, words wrapped in *stars* are highlighted;
// the story's paragraphs are separated by a blank line. Two key facts sit
// under it, beside the "Inscrire votre enfant" button.
export type AboutFact = { value: LocalizedString; label: LocalizedString };
export type AboutContent = {
  // In flip order; never empty
  images: string[];
  // The small line above the heading, e.g. "Sousse, octobre 2023"
  eyebrow: LocalizedString;
  heading: LocalizedString;
  story: LocalizedString;
  // The last line, set larger, e.g. "Et ce n'est que le début."
  closing: LocalizedString;
  facts: AboutFact[];
};

// The questions under the contact section on the home page. The heading's
// second line shows in colour. A question can show the pre-registration
// button under its answer; line breaks in an answer are kept.
export type FaqItem = {
  question: LocalizedString;
  answer: LocalizedString;
  showPreinscriptionButton: boolean;
};
export type FaqContent = { heading: LocalizedString; headingAccent: LocalizedString; items: FaqItem[] };

export type SiteContent = {
  heroVideo: HeroVideo;
  heroText: HeroText;
  programs: Record<ProgramKey, ProgramCard>;
  method: MethodContent;
  coursesStory: CoursesStoryContent;
  about: AboutContent;
  // The line under the logo in the footer
  footer: { tagline: LocalizedString };
  // Google Analytics 4 measurement ID ("G-XXXXXXXXXX"); empty = no tracking
  analytics: { gaMeasurementId: string };
  sponsors: string[];
  stats: StatEntry[];
  achievementsImages: string[];
  timeline: TimelineEntry[];
  timelineIntro: TimelineIntro;
  contact: ContactContent;
  faq: FaqContent;
  socials: SocialLink[];
  palmares: PalmaresContent;
  events: EventsContent;
  courses: CourseEntry[];
  ageGroups: AgeGroupEntry[];
  news: NewsPost[];
  calendarEvents: CalendarEvent[];
  classFormat: ClassFormat;
  // Percent off for every child after a family's first enrolled child
  familyDiscountPercent: number;
  summerSchool: SummerSchoolSettings;
};

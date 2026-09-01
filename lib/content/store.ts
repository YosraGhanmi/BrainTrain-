import fs from 'fs';
import path from 'path';
import type { SiteContent, LocalizedString, StatEntry, TimelineEntry, CourseEntry, AgeGroupEntry, NewsPost } from './types';

// Everything the admin dashboard edits lives in one JSON file on disk. This
// only works because the app runs on a traditional Node server with a
// persistent filesystem — a serverless host would need a real database
// instead, since its filesystem is read-only / ephemeral per invocation.
const CONTENT_PATH = path.join(process.cwd(), 'data', 'content.json');

const DEFAULT_CONTENT: SiteContent = {
  sponsors: [
    '/partners/American corner.png',
    '/partners/Ecole Internationale Francaise.jpg',
    '/partners/amideast.png',
    '/partners/arsii.jpg',
    '/partners/asediact.jpg',
    '/partners/class quiz.jpg',
    '/partners/jci.jpg',
    '/partners/ministere.png',
    '/partners/novation city.jpg',
    '/partners/robotna.jpg',
  ],
  stats: [
    { value: 7, label: { en: 'Courses', fr: 'Cours' } },
    { value: 1500, label: { en: 'Students', fr: 'Étudiants' } },
    { value: 19, label: { en: 'Trophies', fr: 'Trophées' } },
  ],
  achievementsImages: [
    '/ach/ALL.jpg',
    '/ach/h.jpg',
    '/ach/hh.jpg',
    '/ach/j.jpg',
    '/ach/jk.jpg',
    '/ach/ml.jpg',
    '/ach/oman.jpg',
    '/ach/t.jpg',
    '/ach/w.jpg',
    '/ach/win.jpg',
    '/ach/winnn.jpg',
    '/ach/ww.png',
  ],
  timeline: [
    {
      date: { en: 'October 2023', fr: 'Octobre 2023' },
      title: { en: 'BrainTrain is Founded', fr: 'Fondation de BrainTrain' },
      logo: true,
      summary: {
        en: 'A Tunisian academy opens its doors with one idea: let kids learn by building.',
        fr: 'Une académie tunisienne ouvre ses portes avec une idée : laisser les enfants apprendre en construisant.',
      },
    },
    {
      date: { en: '2025', fr: '2025' },
      title: { en: 'FIRST® LEGO® League World Competition', fr: 'Compétition mondiale FIRST® LEGO® League' },
      logo: false,
      summary: {
        en: 'Barely two years in, BrainTrain students take the international stage.',
        fr: "À peine deux ans après sa création, les élèves de BrainTrain montent sur la scène internationale.",
      },
    },
    {
      date: { en: 'December 2025', fr: 'Décembre 2025' },
      title: { en: 'Arab Championship: 3 Prizes', fr: 'Championnat arabe : 3 prix' },
      logo: false,
      summary: {
        en: 'The season closes with three wins at the Arab level.',
        fr: 'La saison se termine avec trois victoires au niveau arabe.',
      },
    },
  ],
  contact: {
    email: { value: 'contact@braintrain.tn', href: 'mailto:contact@braintrain.tn' },
    phone: { value: '58 996 112', href: 'tel:+21658996112' },
    location: {
      value: 'Rue Gp1, Khzema Ouest, Sousse, Tunisia, 4071',
      href: 'https://www.google.com/maps/place/Braintrain+Academy/@35.8441536,10.6122719,17z/data=!3m1!4b1!4m6!3m5!1s0x12fd8b0074c0577b:0x4e986dd851ffe308!8m2!3d35.8441493!4d10.6148468!16s%2Fg%2F11vzg1d9bv?entry=tts&g_ep=EgoyMDI0MDkxOC4xKgBIAVAD',
    },
    mapsEmbedSrc: 'https://www.google.com/maps?q=35.8441493,10.6148468&z=17&output=embed',
  },
  socials: [
    { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61556624844766' },
    { label: 'Instagram', href: 'https://www.instagram.com/braintrain.tn/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/braintrainacademy/' },
  ],
  courses: [
    {
      slug: 'robotique-6-9',
      title: { en: 'Robotique', fr: 'Robotique' },
      icon: 'Bot',
      color: '#f7b500',
      description: {
        en: 'Build, wire and program real robots from scratch. Kids design circuits, assemble chassis, and bring their creations to life through hands-on robotics challenges.',
        fr: 'Construire, câbler et programmer de vrais robots de A à Z. Les enfants conçoivent des circuits, assemblent des châssis et donnent vie à leurs créations à travers des défis de robotique pratiques.',
      },
      sessions: 12,
      price: 0,
      ageGroupSlug: '6-9',
    },
    {
      slug: 'robotique-10-13',
      title: { en: 'Robotique', fr: 'Robotique' },
      icon: 'Bot',
      color: '#f7b500',
      description: {
        en: 'Build, wire and program real robots from scratch. Kids design circuits, assemble chassis, and bring their creations to life through hands-on robotics challenges.',
        fr: 'Construire, câbler et programmer de vrais robots de A à Z. Les enfants conçoivent des circuits, assemblent des châssis et donnent vie à leurs créations à travers des défis de robotique pratiques.',
      },
      sessions: 12,
      price: 0,
      ageGroupSlug: '10-13',
    },
    {
      slug: 'robotique-14-18',
      title: { en: 'Robotique', fr: 'Robotique' },
      icon: 'Bot',
      color: '#f7b500',
      description: {
        en: 'Build, wire and program real robots from scratch. Kids design circuits, assemble chassis, and bring their creations to life through hands-on robotics challenges.',
        fr: 'Construire, câbler et programmer de vrais robots de A à Z. Les enfants conçoivent des circuits, assemblent des châssis et donnent vie à leurs créations à travers des défis de robotique pratiques.',
      },
      sessions: 12,
      price: 0,
      ageGroupSlug: '14-18',
    },
    {
      slug: 'programmation-6-9',
      title: { en: 'Programmation', fr: 'Programmation' },
      icon: 'Code2',
      color: '#3d7fff',
      description: {
        en: 'Learn to code through games and interactive projects. Students write real programs, debug logic, and build the problem-solving mindset behind every app they use.',
        fr: 'Apprendre à coder à travers des jeux et des projets interactifs. Les élèves écrivent de vrais programmes, débogent leur logique et développent la mentalité de résolution de problèmes derrière chaque application qu\'ils utilisent.',
      },
      sessions: 10,
      price: 0,
      ageGroupSlug: '6-9',
    },
    {
      slug: 'programmation-10-13',
      title: { en: 'Programmation', fr: 'Programmation' },
      icon: 'Code2',
      color: '#3d7fff',
      description: {
        en: 'Learn to code through games and interactive projects. Students write real programs, debug logic, and build the problem-solving mindset behind every app they use.',
        fr: 'Apprendre à coder à travers des jeux et des projets interactifs. Les élèves écrivent de vrais programmes, débogent leur logique et développent la mentalité de résolution de problèmes derrière chaque application qu\'ils utilisent.',
      },
      sessions: 10,
      price: 0,
      ageGroupSlug: '10-13',
    },
    {
      slug: 'entrepreneuriat-6-9',
      title: { en: 'Entrepreneuriat', fr: 'Entrepreneuriat' },
      icon: 'Rocket',
      color: '#ff5a5f',
      description: {
        en: 'Turn ideas into real ventures. Kids learn to spot opportunities, pitch a concept, and plan a mini business from the ground up.',
        fr: 'Transformer des idées en véritables projets. Les enfants apprennent à repérer des opportunités, présenter un concept et planifier une mini-entreprise de A à Z.',
      },
      sessions: 8,
      price: 0,
      ageGroupSlug: '6-9',
    },
    {
      slug: 'entrepreneuriat-10-13',
      title: { en: 'Entrepreneuriat', fr: 'Entrepreneuriat' },
      icon: 'Rocket',
      color: '#ff5a5f',
      description: {
        en: 'Turn ideas into real ventures. Kids learn to spot opportunities, pitch a concept, and plan a mini business from the ground up.',
        fr: 'Transformer des idées en véritables projets. Les enfants apprennent à repérer des opportunités, présenter un concept et planifier une mini-entreprise de A à Z.',
      },
      sessions: 8,
      price: 0,
      ageGroupSlug: '10-13',
    },
    {
      slug: 'entrepreneuriat-14-18',
      title: { en: 'Entrepreneuriat', fr: 'Entrepreneuriat' },
      icon: 'Rocket',
      color: '#ff5a5f',
      description: {
        en: 'Turn ideas into real ventures. Kids learn to spot opportunities, pitch a concept, and plan a mini business from the ground up.',
        fr: 'Transformer des idées en véritables projets. Les enfants apprennent à repérer des opportunités, présenter un concept et planifier une mini-entreprise de A à Z.',
      },
      sessions: 8,
      price: 0,
      ageGroupSlug: '14-18',
    },
    {
      slug: 'jeu-intelligence-emotionnelle-4-5',
      title: { en: "Jeu d'intelligence émotionnelle", fr: "Jeu d'intelligence émotionnelle" },
      icon: 'Smile',
      color: '#6c5ce7',
      description: {
        en: 'A playful introduction to feelings and social skills, helping young children recognize, name and manage their emotions through games.',
        fr: "Une introduction ludique aux émotions et aux compétences sociales, aidant les jeunes enfants à reconnaître, nommer et gérer leurs émotions à travers des jeux.",
      },
      sessions: 6,
      price: 0,
      ageGroupSlug: '4-5',
    },
    {
      slug: 'jeu-intelligence-emotionnelle-6-9',
      title: { en: "Jeu d'intelligence émotionnelle", fr: "Jeu d'intelligence émotionnelle" },
      icon: 'Smile',
      color: '#6c5ce7',
      description: {
        en: 'A playful introduction to feelings and social skills, helping young children recognize, name and manage their emotions through games.',
        fr: "Une introduction ludique aux émotions et aux compétences sociales, aidant les jeunes enfants à reconnaître, nommer et gérer leurs émotions à travers des jeux.",
      },
      sessions: 6,
      price: 0,
      ageGroupSlug: '6-9',
    },
    {
      slug: 'electronique-10-13',
      title: { en: 'Électronique', fr: 'Électronique' },
      icon: 'CircuitBoard',
      color: '#00b894',
      description: {
        en: 'Hands-on exploration of circuits, sensors and components. Students learn how electricity powers the devices around them by building their own working circuits.',
        fr: 'Exploration pratique des circuits, capteurs et composants. Les élèves apprennent comment l\'électricité alimente les appareils qui les entourent en construisant leurs propres circuits fonctionnels.',
      },
      sessions: 10,
      price: 0,
      ageGroupSlug: '10-13',
    },
    {
      slug: 'impression-design-3d-10-13',
      title: { en: 'Impression et design 3D', fr: 'Impression et design 3D' },
      icon: 'Printer',
      color: '#ff8c42',
      description: {
        en: 'From sketch to physical object. Kids learn 3D modeling basics and watch their designs come to life on a 3D printer.',
        fr: "Du croquis à l'objet physique. Les enfants apprennent les bases de la modélisation 3D et voient leurs créations prendre vie sur une imprimante 3D.",
      },
      sessions: 8,
      price: 0,
      ageGroupSlug: '10-13',
    },
    {
      slug: 'python-14-18',
      title: { en: 'Python', fr: 'Python' },
      icon: 'Terminal',
      color: '#0b8793',
      description: {
        en: 'A deeper dive into real-world programming with Python: scripting, logic and small projects that prepare teens for serious coding.',
        fr: "Une immersion plus poussée dans la programmation réelle avec Python : scripts, logique et petits projets qui préparent les adolescents à coder sérieusement.",
      },
      sessions: 12,
      price: 0,
      ageGroupSlug: '14-18',
    },
  ],
  ageGroups: [
    {
      slug: '4-5',
      label: { en: '4-5 years', fr: '4-5 ans' },
      description: {
        en: 'First steps into discovery, playing with emotions and simple ideas in a fun, guided way.',
        fr: 'Premiers pas vers la découverte, en jouant avec les émotions et des idées simples de façon ludique et encadrée.',
      },
      icon: 'Baby',
      image: '/age/4-5.jpg',
    },
    {
      slug: '6-9',
      label: { en: '6-9 years', fr: '6-9 ans' },
      description: {
        en: 'Robotics, coding and entrepreneurship basics introduced through hands-on, playful projects.',
        fr: "Bases de robotique, de programmation et d'entrepreneuriat introduites à travers des projets pratiques et ludiques.",
      },
      icon: 'Puzzle',
      image: '/age/6-9.jpg',
    },
    {
      slug: '10-13',
      label: { en: '10-13 years', fr: '10-13 ans' },
      description: {
        en: 'Deeper dives into electronics, 3D design and programming to build real, working projects.',
        fr: "Approfondissement de l'électronique, du design 3D et de la programmation pour construire de vrais projets fonctionnels.",
      },
      icon: 'Cpu',
      image: '/age/10-13.png',
    },
    {
      slug: '14-18',
      label: { en: '14-18 years', fr: '14-18 ans' },
      description: {
        en: 'Advanced Python, robotics and entrepreneurship to prepare teens for real-world challenges.',
        fr: "Python avancé, robotique et entrepreneuriat pour préparer les adolescents aux défis du monde réel.",
      },
      icon: 'GraduationCap',
      image: '/age/14-18.png',
    },
  ],
  news: [],
};

// `data/content.json` may still hold plain strings for fields that used to be
// English-only, from before French support existed — normalize those into
// { en, fr } on read (using the English text as a placeholder French value
// until an admin translates it) instead of crashing or silently dropping data.
function toLocalized(value: unknown, fallback: LocalizedString): LocalizedString {
  if (typeof value === 'string') return { en: value, fr: value };
  if (value && typeof value === 'object' && 'en' in value) {
    const v = value as Partial<LocalizedString>;
    return { en: v.en ?? fallback.en, fr: v.fr || v.en || fallback.fr };
  }
  return fallback;
}

function normalize(raw: Partial<SiteContent>): SiteContent {
  const merged = { ...DEFAULT_CONTENT, ...raw };

  const stats: StatEntry[] = (raw.stats ?? DEFAULT_CONTENT.stats).map((s: any) => ({
    value: s.value,
    label: toLocalized(s.label, { en: '', fr: '' }),
  }));

  const timeline: TimelineEntry[] = (raw.timeline ?? DEFAULT_CONTENT.timeline).map((t: any) => ({
    date: toLocalized(t.date, { en: '', fr: '' }),
    title: toLocalized(t.title, { en: '', fr: '' }),
    logo: Boolean(t.logo),
    summary: toLocalized(t.summary, { en: '', fr: '' }),
    facebookUrl: t.facebookUrl || undefined,
  }));

  const courses: CourseEntry[] = (raw.courses ?? DEFAULT_CONTENT.courses).map((c: any) => ({
    ...c,
    title: toLocalized(c.title, { en: '', fr: '' }),
    description: toLocalized(c.description, { en: '', fr: '' }),
  }));

  const ageGroups: AgeGroupEntry[] = (raw.ageGroups ?? DEFAULT_CONTENT.ageGroups).map((g: any) => ({
    ...g,
    label: toLocalized(g.label, { en: '', fr: '' }),
    description: toLocalized(g.description, { en: '', fr: '' }),
  }));

  const news: NewsPost[] = (raw.news ?? DEFAULT_CONTENT.news).map((n: any) => ({
    ...n,
    targetAgeGroups: Array.isArray(n.targetAgeGroups) ? n.targetAgeGroups : [],
    targetCourses: Array.isArray(n.targetCourses) ? n.targetCourses : [],
  }));

  return { ...merged, stats, timeline, courses, ageGroups, news };
}

function ensureFile(): void {
  const dir = path.dirname(CONTENT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(CONTENT_PATH)) {
    fs.writeFileSync(CONTENT_PATH, JSON.stringify(DEFAULT_CONTENT, null, 2), 'utf-8');
  }
}

export function readContent(): SiteContent {
  ensureFile();
  const raw = fs.readFileSync(CONTENT_PATH, 'utf-8');
  // Merge over defaults so a partially-edited file (or a field added in a
  // later version of this file) never crashes a render with `undefined`.
  return normalize(JSON.parse(raw));
}

export function writeContent(content: SiteContent): void {
  ensureFile();
  fs.writeFileSync(CONTENT_PATH, JSON.stringify(content, null, 2), 'utf-8');
}

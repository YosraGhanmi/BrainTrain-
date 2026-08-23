import fs from 'fs';
import path from 'path';
import type { SiteContent } from './types';

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
    { value: 7, label: 'Courses' },
    { value: 1500, label: 'Students' },
    { value: 19, label: 'Trophies' },
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
      date: 'October 2023',
      title: 'BrainTrain is Founded',
      logo: true,
      summary: 'A Tunisian academy opens its doors with one idea: let kids learn by building.',
      detail:
        'BrainTrain launches in Tunisia as a multidisciplinary academy for young minds, built around robotics, programming, AI, 3D design and entrepreneurship, learned hands-on rather than from a textbook.',
    },
    {
      date: '2025',
      title: 'FIRST® LEGO® League World Competition',
      logo: false,
      summary: 'Barely two years in, BrainTrain students take the international stage.',
      detail:
        'BrainTrain proudly represents Tunisia at the FIRST® LEGO® League 2025 world competition, putting robots and ideas built in Tunisian classrooms up against teams from around the globe.',
    },
    {
      date: 'December 2025',
      title: 'Arab Championship — 3 Prizes',
      logo: false,
      summary: 'The season closes with three wins at the Arab level.',
      detail:
        'At the Arab competition in December 2025, BrainTrain students win 3 prizes at the Arab level, adding another chapter to a young academy already competing far beyond its size.',
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
      slug: 'robotique',
      title: 'Robotique',
      icon: 'Bot',
      color: '#f7b500',
      description:
        'Build, wire and program real robots from scratch. Kids design circuits, assemble chassis, and bring their creations to life through hands-on robotics challenges.',
      sessions: 12,
    },
    {
      slug: 'programmation',
      title: 'Programmation',
      icon: 'Code2',
      color: '#3d7fff',
      description:
        'Learn to code through games and interactive projects. Students write real programs, debug logic, and build the problem-solving mindset behind every app they use.',
      sessions: 10,
    },
    {
      slug: 'entrepreneuriat',
      title: 'Entrepreneuriat',
      icon: 'Rocket',
      color: '#ff5a5f',
      description:
        'Turn ideas into real ventures. Kids learn to spot opportunities, pitch a concept, and plan a mini business from the ground up.',
      sessions: 8,
    },
    {
      slug: 'jeu-intelligence-emotionnelle',
      title: "Jeu d'intelligence émotionnelle",
      icon: 'Smile',
      color: '#6c5ce7',
      description:
        'A playful introduction to feelings and social skills, helping young children recognize, name and manage their emotions through games.',
      sessions: 6,
    },
    {
      slug: 'electronique',
      title: 'Électronique',
      icon: 'CircuitBoard',
      color: '#00b894',
      description:
        'Hands-on exploration of circuits, sensors and components. Students learn how electricity powers the devices around them by building their own working circuits.',
      sessions: 10,
    },
    {
      slug: 'impression-design-3d',
      title: 'Impression et design 3D',
      icon: 'Printer',
      color: '#ff8c42',
      description: 'From sketch to physical object. Kids learn 3D modeling basics and watch their designs come to life on a 3D printer.',
      sessions: 8,
    },
    {
      slug: 'python',
      title: 'Python',
      icon: 'Terminal',
      color: '#0b8793',
      description:
        'A deeper dive into real-world programming with Python — scripting, logic and small projects that prepare teens for serious coding.',
      sessions: 12,
    },
  ],
  ageGroups: [
    {
      slug: '4-5',
      label: '4-5 years',
      description: 'First steps into discovery, playing with emotions and simple ideas in a fun, guided way.',
      icon: 'Baby',
      image: '/age/4-5.jpg',
      courseTitles: ["Jeu d'intelligence émotionnelle"],
    },
    {
      slug: '6-9',
      label: '6-9 years',
      description: 'Robotics, coding and entrepreneurship basics introduced through hands-on, playful projects.',
      icon: 'Puzzle',
      image: '/age/6-9.jpg',
      courseTitles: ['Robotique', 'Programmation', 'Entrepreneuriat', "Jeu d'intelligence émotionnelle"],
    },
    {
      slug: '10-13',
      label: '10-13 years',
      description: 'Deeper dives into electronics, 3D design and programming to build real, working projects.',
      icon: 'Cpu',
      image: '/age/10-13.png',
      courseTitles: ['Robotique', 'Entrepreneuriat', 'Programmation', 'Électronique', 'Impression et design 3D'],
    },
    {
      slug: '14-18',
      label: '14-18 years',
      description: 'Advanced Python, robotics and entrepreneurship to prepare teens for real-world challenges.',
      icon: 'GraduationCap',
      image: '/age/14-18.png',
      courseTitles: ['Python', 'Robotique', 'Entrepreneuriat'],
    },
  ],
};

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
  return { ...DEFAULT_CONTENT, ...JSON.parse(raw) } as SiteContent;
}

export function writeContent(content: SiteContent): void {
  ensureFile();
  fs.writeFileSync(CONTENT_PATH, JSON.stringify(content, null, 2), 'utf-8');
}

import type { LocalizedString } from './types';

// The summer programme sheet (Programme d'été) the school hands out, as the
// starting point the admin can load in one click and then edit freely.
// Days: 0 = Sunday … 6 = Saturday. The sheet's "13" row is read as 11:00–13:00
// and "2* GRP" as two classes running side by side (two groups).

export type SheetGroup = { label: string; days: number[]; startTime: string; endTime: string; capacity?: number };

export type SheetCourse = {
  key: string;
  title: LocalizedString;
  description: LocalizedString;
  icon: string;
  color: string;
  sessions: number;
  sessionHours: number;
  monthly: number;
  season: number;
  groups: SheetGroup[];
};

// Age groups are matched by an age they cover, so this survives renamed slugs
export type SheetAgeGroup = { sampleAge: number; courses: SheetCourse[] };

const MON_WED = [1, 3];

const TWICE_A_WEEK = {
  key: 'twice-a-week',
  title: { en: 'Summer School: twice a week', fr: "École d'été : deux fois par semaine" },
  description: {
    en: 'Two 2-hour sessions a week, Monday and Wednesday: build, program and present a project by the end of the summer.',
    fr: "Deux séances de 2 heures par semaine, lundi et mercredi : construire, programmer et présenter un projet à la fin de l'été.",
  },
  icon: 'Bot',
  color: '#3d7fff',
  sessions: 22,
  sessionHours: 2,
  monthly: 190,
  season: 440,
};

const FULL_MORNING = {
  key: 'full-morning',
  title: { en: 'Summer School: one full morning a week', fr: "École d'été : une matinée complète par semaine" },
  description: {
    en: 'One 4-hour morning a week: hands-on building and programming, teamwork and a final project.',
    fr: "Une matinée de 4 heures par semaine : construction et programmation, travail d'équipe et projet final.",
  },
  icon: 'Cpu',
  color: '#8b5cf6',
  sessions: 11,
  sessionHours: 4,
  monthly: 210,
  season: 490,
};

export const SUMMER_SHEET: SheetAgeGroup[] = [
  {
    sampleAge: 7,
    courses: [
      {
        ...TWICE_A_WEEK,
        groups: [
          { label: 'GRP1 A', days: MON_WED, startTime: '09:00', endTime: '11:00' },
          { label: 'GRP1 B', days: MON_WED, startTime: '09:00', endTime: '11:00' },
          { label: 'GRP2', days: MON_WED, startTime: '11:00', endTime: '13:00' },
          { label: 'GRP5', days: MON_WED, startTime: '14:00', endTime: '16:00' },
        ],
      },
      {
        ...FULL_MORNING,
        groups: [
          { label: 'GRP3 A', days: [2], startTime: '09:00', endTime: '13:00' },
          { label: 'GRP3 B', days: [2], startTime: '09:00', endTime: '13:00' },
          { label: 'GRP4', days: [4], startTime: '09:00', endTime: '13:00' },
        ],
      },
      {
        key: 'saturday-club',
        title: { en: 'Summer School: Saturday club', fr: "École d'été : club du samedi" },
        description: {
          en: 'One 2-hour session every Saturday, for children who want to keep learning through the summer.',
          fr: "Une séance de 2 heures chaque samedi, pour les enfants qui veulent continuer à apprendre pendant l'été.",
        },
        icon: 'Puzzle',
        color: '#f59e0b',
        sessions: 11,
        sessionHours: 2,
        monthly: 110,
        season: 240,
        groups: [{ label: 'GRP6', days: [6], startTime: '11:00', endTime: '13:00' }],
      },
      {
        key: 'entrepreneurship',
        title: { en: 'Summer Entrepreneurship', fr: "Entrepreneuriat d'été" },
        description: {
          en: 'Every Friday: turn an idea into a project, work as a team and pitch it with confidence.',
          fr: "Chaque vendredi : transformer une idée en projet, travailler en équipe et la présenter avec assurance.",
        },
        icon: 'Rocket',
        color: '#10b981',
        sessions: 11,
        sessionHours: 2,
        monthly: 100,
        season: 230,
        groups: [
          { label: 'ENTREPRENEURIAT A', days: [5], startTime: '09:00', endTime: '11:00' },
          { label: 'ENTREPRENEURIAT B', days: [5], startTime: '11:00', endTime: '13:00' },
        ],
      },
    ],
  },
  {
    sampleAge: 11,
    courses: [
      {
        ...TWICE_A_WEEK,
        groups: [
          { label: 'GRP1', days: MON_WED, startTime: '09:00', endTime: '11:00' },
          { label: 'GRP2', days: MON_WED, startTime: '11:00', endTime: '13:00' },
        ],
      },
      {
        ...FULL_MORNING,
        groups: [{ label: 'GRP3', days: [2], startTime: '09:00', endTime: '13:00' }],
      },
      {
        key: 'challenge-bootcamp',
        title: { en: 'The Challenge Summer Bootcamp', fr: 'The Challenge Summer Bootcamp' },
        description: {
          en: 'An intensive bootcamp every Thursday and Friday morning. Only 30 selected children.',
          fr: 'Un bootcamp intensif chaque jeudi et vendredi matin. Seulement 30 enfants sélectionnés.',
        },
        icon: 'Trophy',
        color: '#ef4444',
        sessions: 22,
        sessionHours: 4,
        monthly: 350,
        season: 840,
        groups: [{ label: 'BOOTCAMP', days: [4, 5], startTime: '09:00', endTime: '13:00', capacity: 30 }],
      },
    ],
  },
];

// Shared by every sheet course's page: what the summer is for, from the sheet
export const SHEET_OUTCOME: LocalizedString = {
  en: 'Each child completes a project and presents it confidently in front of their parents.',
  fr: 'Chaque enfant réalise un projet et le présente avec assurance devant ses parents.',
};

export const SHEET_SKILLS: LocalizedString[] = [
  { en: 'Build and program', fr: 'Construire et programmer' },
  { en: 'Solve problems', fr: 'Résoudre des problèmes' },
  { en: 'Work in teams', fr: 'Travailler en équipe' },
  { en: 'Communicate ideas', fr: 'Communiquer ses idées' },
  { en: 'Think creatively', fr: 'Faire preuve de créativité' },
];

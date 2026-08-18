import {
  Bot,
  Code2,
  Rocket,
  Smile,
  CircuitBoard,
  Printer,
  Terminal,
  type LucideIcon,
} from 'lucide-react';

export type Course = { title: string; icon: LucideIcon; color: string };

export const courses: Course[] = [
  { title: 'Robotique', icon: Bot, color: '#f7b500' },
  { title: 'Programmation', icon: Code2, color: '#3d7fff' },
  { title: 'Entrepreneuriat', icon: Rocket, color: '#ff5a5f' },
  { title: "Jeu d'intelligence émotionnelle", icon: Smile, color: '#6c5ce7' },
  { title: 'Électronique', icon: CircuitBoard, color: '#00b894' },
  { title: 'Impression et design 3D', icon: Printer, color: '#ff8c42' },
  { title: 'Python', icon: Terminal, color: '#0b8793' },
];

const courseByTitle: Record<string, Course> = Object.fromEntries(
  courses.map((course) => [course.title, course])
);

export type AgeGroup = {
  slug: string;
  label: string;
  image: string;
  courseTitles: string[];
};

export const ageGroups: AgeGroup[] = [
  {
    slug: '4-5',
    label: '4-5 years',
    image: '/age/4-5.jpg',
    courseTitles: ["Jeu d'intelligence émotionnelle"],
  },
  {
    slug: '6-9',
    label: '6-9 years',
    image: '/age/6-9.jpg',
    courseTitles: ['Robotique', 'Programmation', 'Entrepreneuriat', "Jeu d'intelligence émotionnelle"],
  },
  {
    slug: '10-13',
    label: '10-13 years',
    image: '/age/10-13.png',
    courseTitles: ['Robotique', 'Entrepreneuriat', 'Programmation', 'Électronique', 'Impression et design 3D'],
  },
  {
    slug: '14-18',
    label: '14-18 years',
    image: '/age/14-18.png',
    courseTitles: ['Python', 'Robotique', 'Entrepreneuriat'],
  },
];

export function getAgeGroup(slug: string): AgeGroup | undefined {
  return ageGroups.find((group) => group.slug === slug);
}

export function getCoursesForAgeGroup(group: AgeGroup): Course[] {
  return group.courseTitles.map((title) => courseByTitle[title]).filter(Boolean);
}

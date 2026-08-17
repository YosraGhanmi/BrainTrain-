'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import {
  Bot,
  Code2,
  Rocket,
  Smile,
  CircuitBoard,
  Printer,
  Terminal,
  X,
  Pin,
  CheckCircle2,
  TreePine,
  Ghost,
  Circle,
  Mic,
  Leaf,
  MoonStar,
  Dices,
  Scissors,
  Droplet,
  Sparkles,
  Star,
  Heart,
  Feather,
  Puzzle,
  type LucideIcon,
} from 'lucide-react';

const courses: { title: string; icon: LucideIcon; color: string }[] = [
  { title: 'Robotique', icon: Bot, color: '#f7b500' },
  { title: 'Programmation', icon: Code2, color: '#3d7fff' },
  { title: 'Entrepreneuriat', icon: Rocket, color: '#ff5a5f' },
  { title: "Jeu d'intelligence émotionnelle", icon: Smile, color: '#6c5ce7' },
  { title: 'Électronique', icon: CircuitBoard, color: '#00b894' },
  { title: 'Impression et design 3D', icon: Printer, color: '#ff8c42' },
  { title: 'Python', icon: Terminal, color: '#0b8793' },
];

const decorativeIcons: { icon: LucideIcon; top: string; left: string; size: number; rotate: number }[] = [
  { icon: X, top: '6%', left: '8%', size: 28, rotate: -8 },
  { icon: Pin, top: '4%', left: '22%', size: 34, rotate: 6 },
  { icon: CheckCircle2, top: '8%', left: '42%', size: 30, rotate: 0 },
  { icon: TreePine, top: '10%', left: '62%', size: 32, rotate: 10 },
  { icon: Circle, top: '18%', left: '52%', size: 14, rotate: 0 },
  { icon: Ghost, top: '12%', left: '90%', size: 32, rotate: -6 },

  { icon: Mic, top: '26%', left: '18%', size: 28, rotate: -4 },
  { icon: Heart, top: '52%', left: '15%', size: 20, rotate: 10 },
  { icon: Dices, top: '72%', left: '20%', size: 30, rotate: -8 },

  { icon: Feather, top: '20%', left: '4%', size: 24, rotate: 10 },
  { icon: Puzzle, top: '44%', left: '6%', size: 26, rotate: -6 },
  { icon: Circle, top: '64%', left: '2%', size: 14, rotate: 0 },
  { icon: TreePine, top: '88%', left: '5%', size: 26, rotate: -10 },

  { icon: MoonStar, top: '24%', left: '81%', size: 28, rotate: -10 },
  { icon: Sparkles, top: '48%', left: '78%', size: 24, rotate: 12 },
  { icon: Star, top: '74%', left: '80%', size: 20, rotate: -8 },

  { icon: Scissors, top: '18%', left: '95%', size: 24, rotate: 8 },
  { icon: Droplet, top: '38%', left: '97%', size: 20, rotate: -12 },
  { icon: X, top: '60%', left: '94%', size: 22, rotate: 6 },
  { icon: Leaf, top: '84%', left: '96%', size: 24, rotate: 10 },
];

gsap.registerPlugin(ScrollTrigger);

export default function CoursesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.courses-heading',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            once: true,
          },
        }
      );

      gsap.fromTo(
        '.course-card',
        { opacity: 0, y: 40, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 65%',
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="courses"
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0b1a3a] px-6 py-16 md:px-10 lg:px-16"
    >
      <div className="pointer-events-none absolute inset-0">
        {decorativeIcons.map(({ icon: Icon, top, left, size, rotate }, i) => (
          <Icon
            key={i}
            className="absolute text-white opacity-10"
            style={{
              top,
              left,
              width: size,
              height: size,
              transform: `rotate(${rotate}deg)`,
            }}
            strokeWidth={2}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="max-w-4xl space-y-6">
          <h2 className="courses-heading text-display whitespace-nowrap font-semibold leading-[0.9] text-white sm:text-[clamp(2.5rem,5vw,5.5rem)]">
            Courses built for curious minds.
          </h2>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {courses.map(({ title, icon: Icon, color }) => (
            <div
              key={title}
              className="course-card flex aspect-square flex-col items-center justify-center gap-4 rounded-2xl bg-white/10 p-6 text-center transition hover:-translate-y-1 hover:bg-white/15"
            >
              <Icon className="h-12 w-12" style={{ color }} strokeWidth={1.75} />
              <h3 className="text-lg font-extrabold text-white">{title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

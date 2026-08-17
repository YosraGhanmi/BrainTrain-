'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import NeonBorder from '@/components/effects/NeonBorder';

gsap.registerPlugin(ScrollTrigger);

const rows = [
  {
    image: '/About us 1.jpg',
    alt: 'BrainTrain students working together in a hands-on session',
    imageFirst: false,
    lead: 'BrainTrain is a Tunisian multidisciplinary academy for young minds aged 6–17, where curiosity becomes capability.',
    body: 'Through hands-on programs in robotics, programming, artificial intelligence, 3D design, entrepreneurship, and technology, we help young people develop the skills to create, innovate, and solve real-world problems.',
  },
  {
    image: '/About us 2.jpg',
    alt: 'BrainTrain students collaborating around a whiteboard',
    imageFirst: true,
    lead: 'BrainTrain is not a traditional school.',
    body: 'We believe the best way to learn is by doing. Our mission is to transform curious kids into creators, innovators, and problem-solvers by giving them the freedom to experiment, build ideas, work together, and turn challenges into opportunities.',
  },
  {
    image: '/About us 3.jpg',
    alt: 'BrainTrain students celebrating with their competition trophies',
    imageFirst: false,
    lead: "Our students don't simply sit in classrooms they build, compete, and WIN.",
    body: 'From developing real projects to taking on national and international challenges, our students have represented Tunisia on stages across the world, including Greece and Jordan .',
    
  },
];

export default function PhilosophySection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const rowEls = gsap.utils.toArray('.about-row') as HTMLElement[];

      rowEls.forEach((row) => {
        const image = row.querySelector('.about-row-image');
        const text = row.querySelector('.about-row-text');

        gsap.fromTo(
          image,
          { opacity: 0, y: 60, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: row,
              start: 'top 80%',
              once: true,
            },
          }
        );
        gsap.fromTo(
          text,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            delay: 0.15,
            scrollTrigger: {
              trigger: row,
              start: 'top 80%',
              once: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="philosophy" ref={sectionRef} className="relative overflow-hidden px-6 py-28 md:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-20 max-w-3xl text-display font-display font-semibold leading-[0.9] text-ink sm:mb-28">
          WHO <span className="text-gradient">ARE WE</span>
        </h2>

        <div className="flex flex-col gap-24 sm:gap-32">
          {rows.map((row) => (
            <div
              key={row.image}
              className={`about-row flex flex-col items-center gap-10 sm:gap-14 lg:gap-20 ${
                row.imageFirst ? 'lg:flex-row' : 'lg:flex-row-reverse'
              }`}
            >
              <div className="about-row-image relative w-full max-w-lg shrink-0 lg:w-1/2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] shadow-soft">
                  <Image src={row.image} alt={row.alt} fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
                </div>
                <div className="pointer-events-none absolute inset-0">
                  <NeonBorder color="#3d7fff" rounded={16} thickness={2} borderSize={35} glow={30} movement="continuous" speed={10} />
                </div>
              </div>

              <div className="about-row-text w-full lg:w-1/2">
                <p className="text-2xl font-display font-semibold leading-tight text-ink sm:text-3xl">{row.lead}</p>
                <p className="mt-5 text-base leading-relaxed text-stone sm:text-lg">{row.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import HeroSection from './HeroSection';
import TeamPhoto from '@/components/gallery/TeamPhoto';

gsap.registerPlugin(ScrollTrigger);

export default function HeroImageTransition() {
  const heroRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current || !imageRef.current) return;

    const ctx = gsap.context(() => {
      // At rest the image's top 30px sits tucked under the hero (negative
      // margin below, z-index above), a fixed physical overlap — no JS
      // needed for that part. As the seam scrolls through view, the hero
      // eases up and the image eases down by equal, opposite amounts, so
      // they visibly separate together rather than one staying put while
      // the other slides away.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'bottom 90%',
          end: 'bottom 20%',
          scrub: 0.4,
        },
      });

      tl.to(heroRef.current, { y: -18, ease: 'none' }, 0).to(imageRef.current, { y: 18, ease: 'none' }, 0);
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative">
      <div ref={heroRef} className="relative z-10 bg-surface will-change-transform">
        <HeroSection />
      </div>
      <div ref={imageRef} className="relative z-0 -mt-[30px] will-change-transform">
        <TeamPhoto />
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import RoundCarousel from '@/components/carousel/RoundCarousel';

function useResponsiveCarouselSize() {
  const [size, setSize] = useState(520);

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      if (width < 420) setSize(190);
      else if (width < 640) setSize(260);
      else if (width < 1024) setSize(360);
      else setSize(520);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}

export default function StatsSection({ achievementsImages }: { achievementsImages: string[] }) {
  const t = useTranslations('achievements');
  const carouselSize = useResponsiveCarouselSize();

  return (
    <section id="stats" className="relative overflow-hidden px-6 py-28 md:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-1/4 top-0 h-96 w-96 rounded-full bg-gold/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="max-w-2xl space-y-6">
          <h2 className="text-display font-display font-semibold leading-[0.9] text-[#0b1a3a] sm:text-[clamp(3.5rem,6vw,6rem)]">
            {t('heading')}
          </h2>
          <p className="text-lg leading-relaxed text-stone sm:text-xl">
            {t('body')}
          </p>
        </div>
      </div>

      <div className="relative left-1/2 mt-16 h-[280px] w-screen -translate-x-1/2 xs:h-[360px] sm:h-[460px] lg:h-[600px]">
        <RoundCarousel
          images={achievementsImages.map((src) => ({ src }))}
          background="transparent"
          imageWidth={carouselSize}
          imageHeight={carouselSize}
          speed={0.5}
        />
      </div>
    </section>
  );
}

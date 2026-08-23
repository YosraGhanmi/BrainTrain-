'use client';

import { useEffect, useState } from 'react';
import PartnersGrid from './PartnersGrid';

function useResponsivePerPage() {
  const [perPage, setPerPage] = useState(7);

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      if (width < 480) setPerPage(3);
      else if (width < 640) setPerPage(4);
      else if (width < 1024) setPerPage(5);
      else setPerPage(7);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return perPage;
}

export default function PartnersSection({ logos }: { logos: string[] }) {
  const perPage = useResponsivePerPage();

  return (
    <section className="px-6 py-20 md:px-10 lg:px-16">
      <div className="text-center">
        <h2 className="text-4xl font-display font-bold text-ink sm:text-5xl">
          Our <span>Partners</span>
        </h2>
      </div>

      <div className="mt-14 w-full">
        <PartnersGrid logos={logos} perPage={perPage} />
      </div>
    </section>
  );
}

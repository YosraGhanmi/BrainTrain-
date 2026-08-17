'use client';

import { useEffect, useState } from 'react';
import PartnersGrid from './PartnersGrid';

const partnerLogos = [
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
];

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

export default function PartnersSection() {
  const perPage = useResponsivePerPage();

  return (
    <section className="px-6 py-20 md:px-10 lg:px-16">
      <div className="text-center">
        <h2 className="text-4xl font-display font-bold text-ink sm:text-5xl">
          Our <span>Partners</span>
        </h2>
      </div>

      <div className="mt-14 w-full">
        <PartnersGrid logos={partnerLogos} perPage={perPage} />
      </div>
    </section>
  );
}

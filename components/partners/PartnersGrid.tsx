'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PartnersGridProps {
  logos: string[];
  perPage: number;
}

export default function PartnersGrid({ logos, perPage }: PartnersGridProps) {
  const pageCount = Math.max(1, Math.ceil(logos.length / perPage));
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [perPage]);

  const start = page * perPage;
  const visible = logos.slice(start, start + perPage);
  while (visible.length < perPage) visible.push(...logos.slice(0, perPage - visible.length));

  const goPrev = () => setPage((p) => (p - 1 + pageCount) % pageCount);
  const goNext = () => setPage((p) => (p + 1) % pageCount);

  return (
    <div className="w-full">
      <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-10">
        {visible.map((src, i) => (
          <div key={`${src}-${i}`} className="flex h-24 flex-1 items-center justify-center sm:h-32">
            <img
              src={src}
              alt=""
              draggable={false}
              className="max-h-full max-w-[160px] object-contain mix-blend-multiply transition duration-300 hover:scale-105 sm:max-w-[190px]"
            />
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous partners"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0b1a3a]/15 text-ink transition hover:border-accent hover:text-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next partners"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0b1a3a]/15 text-ink transition hover:border-accent hover:text-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

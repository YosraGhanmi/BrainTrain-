'use client';

import { useEffect, useState } from 'react';

export default function ProgressBar({ percent }: { percent: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(percent));
    return () => cancelAnimationFrame(id);
  }, [percent]);

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-ink/5">
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-[width] duration-1000 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

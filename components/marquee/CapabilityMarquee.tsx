'use client';

const items = [
  'Robotics',
  'Programming & Software',
  'Artificial Intelligence',
  '3D Design & Printing',
  'Entrepreneurship',
  'Technology & Innovation',
];

export default function CapabilityMarquee() {
  const loop = [...items, ...items];

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-surface/60 py-6">
      <div className="marquee-track">
        {loop.map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center gap-6 px-8">
            <span className="whitespace-nowrap font-display text-2xl font-medium uppercase tracking-tight text-stone sm:text-3xl">
              {item}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent/70" />
          </div>
        ))}
      </div>
    </section>
  );
}

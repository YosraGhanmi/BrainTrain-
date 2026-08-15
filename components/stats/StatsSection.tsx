import RoundCarousel from '@/components/carousel/RoundCarousel';

export default function StatsSection() {
  return (
    <section id="stats" className="relative overflow-hidden px-6 py-28 md:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-1/4 top-0 h-96 w-96 rounded-full bg-gold/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="max-w-2xl space-y-6">
          <h2 className="text-display font-display font-semibold leading-[0.9] text-[#0b1a3a] sm:text-[clamp(3.5rem,6vw,6rem)]">
            Achievements
          </h2>
          <p className="text-lg leading-relaxed text-stone sm:text-xl">
            BrainTrain students don&apos;t just finish courses, they represent Tunisia at international competitions
            and come home with trophies to prove it.
          </p>
        </div>
      </div>

      <div className="relative left-1/2 mt-16 h-[600px] w-screen -translate-x-1/2">
        <RoundCarousel background="transparent" imageWidth={520} imageHeight={520} speed={0.5} />
      </div>
    </section>
  );
}

import Image from 'next/image';

export default function TeamPhoto() {
  return (
    <section className="relative w-full">
      <div className="relative h-[55vh] min-h-[340px] w-full sm:h-[70vh] lg:h-[85vh]">
        <Image
          src="/ALL.png"
          alt="BrainTrain students and mentors celebrating with their competition trophies"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}

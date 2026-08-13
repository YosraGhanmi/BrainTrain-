'use client';

export default function CoursesSection() {
  return (
    <section id="courses" className="relative overflow-hidden px-6 py-28 md:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <span className="text-sm uppercase tracking-[0.35em] text-stone">Courses</span>
            <h2 className="text-display font-semibold leading-[0.9] text-ink sm:text-[clamp(4rem,7vw,6.5rem)]">
              Courses built for curious minds.
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-stone sm:text-xl">
              From robotics and programming to 3D design and competition prep, BrainTrain delivers hands-on learning that grows confidence and skill.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: 'Robotics Lab', description: 'Design, build and program robots for real challenges.' },
              { title: 'Coding & AI', description: 'Learn software, AI fundamentals and product thinking.' },
              { title: '3D Design', description: 'Create digital prototypes and immersive experiences.' },
              { title: 'Competition Prep', description: 'Train to compete with teamwork and winning strategy.' },
            ].map((course) => (
              <div key={course.title} className="rounded-[2rem] border border-black/5 bg-white/90 p-8 shadow-soft">
                <h3 className="text-xl font-semibold text-ink">{course.title}</h3>
                <p className="mt-4 text-sm leading-6 text-stone">{course.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

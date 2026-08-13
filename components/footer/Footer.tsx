import Image from 'next/image';

const links = [
  { label: 'About', href: '#philosophy' },
  { label: 'Journey', href: '#journey' },
  { label: 'Achievements', href: '#stats' },
  { label: 'Courses', href: '#courses' },
  { label: 'Contact', href: '#contact' },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-ink/10 px-6 py-12 md:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-16 overflow-hidden">
            <Image src="/ID BRAINTRAIN.png" alt="BrainTrain logo" fill sizes="64px" className="object-contain" />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone">
            From curiosity to creation. From Tunisia to the world.
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs uppercase tracking-[0.2em] text-stone transition hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="text-xs text-stone">&copy; {new Date().getFullYear()} BrainTrain. All rights reserved.</p>
      </div>
    </footer>
  );
}

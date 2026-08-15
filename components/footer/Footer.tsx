import { Facebook, Instagram, Linkedin } from 'lucide-react';

const socials = [
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61556624844766', Icon: Facebook },
  { label: 'Instagram', href: 'https://www.instagram.com/braintrain.tn/', Icon: Instagram },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/braintrainacademy/', Icon: Linkedin },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-ink/10 px-6 py-6 md:px-10 lg:px-16">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-stone">
          &copy; {new Date().getFullYear()} <span className="text-accent">BrainTrain Academy</span>. All Rights Reserved.
        </p>

        <div className="flex items-center gap-3">
          {socials.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1e2a5e] text-[#1e2a5e] transition hover:bg-[#1e2a5e] hover:text-white"
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

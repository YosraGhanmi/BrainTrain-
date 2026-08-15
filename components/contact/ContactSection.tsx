'use client';

import { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';

const MAPS_EMBED_SRC = 'https://www.google.com/maps?q=35.8441493,10.6148468&z=17&output=embed';
const MAPS_LINK =
  'https://www.google.com/maps/place/Braintrain+Academy/@35.8441536,10.6122719,17z/data=!3m1!4b1!4m6!3m5!1s0x12fd8b0074c0577b:0x4e986dd851ffe308!8m2!3d35.8441493!4d10.6148468!16s%2Fg%2F11vzg1d9bv?entry=tts&g_ep=EgoyMDI0MDkxOC4xKgBIAVAD';

const details = [
  { Icon: Mail, label: 'Email', value: 'contact@braintrain.tn', href: 'mailto:contact@braintrain.tn' },
  { Icon: Phone, label: 'Phone', value: '58 996 112', href: 'tel:+21658996112' },
  {
    Icon: MapPin,
    label: 'Location',
    value: 'Rue Gp1, Khzema Ouest, Sousse, Tunisia, 4071',
    href: MAPS_LINK,
  },
];

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Message from ${form.name || 'BrainTrain website'}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:contact@braintrain.tn?subject=${subject}&body=${body}`;
  }

  return (
    <section id="contact" className="relative overflow-hidden bg-surface px-6 py-28 md:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
          <div className="space-y-2">
            <span className="text-sm uppercase tracking-[0.35em] text-stone">Contact</span>
            <h2 className="text-display font-semibold leading-[0.9] text-ink sm:text-[clamp(2.75rem,4.5vw,4rem)]">
              Contact Us
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-stone">
              Reach out for enrollment details, program guidance, or to schedule a free consultation with our team.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-stretch">
            <div className="flex flex-col gap-6">
              <div className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-slate-50">
                {details.map(({ Icon, label, value, href }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-4 p-4 transition hover:bg-slate-100"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] uppercase tracking-[0.25em] text-stone">{label}</span>
                      <span className="block truncate text-sm font-medium text-ink">{value}</span>
                    </span>
                  </a>
                ))}
              </div>

              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block flex-1 min-h-[220px] overflow-hidden rounded-2xl border border-ink/10"
              >
                <iframe
                  src={MAPS_EMBED_SRC}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="BrainTrain Academy location"
                />
              </a>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-slate-50 p-6 sm:p-8">
              <p className="text-sm uppercase tracking-[0.35em] text-stone">Send us a message</p>

              <div className="space-y-2">
                <label htmlFor="name" className="text-xs uppercase tracking-[0.2em] text-stone">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange('name')}
                  className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/30"
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs uppercase tracking-[0.2em] text-stone">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange('email')}
                  className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/30"
                  placeholder="you@example.com"
                />
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <label htmlFor="message" className="text-xs uppercase tracking-[0.2em] text-stone">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  value={form.message}
                  onChange={handleChange('message')}
                  className="w-full flex-1 min-h-[140px] resize-none rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/30"
                  placeholder="Tell us how we can help"
                />
              </div>

              <button
                type="submit"
                className="inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
              >
                Send message
              </button>
            </form>
          </div>
      </div>
    </section>
  );
}

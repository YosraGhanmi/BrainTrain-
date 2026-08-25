'use client';

import { useState } from 'react';
import { Mail, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ContactContent } from '@/lib/content/types';
import { submitContactMessage } from '@/lib/contact/actions';

export default function ContactSection({ contact }: { contact: ContactContent }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const t = useTranslations('contact');

  const details = [
    { Icon: Mail, label: t('email'), value: contact.email.value, href: contact.email.href },
    { Icon: Phone, label: t('phone'), value: contact.phone.value, href: contact.phone.href },
    { Icon: MapPin, label: t('location'), value: contact.location.value, href: contact.location.href },
  ];

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    await submitContactMessage(form);
    setForm({ name: '', email: '', message: '' });
    setStatus('sent');
  }

  return (
    <section id="contact" className="relative overflow-hidden bg-surface px-6 py-28 md:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
          <div className="space-y-2">
            <span className="text-sm uppercase tracking-[0.35em] text-stone">{t('label')}</span>
            <h2 className="text-display font-semibold leading-[0.9] text-ink sm:text-[clamp(2.75rem,4.5vw,4rem)]">
              {t('heading')}
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-stone">
              {t('intro')}
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
                href={contact.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block flex-1 min-h-[220px] overflow-hidden rounded-2xl border border-ink/10"
              >
                <iframe
                  src={contact.mapsEmbedSrc}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="BrainTrain Academy location"
                />
              </a>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-slate-50 p-6 sm:p-8">
              <p className="text-sm uppercase tracking-[0.35em] text-stone">{t('formTitle')}</p>

              <div className="space-y-2">
                <label htmlFor="name" className="text-xs uppercase tracking-[0.2em] text-stone">
                  {t('fullName')}
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange('name')}
                  className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/30"
                  placeholder={t('fullNamePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs uppercase tracking-[0.2em] text-stone">
                  {t('email')}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange('email')}
                  className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/30"
                  placeholder={t('emailPlaceholder')}
                />
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <label htmlFor="message" className="text-xs uppercase tracking-[0.2em] text-stone">
                  {t('message')}
                </label>
                <textarea
                  id="message"
                  required
                  value={form.message}
                  onChange={handleChange('message')}
                  className="w-full flex-1 min-h-[140px] resize-none rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/30"
                  placeholder={t('messagePlaceholder')}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90 disabled:opacity-60"
              >
                {status === 'sent' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {t('sent')}
                  </>
                ) : status === 'sending' ? (
                  t('sending')
                ) : (
                  t('send')
                )}
              </button>
            </form>
          </div>
      </div>
    </section>
  );
}

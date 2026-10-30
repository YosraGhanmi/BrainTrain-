'use client';

import { useState } from 'react';
import { Mail, MapPin, Phone, CheckCircle2, Loader2, MessageCircle, ArrowUpRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ContactContent, LocalizedString } from '@/lib/content/types';
import type { AppLocale } from '@/i18n/routing';
import { submitContactMessage } from '@/lib/contact/actions';
import { whatsappHref } from '@/lib/contact/whatsapp';

const inputClass =
  'w-full rounded-xl border border-[#0b1a3a]/10 bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-[#0b1a3a]/30 focus-visible:ring-2 focus-visible:ring-accent/40';

export default function ContactSection({ contact }: { contact: ContactContent }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const t = useTranslations('contact');
  const locale = useLocale() as AppLocale;
  const text = (value: LocalizedString) => value[locale] || value.en;

  const whatsapp = whatsappHref(contact.whatsapp);
  const highlights = contact.highlights.map(text).filter(Boolean);
  const details = [
    { Icon: MapPin, value: contact.location.value, href: contact.location.href, strong: true },
    { Icon: Phone, value: contact.phone.value, href: contact.phone.href, strong: false },
    { Icon: Mail, value: contact.email.value, href: contact.email.href, strong: false },
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
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-[#0b1a3a] sm:text-5xl">
            {text(contact.heading)}
            <span className="block text-accent">{text(contact.headingAccent)}</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone">{text(contact.intro)}</p>

          {highlights.length > 0 ? (
            <ul className="mt-8 space-y-3">
              {highlights.map((line) => (
                <li key={line} className="flex items-center gap-3 text-[0.95rem] font-medium text-[#0b1a3a]/80">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" strokeWidth={2} aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
          ) : null}

          <ul className="mt-10 space-y-3 border-t border-[#0b1a3a]/10 pt-8">
            {details.map(({ Icon, value, href, strong }) => (
              <li key={value}>
                <a
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`inline-flex items-center gap-3 text-[0.95rem] transition hover:text-accent ${
                    strong ? 'font-semibold text-[#0b1a3a]' : 'text-stone'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0 text-[#ff8c42]" strokeWidth={1.75} aria-hidden="true" />
                  {value}
                </a>
              </li>
            ))}
          </ul>

          {/* The map takes its own clicks (pan, zoom), so the link to open it
              in Google Maps sits under it rather than around it */}
          <div className="mt-8 h-64 overflow-hidden rounded-[1.5rem] border border-[#0b1a3a]/10 bg-white shadow-[0_12px_40px_rgba(11,26,58,0.08)]">
            <iframe
              src={contact.mapsEmbedSrc}
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={t('mapTitle')}
            />
          </div>
          <a
            href={contact.location.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition hover:text-accent2"
          >
            {t('openMap')}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <div className="self-start rounded-[2rem] border border-[#0b1a3a]/5 bg-white p-7 shadow-[0_24px_60px_rgba(11,26,58,0.12)] sm:p-10">
          <h3 className="font-display text-2xl font-extrabold text-[#0b1a3a] sm:text-3xl">{text(contact.cardTitle)}</h3>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-stone">{text(contact.cardText)}</p>

          <div className="mt-7 space-y-3">
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 rounded-xl bg-[#25d366] px-5 py-4 text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:bg-[#1da851]"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                {t('whatsapp')}
              </a>
            ) : null}
            <a
              href={contact.phone.href}
              className="flex items-center justify-center gap-3 rounded-xl bg-[#0b1a3a] px-5 py-4 text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:bg-[#0b1a3a]/90"
            >
              <Phone className="h-5 w-5" aria-hidden="true" />
              {t('call', { phone: contact.phone.value })}
            </a>
            <a
              href={contact.email.href}
              className="flex items-center justify-center gap-3 rounded-xl border border-[#0b1a3a]/10 px-5 py-4 text-sm font-semibold text-[#0b1a3a] transition hover:border-accent hover:text-accent"
            >
              <Mail className="h-5 w-5" aria-hidden="true" />
              {contact.email.value}
            </a>
          </div>

          <div className="my-8 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-[#0b1a3a]/10" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-stone">{t('formTitle')}</span>
            <span className="h-px flex-1 bg-[#0b1a3a]/10" />
          </div>

          <form onSubmit={handleSubmit} aria-label={t('formTitle')} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
                  className={inputClass}
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
                  className={inputClass}
                  placeholder={t('emailPlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-xs uppercase tracking-[0.2em] text-stone">
                {t('message')}
              </label>
              <textarea
                id="message"
                required
                value={form.message}
                onChange={handleChange('message')}
                className={`${inputClass} min-h-[120px] resize-none`}
                placeholder={t('messagePlaceholder')}
              />
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#0b1a3a] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.15em] text-[#0b1a3a] transition hover:bg-[#0b1a3a] hover:text-white disabled:opacity-60"
            >
              {status === 'sent' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {t('sent')}
                </>
              ) : status === 'sending' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('sending')}
                </>
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

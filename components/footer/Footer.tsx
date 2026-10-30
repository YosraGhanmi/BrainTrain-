import { getLocale, getTranslations } from 'next-intl/server';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import SocialIcon from '@/components/social/SocialIcon';
import TextMorph from '@/components/text/TextMorph';
import { readContent } from '@/lib/content/store';
import { whatsappHref } from '@/lib/contact/whatsapp';
import type { AppLocale } from '@/i18n/routing';
import type { LocalizedString } from '@/lib/content/types';

// Each column's heading and bullets take one of the site's accents
const BLUE = '#7b91f4';
const ORANGE = '#ff8c42';
const RED = '#ef4b4b';

function ColumnHeading({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em]" style={{ color }}>
      {children}
    </h2>
  );
}

function BulletLink({ href, color, children }: { href: string; color: string; children: React.ReactNode }) {
  return (
    <li>
      {/* The label sits in one span so a long one wraps as text, not as
          separate flex columns */}
      <Link href={href} className="group inline-flex items-start gap-2.5 text-sm font-medium text-white/70 transition hover:text-white">
        <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full transition group-hover:scale-125" style={{ backgroundColor: color }} />
        <span>{children}</span>
      </Link>
    </li>
  );
}

// Everything here but the link labels comes from the admin panel: contact
// details and the tagline (Contact), social links, and the age groups
export default async function Footer() {
  const [content, locale, t, nav] = await Promise.all([
    readContent(),
    getLocale() as Promise<AppLocale>,
    getTranslations('footer'),
    getTranslations('nav'),
  ]);
  const text = (value: LocalizedString) => value[locale] || value.en;
  const { contact, socials, ageGroups } = content;
  const whatsapp = whatsappHref(contact.whatsapp);

  const quickLinks = [
    { label: nav('home'), href: '/' },
    { label: nav('about'), href: '/#philosophy' },
    { label: nav('courses'), href: '/courses' },
    { label: t('preinscription'), href: '/preinscription' },
    { label: nav('contact'), href: '/contact' },
    { label: t('parentPortal'), href: '/parent-portal/login' },
  ];

  const details = [
    { Icon: Phone, value: contact.phone.value, href: contact.phone.href },
    { Icon: Mail, value: contact.email.value, href: contact.email.href },
    { Icon: MapPin, value: contact.location.value, href: contact.location.href },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#0b1a3a] px-6 pb-8 pt-16 text-white md:px-10 lg:px-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 0.6px, transparent 0.6px)',
          backgroundSize: '18px 18px',
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-10">
          <div>
            {/* The same "Train" / "Brain" morph as the dark portal sidebar */}
            <Link href="/" aria-label="BrainTrain" className="block h-12 w-40">
              <TextMorph
                words="Train,Brain"
                color="#ffffff"
                font={{
                  fontFamily: 'var(--font-comfortaa)',
                  fontWeight: 700,
                  fontSize: 36,
                  lineHeight: '1.1',
                  letterSpacing: '-0.02em',
                  textAlign: 'left',
                }}
                transition={{ duration: 0.4, delay: 2, ease: 'easeInOut' }}
              />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">{text(content.footer.tagline)}</p>

            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-6 inline-flex items-center gap-2.5 rounded-xl border border-[#25d366]/60 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#25d366] hover:bg-[#25d366]"
              >
                <MessageCircle className="h-4 w-4 text-[#25d366] transition group-hover:text-white" aria-hidden="true" />
                {t('whatsapp')}
              </a>
            ) : null}

            {socials.length > 0 ? (
              <ul className="mt-6 flex items-center gap-3" aria-label={t('followUs')}>
                {socials.map((social) => (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-white hover:bg-white hover:text-[#0b1a3a]"
                    >
                      <SocialIcon label={social.label} className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav aria-label={t('quickLinks')}>
            <ColumnHeading color={BLUE}>{t('quickLinks')}</ColumnHeading>
            <ul className="mt-6 space-y-3">
              {quickLinks.map((link) => (
                <BulletLink key={link.href} href={link.href} color={BLUE}>
                  {link.label}
                </BulletLink>
              ))}
            </ul>
          </nav>

          <nav aria-label={t('ourCourses')}>
            <ColumnHeading color={ORANGE}>{t('ourCourses')}</ColumnHeading>
            <ul className="mt-6 space-y-3">
              {ageGroups.map((group) => (
                <BulletLink key={group.slug} href={`/courses/${group.slug}`} color={ORANGE}>
                  {text(group.label)}
                  {text(group.stage) ? <span className="text-white/45"> · {text(group.stage)}</span> : null}
                </BulletLink>
              ))}
              <BulletLink href="/courses" color={ORANGE}>
                {t('allCourses')}
              </BulletLink>
            </ul>
          </nav>

          <div>
            <ColumnHeading color={RED}>{t('contactTitle')}</ColumnHeading>
            <ul className="mt-6 space-y-4">
              {details.map(({ Icon, value, href }) => (
                <li key={value}>
                  <a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-start gap-3 text-sm font-medium text-white/70 transition hover:text-white"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: RED }} strokeWidth={1.75} aria-hidden="true" />
                    {value}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
            &copy; {new Date().getFullYear()} BrainTrain Academy. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}

import { useTranslations } from 'next-intl';

// Yellow hanging price tag for the family discount: string, punched hole,
// inner black border and raised lettering.
export default function DiscountTag({ percent }: { percent: number }) {
  const t = useTranslations('pricing');
  return (
    <div
      className="relative inline-flex shrink-0 -rotate-[4deg] items-center pl-5 drop-shadow-[0_6px_6px_rgba(15,31,77,0.28)]"
      role="img"
      aria-label={`${t('familyTitle')} ${t('familyBody', { percent })}`}
    >
      {/* String looping into the hole */}
      <svg aria-hidden viewBox="0 0 40 40" className="absolute -left-1 top-1/2 h-10 w-10 -translate-y-1/2 text-[#1a1a1a]" fill="none">
        <path d="M2 30 C 8 4, 22 4, 31 18 M2 30 C 10 22, 22 22, 31 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>

      <div className="relative flex items-center gap-2 rounded-md bg-gradient-to-b from-[#ffd84a] via-[#f7c600] to-[#e9b100] py-1.5 pl-6 pr-3 shadow-[inset_0_0_0_3px_#f7c600,inset_0_0_0_4.5px_#1a1a1a,inset_0_1px_0_5px_rgba(255,255,255,0.35)]">
        <span aria-hidden className="absolute left-2.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)] ring-1 ring-black/60" />
        <span className="font-display text-[1.65rem] font-black leading-none tracking-tight text-[#141414] [text-shadow:1px_1px_0_#fff2a8,2px_2px_0_rgba(0,0,0,0.28)]">
          -{percent}%
        </span>
        <span className="text-[9px] font-black uppercase leading-[1.1] tracking-wide text-[#141414] [text-shadow:1px_1px_0_rgba(255,242,168,0.9)]">
          {t('tagLine1')}
          <br />
          {t('tagLine2')}
        </span>
      </div>
    </div>
  );
}

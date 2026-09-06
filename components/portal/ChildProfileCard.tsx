import { uploadChildPhoto } from '@/lib/children/actions';
import { rotateHue } from '@/lib/color';
import ChildAvatarUploader from '@/components/portal/ChildAvatarUploader';
import type { AppLocale } from '@/i18n/routing';

const MAX_VISIBLE_COURSES = 3;
const DEFAULT_GRADIENT = 'linear-gradient(to bottom right, #3d7fff, #6c5ce7, #ff8c42)';

export default function ChildProfileCard({
  locale,
  childId,
  fullName,
  photoUrl,
  photoColor,
  ageGroupLabel,
  courseTitles,
}: {
  locale: AppLocale;
  childId: string;
  fullName: string;
  photoUrl: string | null;
  photoColor: string | null;
  ageGroupLabel: string;
  courseTitles: string[];
}) {
  const visibleCourses = courseTitles.slice(0, MAX_VISIBLE_COURSES);
  const extraCount = courseTitles.length - visibleCourses.length;

  const bannerBackground = photoColor
    ? `linear-gradient(to bottom right, ${rotateHue(photoColor, -25)}, ${photoColor}, ${rotateHue(photoColor, 35)})`
    : DEFAULT_GRADIENT;

  return (
    <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-soft">
      <div className="relative h-24" style={{ background: bannerBackground }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/15 blur-xl" />
          <div className="absolute bottom-0 right-8 h-16 w-16 rounded-full bg-white/10 blur-lg" />
        </div>
      </div>

      <div className="relative px-6 pb-6 text-center">
        <form action={uploadChildPhoto} className="-mt-10 inline-block">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="childId" value={childId} />
          <ChildAvatarUploader name={fullName} photoUrl={photoUrl} />
        </form>

        <h2 className="mt-3 font-display text-lg font-bold text-ink">{fullName}</h2>
        <p className="text-sm text-stone">{ageGroupLabel}</p>

        {courseTitles.length === 0 ? (
          <p className="mt-4 text-sm text-stone">Not enrolled in any course yet.</p>
        ) : (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {visibleCourses.map((title) => (
              <span key={title} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink">
                {title}
              </span>
            ))}
            {extraCount > 0 ? (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">+{extraCount}</span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

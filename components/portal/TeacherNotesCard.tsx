import { getTranslations } from 'next-intl/server';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { formatShortDate, localized } from '@/lib/i18n/format';
import type { AppLocale } from '@/i18n/routing';
import type { Prisma } from '@prisma/client';

type NoteWithRelations = Prisma.TeacherNoteGetPayload<{
  include: { teacher: { include: { user: true } }; courseSession: true };
}>;

export default async function TeacherNotesCard({ notes, locale }: { notes: NoteWithRelations[]; locale: AppLocale }) {
  const t = await getTranslations({ locale, namespace: 'parentPortal.dashboard.teacherNotes' });
  return (
    <div id="teacher-notes" className="flex-1 scroll-mt-6 rounded-3xl border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="text-base font-semibold text-ink">{t('heading')}</h2>

      {notes.length === 0 ? (
        <p className="mt-6 text-sm text-stone">{t('empty')}</p>
      ) : (
        <ul className="mt-4 max-h-[22rem] space-y-3 overflow-y-auto pr-1">
          {notes.map((note) => {
            const course = getCourseEntryOrThrow(note.courseSession.courseSlug);
            return (
              <li key={note.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-ink">{localized(course.title, locale)}</p>
                  <p className="text-xs text-stone">{formatShortDate(note.createdAt, locale)}</p>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-accent">{note.teacher.user.fullName}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink">{note.content}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

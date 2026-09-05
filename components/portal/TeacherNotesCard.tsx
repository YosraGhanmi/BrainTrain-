import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import type { Prisma } from '@prisma/client';

type NoteWithRelations = Prisma.TeacherNoteGetPayload<{
  include: { teacher: { include: { user: true } }; courseSession: true };
}>;

export default function TeacherNotesCard({ notes }: { notes: NoteWithRelations[] }) {
  return (
    <div className="flex-1 rounded-3xl border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="text-base font-semibold text-ink">Teacher notes</h2>

      {notes.length === 0 ? (
        <p className="mt-6 text-sm text-stone">No notes yet.</p>
      ) : (
        <ul className="mt-4 max-h-[22rem] space-y-3 overflow-y-auto pr-1">
          {notes.map((note) => {
            const course = getCourseEntryOrThrow(note.courseSession.courseSlug);
            return (
              <li key={note.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-ink">{course.title.en}</p>
                  <p className="text-xs text-stone">{note.createdAt.toDateString()}</p>
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

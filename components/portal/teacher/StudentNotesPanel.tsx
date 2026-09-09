import type { AppLocale } from '@/i18n/routing';

type Note = {
  id: string;
  content: string;
  createdAt: string;
};

export default function StudentNotesPanel({
  notes,
  addNote,
  locale,
  childId,
  courseSessionId,
  returnTo,
}: {
  notes: Note[];
  addNote: (formData: FormData) => Promise<void>;
  locale: AppLocale;
  childId: string;
  courseSessionId: string;
  returnTo: string;
}) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">Notes</h2>

      <form action={addNote} className="mt-4 space-y-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="childId" value={childId} />
        <input type="hidden" name="courseSessionId" value={courseSessionId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <textarea
          name="content"
          required
          rows={3}
          placeholder="Write a note for this student..."
          className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
        >
          Add note
        </button>
      </form>

      {notes.length > 0 ? (
        <ul className="mt-5 max-h-96 space-y-3 overflow-y-auto border-t border-ink/10 pt-4">
          {notes.map((note) => (
            <li key={note.id} className="rounded-xl bg-slate-50 p-3">
              <p className="whitespace-pre-wrap text-sm text-ink">{note.content}</p>
              <p className="mt-1 text-xs text-stone">{note.createdAt}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-stone">No notes yet.</p>
      )}
    </div>
  );
}

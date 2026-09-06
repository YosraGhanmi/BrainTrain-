'use client';

import { useState } from 'react';
import { MoreHorizontal, User } from 'lucide-react';
import InitialsAvatar from './InitialsAvatar';

type Note = { id: string; content: string; createdAt: string };

export default function NotesList({ notes, teacherName }: { notes: Note[]; teacherName: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? notes : notes.slice(0, 2);

  return (
    <div>
      {notes.length > 2 ? (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-bold text-accent hover:underline"
          >
            {expanded ? 'Show less' : 'View all'}
          </button>
        </div>
      ) : null}
      <ul className="space-y-3">
        {visible.map((note) => (
          <li key={note.id} className="flex gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-soft">
            {teacherName ? (
              <InitialsAvatar name={teacherName} />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/5">
                <User className="h-4 w-4 text-stone" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="font-bold text-ink">{teacherName ?? 'Teacher'}</p>
                  <p className="text-xs text-stone">{note.createdAt}</p>
                </div>
                <MoreHorizontal className="h-4 w-4 shrink-0 text-stone/40" />
              </div>
              <p className="mt-1 text-sm text-ink/80">{note.content}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

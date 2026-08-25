import { Mail, MailOpen } from 'lucide-react';
import { readMessages } from '@/lib/messages/store';
import { markMessageRead, deleteMessage } from '@/lib/admin/actions';
import DeleteIconButton from '@/components/admin/DeleteIconButton';

export const dynamic = 'force-dynamic';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminMessagesPage() {
  const messages = readMessages();

  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">Messages</h1>

      {messages.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-ink/20 bg-white p-10 text-center text-sm text-stone">
          No messages yet.
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`relative rounded-2xl border bg-white p-6 shadow-soft transition ${
                m.read ? 'border-ink/10' : 'border-accent/30'
              }`}
            >
              {!m.read ? <span className="absolute left-0 top-6 h-2 w-2 -translate-x-[5px] rounded-full bg-accent" /> : null}

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base font-semibold text-ink">{m.name}</p>
                  <a href={`mailto:${m.email}`} className="text-sm text-accent hover:underline">
                    {m.email}
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-stone/70">{formatDate(m.createdAt)}</span>
                  <form action={markMessageRead.bind(null, m.id, !m.read)}>
                    <button
                      type="submit"
                      aria-label={m.read ? 'Mark as unread' : 'Mark as read'}
                      className="flex items-center justify-center rounded-lg border border-ink/10 p-1.5 text-ink/50 transition hover:bg-slate-100 hover:text-ink"
                    >
                      {m.read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </button>
                  </form>
                  <DeleteIconButton action={deleteMessage.bind(null, m.id)} />
                </div>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

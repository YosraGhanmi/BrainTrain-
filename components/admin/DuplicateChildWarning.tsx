'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { checkChildDuplicates, type DuplicateHit } from '@/lib/admin/children-actions';
import { DUPLICATE_REASON_LABELS } from '@/lib/children/duplicates';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { timeZone: 'UTC' });

// Watches the form's fullName and dateOfBirth fields and lists children who
// may be the same one already registered. Only a warning: the form still
// submits.
export default function DuplicateChildWarning({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hits, setHits] = useState<DuplicateHit[]>([]);

  useEffect(() => {
    const form = ref.current?.closest('form');
    if (!form) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let latest = 0;

    const check = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const data = new FormData(form);
        const fullName = String(data.get('fullName') ?? '').trim();
        const dateOfBirth = String(data.get('dateOfBirth') ?? '');
        const call = ++latest;
        if (fullName.length < 2) {
          setHits([]);
          return;
        }
        try {
          const result = await checkChildDuplicates({ fullName, dateOfBirth });
          // An older answer arriving late must not replace a newer one
          if (call === latest) setHits(result);
        } catch {
          // The check is a convenience; the form works without it
        }
      }, 400);
    };

    const onChange = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      if (target?.name === 'fullName' || target?.name === 'dateOfBirth') check();
    };
    form.addEventListener('input', onChange);
    form.addEventListener('change', onChange);
    return () => {
      clearTimeout(timer);
      form.removeEventListener('input', onChange);
      form.removeEventListener('change', onChange);
    };
  }, []);

  return (
    <div ref={ref} aria-live="polite" className={className}>
      {hits.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p className="flex items-center gap-2 font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            This child may already be registered
          </p>
          <ul className="mt-2 space-y-1.5">
            {hits.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-x-2 text-amber-900">
                <a
                  href={`/admin/children/${h.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
                >
                  {h.fullName}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <span className="text-amber-800/80">
                  {h.dateOfBirth ? `born ${formatDate(h.dateOfBirth)}` : 'no date of birth'} · {DUPLICATE_REASON_LABELS[h.reason]}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-800/80">
            Check before going on. If it&apos;s a brother or sister, link them in the Parents step.
          </p>
        </div>
      ) : null}
    </div>
  );
}

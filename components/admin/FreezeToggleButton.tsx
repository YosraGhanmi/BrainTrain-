'use client';

import { useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Snowflake, Play } from 'lucide-react';

export default function FreezeToggleButton({
  action,
  isFrozen,
  className = '',
}: {
  action: (formData: FormData) => void;
  isFrozen: boolean;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className={className}>
      <FreezeButton isFrozen={isFrozen} onRequestSubmit={() => formRef.current?.requestSubmit()} />
    </form>
  );
}

function FreezeButton({ isFrozen, onRequestSubmit }: { isFrozen: boolean; onRequestSubmit: () => void }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="button"
      aria-label={isFrozen ? 'Activate account' : 'Freeze account'}
      title={isFrozen ? 'Activate account' : 'Freeze account'}
      aria-busy={pending}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        onRequestSubmit();
      }}
      className={
        isFrozen
          ? 'flex items-center justify-center rounded-lg border border-emerald-200 p-1.5 text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-70'
          : 'flex items-center justify-center rounded-lg border border-amber-200 p-1.5 text-amber-600 transition hover:bg-amber-50 disabled:cursor-wait disabled:opacity-70'
      }
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isFrozen ? <Play className="h-4 w-4" /> : <Snowflake className="h-4 w-4" />}
    </button>
  );
}

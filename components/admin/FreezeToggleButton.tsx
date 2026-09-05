'use client';

import { useRef } from 'react';
import { Snowflake, Play } from 'lucide-react';

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
      <button
        type="button"
        aria-label={isFrozen ? 'Activate account' : 'Freeze account'}
        title={isFrozen ? 'Activate account' : 'Freeze account'}
        onClick={(e) => {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }}
        className={
          isFrozen
            ? 'flex items-center justify-center rounded-lg border border-emerald-200 p-1.5 text-emerald-600 transition hover:bg-emerald-50'
            : 'flex items-center justify-center rounded-lg border border-amber-200 p-1.5 text-amber-600 transition hover:bg-amber-50'
        }
      >
        {isFrozen ? <Play className="h-4 w-4" /> : <Snowflake className="h-4 w-4" />}
      </button>
    </form>
  );
}

'use client';

import { useRef } from 'react';
import { KeyRound } from 'lucide-react';

export default function RegenerateCodeButton({
  action,
  className = '',
}: {
  action: (formData: FormData) => void;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className={className}>
      <button
        type="button"
        aria-label="Regenerate secret code"
        title="Regenerate secret code"
        onClick={(e) => {
          e.preventDefault();
          if (confirm("Issue a new 4-digit secret code? The teacher's current code will stop working.")) {
            formRef.current?.requestSubmit();
          }
        }}
        className="flex items-center justify-center rounded-lg border border-accent/20 p-1.5 text-accent transition hover:bg-accent/5"
      >
        <KeyRound className="h-4 w-4" />
      </button>
    </form>
  );
}

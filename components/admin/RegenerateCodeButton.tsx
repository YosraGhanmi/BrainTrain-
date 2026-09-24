'use client';

import { useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { KeyRound, Loader2 } from 'lucide-react';

export default function RegenerateCodeButton({
  action,
  className = '',
  confirmMessage = "Issue a new 4-digit secret code? The teacher's current code will stop working.",
}: {
  action: (formData: FormData) => void;
  className?: string;
  confirmMessage?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className={className}>
      <RegenerateButton confirmMessage={confirmMessage} onRequestSubmit={() => formRef.current?.requestSubmit()} />
    </form>
  );
}

function RegenerateButton({ confirmMessage, onRequestSubmit }: { confirmMessage: string; onRequestSubmit: () => void }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="button"
      aria-label="Regenerate secret code"
      title="Regenerate secret code"
      aria-busy={pending}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        if (confirm(confirmMessage)) {
          onRequestSubmit();
        }
      }}
      className="flex items-center justify-center rounded-lg border border-accent/20 p-1.5 text-accent transition hover:bg-accent/5 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
    </button>
  );
}

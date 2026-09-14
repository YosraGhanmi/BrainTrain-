'use client';

import { useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Trash2 } from 'lucide-react';

export default function DeleteIconButton({
  action,
  className = '',
}: {
  action: (formData: FormData) => void;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className={className}>
      <DeleteButton onRequestSubmit={() => formRef.current?.requestSubmit()} />
    </form>
  );
}

function DeleteButton({ onRequestSubmit }: { onRequestSubmit: () => void }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="button"
      aria-label="Delete"
      aria-busy={pending}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        onRequestSubmit();
      }}
      className="flex items-center justify-center rounded-lg border border-red-200 p-1.5 text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}

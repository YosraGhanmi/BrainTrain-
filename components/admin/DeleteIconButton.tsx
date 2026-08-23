'use client';

import { useRef } from 'react';
import { Trash2 } from 'lucide-react';

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
      <button
        type="button"
        aria-label="Delete"
        onClick={(e) => {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }}
        className="flex items-center justify-center rounded-lg border border-red-200 p-1.5 text-red-600 transition hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}

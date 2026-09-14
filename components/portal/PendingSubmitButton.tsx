'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

type PendingSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel?: ReactNode;
  spinnerClassName?: string;
};

export default function PendingSubmitButton({
  children,
  pendingLabel,
  className = '',
  disabled,
  spinnerClassName = 'h-4 w-4',
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = Boolean(disabled || pending);

  return (
    <button
      {...props}
      type="submit"
      disabled={isDisabled}
      aria-busy={pending}
      className={`${className} disabled:cursor-wait disabled:opacity-70`}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 className={`${spinnerClassName} animate-spin`} aria-hidden="true" />
          {pendingLabel ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

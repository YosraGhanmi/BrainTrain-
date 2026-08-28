'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({
  name,
  placeholder = '••••••••',
  autoComplete,
}: {
  name: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? 'text' : 'password'}
        required
        minLength={8}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3.5 pr-12 text-base text-ink outline-none transition focus:border-accent"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone transition hover:text-ink"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

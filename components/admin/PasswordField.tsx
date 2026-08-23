'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id="password"
        name="password"
        type={visible ? 'text' : 'password'}
        required
        className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-4 pr-12 text-base text-ink outline-none transition focus:border-accent"
        placeholder="••••••••"
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

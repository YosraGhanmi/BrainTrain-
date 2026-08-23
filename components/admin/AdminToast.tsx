'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';

const MESSAGES: Record<string, string> = {
  saved: 'Saved successfully.',
  error: 'Something went wrong. Please try again.',
};

function AdminToastInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = searchParams.get('saved') ? 'saved' : searchParams.get('error') ? 'error' : null;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!status) return;
    setVisible(true);

    const hide = setTimeout(() => setVisible(false), 3000);
    const clean = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('saved');
      params.delete('error');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 3200);

    return () => {
      clearTimeout(hide);
      clearTimeout(clean);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (!status) return null;

  const isSuccess = status === 'saved';

  return (
    <div
      className={`fixed right-6 top-6 z-50 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      } ${isSuccess ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}
    >
      {isSuccess ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
      {MESSAGES[status]}
    </div>
  );
}

export default function AdminToast() {
  return (
    <Suspense fallback={null}>
      <AdminToastInner />
    </Suspense>
  );
}

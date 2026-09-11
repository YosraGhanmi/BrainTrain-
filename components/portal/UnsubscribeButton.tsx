'use client';

import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function UnsubscribeButton() {
  const t = useTranslations('parentPortal.courseEnrollment');
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(t('unsubscribeConfirm'))) {
          e.preventDefault();
        }
      }}
      className="flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
    >
      <LogOut className="h-3.5 w-3.5" />
      {t('leaveCourse')}
    </button>
  );
}

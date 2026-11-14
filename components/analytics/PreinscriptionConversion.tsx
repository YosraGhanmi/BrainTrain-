'use client';

import { useEffect } from 'react';
import { GA_EVENTS, trackEvent } from '@/lib/analytics/ga';

// On the "request sent" screen. `submissionId` is the token the server puts
// in the URL after saving a pre-registration: each one is reported once, so
// reloading the confirmation page doesn't count a second conversion.
export default function PreinscriptionConversion({ submissionId }: { submissionId: string }) {
  useEffect(() => {
    const key = `ga-preinscription-${submissionId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Storage blocked: report anyway rather than lose the conversion
    }
    trackEvent(GA_EVENTS.preinscription, { form_name: 'preinscription' });
  }, [submissionId]);

  return null;
}

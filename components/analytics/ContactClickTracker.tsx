'use client';

import { useEffect } from 'react';
import { GA_EVENTS, trackEvent } from '@/lib/analytics/ga';

const WHATSAPP_LINK = /^(https?:\/\/(wa\.me|(api|web|chat)\.whatsapp\.com)\/|whatsapp:)/i;

// Reports clicks on any phone (tel:) or WhatsApp link, wherever it is on the
// page, so a link added later is counted without touching this file. The
// number itself is never sent, only where on the site the click happened.
export default function ContactClickTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      const href = link?.getAttribute('href') ?? '';
      if (/^tel:/i.test(href)) trackEvent(GA_EVENTS.phoneClick);
      else if (WHATSAPP_LINK.test(href)) trackEvent(GA_EVENTS.whatsappClick);
    };
    // Capture phase: still seen when a component stops the click from bubbling
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}

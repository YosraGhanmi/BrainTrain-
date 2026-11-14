// Google Analytics 4. The measurement ID is set in the admin panel
// (Contact > Google Analytics) and the tag itself is in app/[locale]/layout.tsx.

// The ID ends up inside an inline script, so anything that isn't a plain
// "G-XXXXXXXXXX" is refused rather than escaped.
const GA_ID_PATTERN = /^G-[A-Z0-9]{4,20}$/;

// '' when the value isn't a measurement ID (which turns the tag off)
export function normalizeGaId(value: unknown): string {
  const id = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return GA_ID_PATTERN.test(id) ? id : '';
}

// Event names as they appear in Google Analytics. generate_lead is GA4's own
// name for a submitted lead form; it is the one to mark as a key event.
export const GA_EVENTS = {
  preinscription: 'generate_lead',
  phoneClick: 'phone_click',
  whatsappClick: 'whatsapp_click',
} as const;

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

// Does nothing when the tag isn't on the page (no ID set, or not production)
export function trackEvent(name: string, params: Record<string, string | number> = {}): void {
  if (typeof window === 'undefined') return;
  (window as GtagWindow).gtag?.('event', name, params);
}

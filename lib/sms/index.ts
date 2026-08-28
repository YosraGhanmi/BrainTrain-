import type { SmsProvider } from './provider';
import { TwilioSmsProvider } from './twilio-provider';

let cached: SmsProvider | null = null;

// Dispatches on SMS_PROVIDER so a new vendor only needs a new *-provider.ts
// implementing SmsProvider plus a case here — nothing else in the app
// (reminders, OTP) needs to change.
export function getSmsProvider(): SmsProvider {
  if (cached) return cached;
  const providerName = (process.env.SMS_PROVIDER ?? 'twilio').toLowerCase();
  switch (providerName) {
    case 'twilio':
      cached = new TwilioSmsProvider();
      return cached;
    default:
      throw new Error(`Unknown SMS_PROVIDER "${providerName}"`);
  }
}

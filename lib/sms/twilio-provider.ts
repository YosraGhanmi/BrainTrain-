import twilio from 'twilio';
import type { SmsProvider, SmsSendResult } from './provider';

export class TwilioSmsProvider implements SmsProvider {
  readonly name = 'twilio';
  private client: ReturnType<typeof twilio>;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER must be set to use the Twilio SMS provider.');
    }
    this.client = twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
  }

  async send(to: string, body: string): Promise<SmsSendResult> {
    const message = await this.client.messages.create({ to, from: this.fromNumber, body });
    return { providerMessageId: message.sid };
  }
}

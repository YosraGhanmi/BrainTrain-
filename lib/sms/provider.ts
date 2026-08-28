export interface SmsSendResult {
  providerMessageId: string;
}

// Provider abstraction so the SMS vendor can be swapped (see lib/sms/index.ts)
// without touching call sites in lib/payments or lib/portal-auth.
export interface SmsProvider {
  readonly name: string;
  send(to: string, body: string): Promise<SmsSendResult>;
}

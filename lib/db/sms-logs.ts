import { prisma } from '@/lib/db/prisma';

export type SmsPurpose = 'PAYMENT_REMINDER' | 'PASSWORD_RESET' | 'ENROLLMENT_APPROVED';
export type SmsStatus = 'QUEUED' | 'SENT' | 'FAILED';

type SmsLogInput = {
  parentId: string;
  phone: string;
  message: string;
  purpose: SmsPurpose;
  provider: string;
  providerMessageId?: string;
  relatedPaymentId?: string;
};

async function logSms(params: SmsLogInput, status: SmsStatus): Promise<void> {
  await prisma.smsNotification.create({
    data: {
      parentId: params.parentId || null,
      phone: params.phone,
      message: params.message,
      purpose: params.purpose,
      status,
      provider: params.provider,
      providerMessageId: params.providerMessageId ?? null,
      relatedPaymentId: params.relatedPaymentId ?? null,
    },
  });
}

export async function logSmsSent(params: SmsLogInput): Promise<void> {
  await logSms(params, 'SENT');
}

export async function logSmsFailed(params: Omit<SmsLogInput, 'providerMessageId'>): Promise<void> {
  await logSms(params, 'FAILED');
}

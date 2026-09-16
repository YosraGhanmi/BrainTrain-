import { FieldValue } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebase/admin';

export type SmsPurpose = 'PAYMENT_REMINDER' | 'PASSWORD_RESET' | 'ENROLLMENT_APPROVED';
export type SmsStatus = 'QUEUED' | 'SENT' | 'FAILED';

const col = () => firestore.collection('sms_notifications');

export async function logSmsSent(params: {
  parentId: string;
  phone: string;
  message: string;
  purpose: SmsPurpose;
  provider: string;
  providerMessageId?: string;
  relatedPaymentId?: string;
}): Promise<void> {
  await col().add({
    parentId: params.parentId,
    phone: params.phone,
    message: params.message,
    purpose: params.purpose,
    status: 'SENT' as SmsStatus,
    provider: params.provider,
    providerMessageId: params.providerMessageId ?? null,
    relatedPaymentId: params.relatedPaymentId ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function logSmsFailed(params: {
  parentId: string;
  phone: string;
  message: string;
  purpose: SmsPurpose;
  provider: string;
  relatedPaymentId?: string;
}): Promise<void> {
  await col().add({
    parentId: params.parentId,
    phone: params.phone,
    message: params.message,
    purpose: params.purpose,
    status: 'FAILED' as SmsStatus,
    provider: params.provider,
    providerMessageId: null,
    relatedPaymentId: params.relatedPaymentId ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
}

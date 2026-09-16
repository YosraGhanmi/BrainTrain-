import { getSmsProvider } from './index';
import { logSmsSent, logSmsFailed } from '@/lib/firebase/sms-logs';
import type { SmsPurpose } from '@/lib/firebase/sms-logs';

export async function sendSms(params: {
  parentId: string;
  phone: string;
  message: string;
  purpose: SmsPurpose;
  relatedPaymentId?: string;
}): Promise<void> {
  const provider = getSmsProvider();
  try {
    const result = await provider.send(params.phone, params.message);
    await logSmsSent({
      parentId: params.parentId,
      phone: params.phone,
      message: params.message,
      purpose: params.purpose,
      provider: provider.name,
      providerMessageId: result.providerMessageId,
      relatedPaymentId: params.relatedPaymentId,
    });
  } catch (err) {
    await logSmsFailed({
      parentId: params.parentId,
      phone: params.phone,
      message: params.message,
      purpose: params.purpose,
      provider: provider.name,
      relatedPaymentId: params.relatedPaymentId,
    });
    throw err;
  }
}

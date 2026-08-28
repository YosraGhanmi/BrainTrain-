import { prisma } from '@/lib/db/prisma';
import { getSmsProvider } from './index';
import type { SmsPurpose } from '@prisma/client';

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
    await prisma.sMSNotification.create({
      data: {
        parentId: params.parentId,
        phone: params.phone,
        message: params.message,
        purpose: params.purpose,
        status: 'SENT',
        provider: provider.name,
        providerMessageId: result.providerMessageId,
        relatedPaymentId: params.relatedPaymentId,
      },
    });
  } catch (err) {
    await prisma.sMSNotification.create({
      data: {
        parentId: params.parentId,
        phone: params.phone,
        message: params.message,
        purpose: params.purpose,
        status: 'FAILED',
        provider: getSmsProvider().name,
        relatedPaymentId: params.relatedPaymentId,
      },
    });
    throw err;
  }
}

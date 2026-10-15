'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireAdminOnly } from '@/lib/admin/guard';
import { createDbEarning, deleteDbEarning } from '@/lib/db/earnings';
import { createDbNotification } from '@/lib/db/notifications';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

export async function createEarning(formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const label = field(formData, 'label');
  const amountRaw = field(formData, 'amount');
  const currency = field(formData, 'currency') || 'TND';
  const note = field(formData, 'note');
  const dateRaw = field(formData, 'date');

  const amount = Number(amountRaw);
  if (!label || !Number.isFinite(amount) || amount <= 0) {
    redirect('/admin/earnings?error=1');
  }

  const createdByName = session.kind === 'admin' ? 'Admin' : session.fullName;

  await createDbEarning({
    label,
    amount,
    currency,
    note: note || null,
    date: dateRaw ? new Date(dateRaw) : new Date(),
    createdByName,
    createdByRole: session.kind === 'admin' ? 'ADMIN' : 'SECRETARY',
  });

  // Notify admin when a secretary logs an earning
  if (session.kind === 'secretary') {
    await createDbNotification({
      type: 'EARNING_ADDED',
      title: `${session.fullName} logged an earning`,
      body: `${label}: ${amount.toFixed(2)} ${currency}`,
      link: '/admin/earnings',
    });
  }

  revalidatePath('/admin/earnings');
  revalidatePath('/admin');
  redirect('/admin/earnings?saved=1');
}

export async function deleteEarning(id: string): Promise<void> {
  await requireAdminOnly();
  await deleteDbEarning(id);
  revalidatePath('/admin/earnings');
  revalidatePath('/admin');
}

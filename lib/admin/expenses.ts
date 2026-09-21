'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireAdminOnly } from '@/lib/admin/guard';
import { createFirebaseExpense, deleteFirebaseExpense } from '@/lib/firebase/expenses';
import { createFirebaseNotification } from '@/lib/firebase/notifications';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

export async function createExpense(formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const label = field(formData, 'label');
  const amountRaw = field(formData, 'amount');
  const currency = field(formData, 'currency') || 'TND';
  const category = field(formData, 'category');
  const note = field(formData, 'note');
  const dateRaw = field(formData, 'date');
  const chargeType = field(formData, 'chargeType') === 'FIXED' ? 'FIXED' : 'VARIABLE';

  const amount = Number(amountRaw);
  if (!label || !Number.isFinite(amount) || amount <= 0) {
    redirect('/admin/dispenses?error=1');
  }

  const createdByName = session.kind === 'admin' ? 'Admin' : session.fullName;

  await createFirebaseExpense({
    label,
    amount,
    currency,
    category: category || null,
    note: note || null,
    date: dateRaw ? new Date(dateRaw) : new Date(),
    chargeType,
    createdByName,
    createdByRole: session.kind === 'admin' ? 'ADMIN' : 'SECRETARY',
  });

  // Notify admin when a secretary logs an expense
  if (session.kind === 'secretary') {
    await createFirebaseNotification({
      type: 'EXPENSE_ADDED',
      title: `${session.fullName} logged a dispense`,
      body: `${label} — ${amount.toFixed(2)} ${currency}`,
      link: '/admin/dispenses',
    });
  }

  revalidatePath('/admin/dispenses');
  revalidatePath('/admin');
  redirect('/admin/dispenses?saved=1');
}

export async function deleteExpense(id: string): Promise<void> {
  await requireAdminOnly();
  await deleteFirebaseExpense(id);
  revalidatePath('/admin/dispenses');
  revalidatePath('/admin');
}

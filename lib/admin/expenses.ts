'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireAdminOnly } from '@/lib/admin/guard';
import { createDbExpense, deleteDbExpense, type ExpenseChargeType } from '@/lib/db/expenses';
import { createDbNotification } from '@/lib/db/notifications';

function dispensePath(chargeType: ExpenseChargeType): string {
  return chargeType === 'FIXED' ? '/admin/dispenses/fixed' : '/admin/dispenses/variable';
}

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

export async function createExpense(formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const label = field(formData, 'label');
  const amountRaw = field(formData, 'amount');
  const currency = field(formData, 'currency') || 'TND';
  const note = field(formData, 'note');
  const dateRaw = field(formData, 'date');
  const chargeType = field(formData, 'chargeType') === 'FIXED' ? 'FIXED' : 'VARIABLE';
  const pagePath = dispensePath(chargeType);

  const amount = Number(amountRaw);
  if (!label || !Number.isFinite(amount) || amount <= 0) {
    redirect(`${pagePath}?error=1`);
  }

  const createdByName = session.kind === 'admin' ? 'Admin' : session.fullName;

  await createDbExpense({
    label,
    amount,
    currency,
    note: note || null,
    date: dateRaw ? new Date(dateRaw) : new Date(),
    chargeType,
    createdByName,
    createdByRole: session.kind === 'admin' ? 'ADMIN' : 'SECRETARY',
  });

  // Notify admin when a secretary logs an expense
  if (session.kind === 'secretary') {
    await createDbNotification({
      type: 'EXPENSE_ADDED',
      title: `${session.fullName} logged a dispense`,
      body: `${label}: ${amount.toFixed(2)} ${currency}`,
      link: pagePath,
    });
  }

  revalidatePath(pagePath);
  revalidatePath('/admin');
  redirect(`${pagePath}?saved=1`);
}

export async function deleteExpense(id: string): Promise<void> {
  await requireAdminOnly();
  await deleteDbExpense(id);
  revalidatePath('/admin/dispenses/fixed');
  revalidatePath('/admin/dispenses/variable');
  revalidatePath('/admin');
}

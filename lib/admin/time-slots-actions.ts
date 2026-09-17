'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdminOnly } from '@/lib/admin/guard';
import { createFirebaseTimeSlot, deleteFirebaseTimeSlot, updateFirebaseTimeSlot } from '@/lib/firebase/time-slots';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

export async function upsertTimeSlot(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const id = field(formData, 'id');
  const label = field(formData, 'label');
  const dayOfWeek = Number(formData.get('dayOfWeek'));
  const startTime = field(formData, 'startTime');
  const endTime = field(formData, 'endTime');

  if (!label || Number.isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6 || !startTime || !endTime || startTime >= endTime) {
    redirect('/admin/time-slots?error=1');
  }

  try {
    if (id) {
      await updateFirebaseTimeSlot(id, { label, dayOfWeek, startTime, endTime });
    } else {
      await createFirebaseTimeSlot({ label, dayOfWeek, startTime, endTime });
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'LABEL_TAKEN') {
      redirect('/admin/time-slots?error=duplicate');
    }
    throw err;
  }

  revalidatePath('/admin/time-slots');
  revalidatePath('/admin/sessions');
  redirect('/admin/time-slots?saved=1');
}

export async function deleteTimeSlot(id: string): Promise<void> {
  await requireAdminOnly();
  await deleteFirebaseTimeSlot(id);
  revalidatePath('/admin/time-slots');
  revalidatePath('/admin/sessions');
  redirect('/admin/time-slots?saved=1');
}

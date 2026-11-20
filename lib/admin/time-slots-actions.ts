'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/guard';
import {
  createDbTimeSlot,
  deleteDbTimeSlot,
  restoreDbDefaultTimeSlots,
  setDbRamadanTimetableActive,
  updateDbTimeSlot,
} from '@/lib/db/time-slots';
import { DEFAULT_RAMADAN_TIME_SLOTS, DEFAULT_TIME_SLOTS } from '@/lib/scheduling/slots';

// Admin and Reception both manage the timetable

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

// Every page that shows when a group meets
function revalidateSchedules(): void {
  revalidatePath('/admin/time-slots');
  revalidatePath('/admin/sessions');
  revalidatePath('/admin/timetable');
  revalidatePath('/[locale]/parent-portal', 'layout');
  revalidatePath('/[locale]/teacher', 'layout');
}

export async function upsertTimeSlot(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = field(formData, 'id');
  const label = field(formData, 'label');
  const ramadan = field(formData, 'ramadan') === '1';
  const dayOfWeek = Number(formData.get('dayOfWeek'));
  const startTime = field(formData, 'startTime');
  const endTime = field(formData, 'endTime');

  if (!label || Number.isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6 || !startTime || !endTime || startTime >= endTime) {
    redirect('/admin/time-slots?error=1');
  }

  try {
    if (id) {
      await updateDbTimeSlot(id, { label, dayOfWeek, startTime, endTime });
    } else {
      await createDbTimeSlot({ label, ramadan, dayOfWeek, startTime, endTime });
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'LABEL_TAKEN') {
      redirect('/admin/time-slots?error=duplicate');
    }
    throw err;
  }

  revalidateSchedules();
  redirect('/admin/time-slots?saved=1');
}

export async function deleteTimeSlot(id: string): Promise<void> {
  await requireAdmin();
  await deleteDbTimeSlot(id);
  revalidateSchedules();
  redirect('/admin/time-slots?saved=1');
}

export async function restoreDefaultTimeSlots(ramadan: boolean): Promise<void> {
  await requireAdmin();
  await restoreDbDefaultTimeSlots(ramadan, ramadan ? DEFAULT_RAMADAN_TIME_SLOTS : DEFAULT_TIME_SLOTS);
  revalidateSchedules();
  redirect('/admin/time-slots?saved=1');
}

export async function setRamadanTimetable(active: boolean): Promise<void> {
  await requireAdmin();
  await setDbRamadanTimetableActive(active);
  revalidateSchedules();
  redirect('/admin/time-slots?saved=1');
}

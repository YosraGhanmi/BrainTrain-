'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireAdminOnly } from '@/lib/admin/guard';

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
      await prisma.timeSlot.update({ where: { id }, data: { label, dayOfWeek, startTime, endTime } });
    } else {
      await prisma.timeSlot.create({ data: { label, dayOfWeek, startTime, endTime } });
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
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
  await prisma.timeSlot.delete({ where: { id } });
  revalidatePath('/admin/time-slots');
  revalidatePath('/admin/sessions');
  redirect('/admin/time-slots?saved=1');
}

'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireTeacher, localizedPath } from '@/lib/portal-auth/guard';
import { isValidStickerUrl } from '@/lib/badges/stickers';
import type { AppLocale } from '@/i18n/routing';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function getLocale(formData: FormData): AppLocale {
  return field(formData, 'locale') === 'fr' ? 'fr' : 'en';
}

export async function addTeacherNote(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const teacher = await requireTeacher(locale);

  const childId = field(formData, 'childId');
  const courseSessionId = field(formData, 'courseSessionId');
  const content = field(formData, 'content');

  const fail = () => redirect(localizedPath(locale, `/teacher/sessions/${courseSessionId}?error=1`));
  if (!content) fail();

  const session = await prisma.courseSession.findUnique({ where: { id: courseSessionId } });
  if (!session || session.teacherId !== teacher.teacherId) {
    redirect(localizedPath(locale, '/teacher?error=1'));
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { childId_courseSessionId: { childId, courseSessionId } },
  });
  if (!enrollment) fail();

  await prisma.teacherNote.create({
    data: { teacherId: teacher.teacherId, childId, courseSessionId, enrollmentId: enrollment!.id, content },
  });

  redirect(localizedPath(locale, `/teacher/sessions/${courseSessionId}?saved=1`));
}

const BADGE_EMOJIS = ['🏅', '⭐', '🏆', '🚀', '🧠', '🔥', '🎯', '💡'];

export async function awardBadge(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const teacher = await requireTeacher(locale);

  const childId = field(formData, 'childId');
  const courseSessionId = field(formData, 'courseSessionId');
  const title = field(formData, 'title');
  const note = field(formData, 'note');
  const stickerUrl = field(formData, 'imageUrl');
  const imageUrl = isValidStickerUrl(stickerUrl) ? stickerUrl : null;
  const emoji = BADGE_EMOJIS.includes(field(formData, 'emoji')) ? field(formData, 'emoji') : BADGE_EMOJIS[0];

  const fail = () => redirect(localizedPath(locale, `/teacher/sessions/${courseSessionId}?badgeError=1`));
  if (!title) fail();

  const session = await prisma.courseSession.findUnique({ where: { id: courseSessionId } });
  if (!session || session.teacherId !== teacher.teacherId) {
    redirect(localizedPath(locale, '/teacher?error=1'));
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { childId_courseSessionId: { childId, courseSessionId } },
  });
  if (!enrollment) fail();

  await prisma.badge.create({
    data: { teacherId: teacher.teacherId, childId, title, note: note || null, emoji, imageUrl },
  });

  redirect(localizedPath(locale, `/teacher/sessions/${courseSessionId}?badgeSaved=1`));
}

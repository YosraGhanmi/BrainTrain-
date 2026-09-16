'use server';

import { redirect } from 'next/navigation';
import { requireTeacher, localizedPath } from '@/lib/portal-auth/guard';
import { isValidStickerUrl } from '@/lib/badges/stickers';
import { createFirebaseTeacherNote } from '@/lib/firebase/teacher-notes';
import { createFirebaseBadge } from '@/lib/firebase/badges';
import { getFirebaseCourseSession } from '@/lib/firebase/sessions';
import { firestore } from '@/lib/firebase/admin';
import type { AppLocale } from '@/i18n/routing';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function getLocale(formData: FormData): AppLocale {
  return field(formData, 'locale') === 'fr' ? 'fr' : 'en';
}

function returnPath(formData: FormData, courseSessionId: string, childId: string): string {
  return field(formData, 'returnTo') || `/teacher/sessions/${courseSessionId}/students/${childId}`;
}

export async function addTeacherNote(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const teacher = await requireTeacher(locale);

  const childId = field(formData, 'childId');
  const courseSessionId = field(formData, 'courseSessionId');
  const content = field(formData, 'content');
  const back = returnPath(formData, courseSessionId, childId);

  const fail = () => redirect(localizedPath(locale, `${back}?error=1`));
  if (!content) fail();

  const session = await getFirebaseCourseSession(courseSessionId);
  if (!session || session.teacherId !== teacher.teacherId) {
    redirect(localizedPath(locale, '/teacher?error=1'));
  }

  // Find the enrollment for this child+session pair
  const enrollmentSnap = await firestore
    .collection('enrollments')
    .where('childId', '==', childId)
    .where('courseSessionId', '==', courseSessionId)
    .limit(1)
    .get();
  if (enrollmentSnap.empty) fail();

  const enrollmentId = enrollmentSnap.docs[0].id;
  await createFirebaseTeacherNote({
    teacherId: teacher.teacherId,
    childId,
    courseSessionId,
    enrollmentId,
    content,
  });

  redirect(localizedPath(locale, `${back}?saved=1`));
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
  const back = returnPath(formData, courseSessionId, childId);

  const fail = () => redirect(localizedPath(locale, `${back}?badgeError=1`));
  if (!title) fail();

  const session = await getFirebaseCourseSession(courseSessionId);
  if (!session || session.teacherId !== teacher.teacherId) {
    redirect(localizedPath(locale, '/teacher?error=1'));
  }

  // Verify child is enrolled in this session
  const enrollmentSnap = await firestore
    .collection('enrollments')
    .where('childId', '==', childId)
    .where('courseSessionId', '==', courseSessionId)
    .limit(1)
    .get();
  if (enrollmentSnap.empty) fail();

  await createFirebaseBadge({
    teacherId: teacher.teacherId,
    childId,
    courseSessionId,
    title,
    note: note || null,
    emoji,
    imageUrl,
  });

  redirect(localizedPath(locale, `${back}?badgeSaved=1`));
}

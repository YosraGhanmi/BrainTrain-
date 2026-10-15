import { prisma } from '@/lib/db/prisma';
import type { TeacherNote } from '@/lib/generated/prisma/client';

export type DbTeacherNote = {
  id: string;
  teacherId: string;
  childId: string;
  courseSessionId: string;
  enrollmentId: string | null;
  content: string;
  createdAt: Date;
};

function mapNote(row: TeacherNote): DbTeacherNote {
  return { ...row, teacherId: row.teacherId ?? '', courseSessionId: row.courseSessionId ?? '' };
}

export async function createDbTeacherNote(input: Omit<DbTeacherNote, 'id' | 'createdAt'>): Promise<string> {
  const row = await prisma.teacherNote.create({
    data: { ...input, teacherId: input.teacherId || null, courseSessionId: input.courseSessionId || null },
  });
  return row.id;
}

export async function listDbTeacherNotesByChild(childId: string): Promise<DbTeacherNote[]> {
  const rows = await prisma.teacherNote.findMany({ where: { childId }, orderBy: { createdAt: 'desc' } });
  return rows.map(mapNote);
}

export async function listDbTeacherNotesByEnrollment(enrollmentId: string): Promise<DbTeacherNote[]> {
  const rows = await prisma.teacherNote.findMany({ where: { enrollmentId }, orderBy: { createdAt: 'asc' } });
  return rows.map(mapNote);
}

export async function listDbTeacherNotesByCourseSession(courseSessionId: string, childId: string): Promise<DbTeacherNote[]> {
  const rows = await prisma.teacherNote.findMany({ where: { courseSessionId, childId }, orderBy: { createdAt: 'asc' } });
  return rows.map(mapNote);
}

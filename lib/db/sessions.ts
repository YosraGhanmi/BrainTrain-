import { prisma } from '@/lib/db/prisma';
import type { CourseSession } from '@/lib/generated/prisma/client';

export type DbCourseSession = {
  id: string;
  courseSlug: string;
  teacherId: string | null;
  dayOfWeek: number;
  // More weekdays this group meets at the same time (summer groups meet
  // e.g. Monday and Wednesday); empty for a regular weekly group
  extraDays: number[];
  // Group name shown instead of the matching time slot's label ("GRP1")
  label: string;
  // Summer school group: only runs during the summer season
  summer: boolean;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  term: string;
  createdAt: Date;
};

export function mapSession(row: CourseSession): DbCourseSession {
  return {
    id: row.id,
    courseSlug: row.courseSlug,
    teacherId: row.teacherId,
    dayOfWeek: row.dayOfWeek,
    extraDays: row.extraDays.filter((d) => d >= 0 && d <= 6),
    label: row.label,
    summer: row.summer,
    startTime: row.startTime,
    endTime: row.endTime,
    location: row.location,
    capacity: row.capacity,
    term: row.term,
    createdAt: row.createdAt,
  };
}

export async function createDbCourseSession(data: Omit<DbCourseSession, 'id' | 'createdAt'>): Promise<string> {
  const row = await prisma.courseSession.create({ data });
  return row.id;
}

export async function updateDbCourseSession(id: string, data: Partial<Omit<DbCourseSession, 'id' | 'createdAt'>>): Promise<void> {
  await prisma.courseSession.update({ where: { id }, data });
}

export async function deleteDbCourseSession(id: string): Promise<void> {
  await prisma.courseSession.delete({ where: { id } });
}

export async function getDbCourseSession(id: string): Promise<DbCourseSession | null> {
  if (!id) return null;
  const row = await prisma.courseSession.findUnique({ where: { id } });
  return row ? mapSession(row) : null;
}

export async function listDbCourseSessions(): Promise<DbCourseSession[]> {
  const rows = await prisma.courseSession.findMany({ orderBy: { courseSlug: 'asc' } });
  return rows.map(mapSession);
}

export async function listDbCourseSessionsByTeacher(teacherId: string): Promise<DbCourseSession[]> {
  const rows = await prisma.courseSession.findMany({ where: { teacherId } });
  return rows.map(mapSession);
}

export async function listDbCourseSessionsByCourses(courseSlugs: string[]): Promise<DbCourseSession[]> {
  if (courseSlugs.length === 0) return [];
  const rows = await prisma.courseSession.findMany({ where: { courseSlug: { in: courseSlugs } } });
  return rows.map(mapSession);
}

export async function listDbCourseSessionsByCourse(courseSlug: string): Promise<DbCourseSession[]> {
  const rows = await prisma.courseSession.findMany({ where: { courseSlug } });
  return rows.map(mapSession);
}

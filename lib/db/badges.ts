import { prisma } from '@/lib/db/prisma';
import type { Badge } from '@/lib/generated/prisma/client';

export type DbBadge = {
  id: string;
  childId: string;
  teacherId: string;
  courseSessionId: string | null;
  title: string;
  note: string | null;
  emoji: string;
  imageUrl: string | null;
  awardedAt: Date;
};

function mapBadge(row: Badge): DbBadge {
  return { ...row, teacherId: row.teacherId ?? '' };
}

export async function createDbBadge(input: Omit<DbBadge, 'id' | 'awardedAt'>): Promise<string> {
  const row = await prisma.badge.create({ data: { ...input, teacherId: input.teacherId || null } });
  return row.id;
}

export async function listDbBadgesByChild(childId: string): Promise<DbBadge[]> {
  const rows = await prisma.badge.findMany({ where: { childId }, orderBy: { awardedAt: 'desc' } });
  return rows.map(mapBadge);
}

export async function listDbBadgesByCourseSession(courseSessionId: string): Promise<DbBadge[]> {
  const rows = await prisma.badge.findMany({ where: { courseSessionId } });
  return rows.map(mapBadge);
}

export async function listDbBadgesForTeacherAndChild(childId: string, teacherId: string): Promise<DbBadge[]> {
  const rows = await prisma.badge.findMany({ where: { childId, teacherId }, orderBy: { awardedAt: 'desc' } });
  return rows.map(mapBadge);
}

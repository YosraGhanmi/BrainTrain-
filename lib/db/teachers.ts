import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/portal-auth/password';
import { parseTeacherCourseSlugs, stringifyTeacherCourseSlugs } from '@/lib/teachers/course-slugs';
import type { Prisma, User } from '@/lib/generated/prisma/client';

// Teachers are rows of the shared users table with role TEACHER. The PIN
// second factor lives on the same row.

export type DbTeacherProfile = {
  id: string;
  email: string;
  phone: string;
  secondaryPhone: string | null;
  fullName: string;
  role: 'TEACHER';
  teacherId: string; // same as id
  // JSON-stringified course slugs assigned to this teacher
  courseSlugs: string;
  teacherSecretCodeHash: string | null;
  teacherSecretCode: string | null; // plaintext, staff-visible in admin panel
  isFrozen: boolean;
  twoFactorEnabled: boolean;
};

function mapTeacher(row: User): DbTeacherProfile {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    secondaryPhone: row.secondaryPhone,
    fullName: row.fullName,
    role: 'TEACHER',
    teacherId: row.id,
    courseSlugs: stringifyTeacherCourseSlugs(row.teacherCourseSlugs),
    teacherSecretCodeHash: row.teacherSecretCodeHash,
    teacherSecretCode: row.teacherSecretCode,
    isFrozen: row.isFrozen,
    twoFactorEnabled: row.twoFactorEnabled,
  };
}

export async function createDbTeacherProfile(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  courseSlugs: string;
  teacherSecretCodeHash: string;
  teacherSecretCode: string;
}): Promise<string> {
  const row = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      phone: input.phone,
      role: 'TEACHER',
      passwordHash: await hashPassword(input.password),
      teacherCourseSlugs: parseTeacherCourseSlugs(input.courseSlugs),
      teacherSecretCodeHash: input.teacherSecretCodeHash,
      teacherSecretCode: input.teacherSecretCode,
    },
  });
  return row.id;
}

export async function getDbTeacherProfile(uid: string): Promise<DbTeacherProfile | null> {
  if (!uid) return null;
  const row = await prisma.user.findUnique({ where: { id: uid } });
  return row?.role === 'TEACHER' ? mapTeacher(row) : null;
}

export async function getDbTeacherByEmail(email: string): Promise<DbTeacherProfile | null> {
  const row = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  return row?.role === 'TEACHER' ? mapTeacher(row) : null;
}

export async function listDbTeachers(): Promise<DbTeacherProfile[]> {
  const rows = await prisma.user.findMany({ where: { role: 'TEACHER' }, orderBy: { fullName: 'asc' } });
  return rows.map(mapTeacher);
}

export async function updateDbTeacherProfile(
  uid: string,
  data: Partial<Pick<DbTeacherProfile, 'courseSlugs' | 'teacherSecretCodeHash' | 'teacherSecretCode' | 'isFrozen'>>,
): Promise<void> {
  const { courseSlugs, ...rest } = data;
  const update: Prisma.UserUpdateInput = { ...rest };
  if (courseSlugs !== undefined) update.teacherCourseSlugs = parseTeacherCourseSlugs(courseSlugs);
  await prisma.user.update({ where: { id: uid }, data: update });
}

export async function deleteDbTeacherProfile(uid: string): Promise<void> {
  await prisma.user.delete({ where: { id: uid } });
}

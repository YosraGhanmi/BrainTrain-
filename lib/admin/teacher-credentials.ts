// A teacher's new password and/or secret code, shown to staff once on the
// Teachers page right after they are generated (see portal-actions.ts). Not a
// 'use server' file since those can only export async functions.
export const TEACHER_CREDENTIALS_COOKIE = 'braintrain_teacher_credentials';

export type TeacherCredentialsNotice = { email: string; code: string; password?: string };

export function parseTeacherCredentialsNotice(raw: string | undefined): TeacherCredentialsNotice | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (typeof value?.email !== 'string' || typeof value?.code !== 'string') return null;
    return { email: value.email, code: value.code, password: typeof value.password === 'string' ? value.password : undefined };
  } catch {
    return null;
  }
}

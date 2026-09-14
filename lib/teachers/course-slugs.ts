export function parseTeacherCourseSlugs(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((slug): slug is string => typeof slug === 'string') : [];
  } catch {
    return [];
  }
}

export function stringifyTeacherCourseSlugs(slugs: string[]): string {
  return JSON.stringify([...new Set(slugs.filter(Boolean))]);
}

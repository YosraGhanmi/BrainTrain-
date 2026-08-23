'use server';

import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readContent, writeContent } from '@/lib/content/store';
import { checkCredentials, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { requireAdmin } from '@/lib/admin/guard';
import type { TimelineEntry } from '@/lib/content/types';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function login(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  if (!checkCredentials(email, password)) {
    redirect('/admin/login?error=1');
  }
  cookies().set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect('/admin');
}

export async function logout(): Promise<void> {
  cookies().delete(SESSION_COOKIE_NAME);
  redirect('/admin/login');
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const UPLOAD_FOLDERS = ['partners', 'ach'] as const;
type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

async function saveUploadedImage(file: File, folder: UploadFolder): Promise<string> {
  if (!file || file.size === 0) throw new Error('No file provided');
  if (!file.type.startsWith('image/')) throw new Error('File must be an image');

  const ext = path.extname(file.name).slice(0, 10) || '.jpg';
  const safeBase = path
    .basename(file.name, path.extname(file.name))
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .slice(0, 40);
  const filename = `${Date.now()}-${safeBase}${ext}`;

  const dir = path.join(process.cwd(), 'public', folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(dir, filename), buffer);

  return `/${folder}/${filename}`;
}

const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFD')
      .replace(COMBINING_MARKS, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'item'
  );
}

function uniqueSlug(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base;
  let i = 2;
  while (taken.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

// ---------------------------------------------------------------------------
// Sponsors
// ---------------------------------------------------------------------------

export async function addSponsor(formData: FormData): Promise<void> {
  requireAdmin();
  const file = formData.get('logo') as File | null;
  if (!file) redirect('/admin/sponsors?error=1');

  const src = await saveUploadedImage(file, 'partners');
  const content = readContent();
  content.sponsors.push(src);
  writeContent(content);
  redirect('/admin/sponsors');
}

export async function deleteSponsor(src: string): Promise<void> {
  requireAdmin();
  const content = readContent();
  content.sponsors = content.sponsors.filter((s) => s !== src);
  writeContent(content);
  redirect('/admin/sponsors');
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function updateStats(formData: FormData): Promise<void> {
  requireAdmin();
  const labels = formData.getAll('label').map(String);
  const values = formData.getAll('value').map((v) => Math.max(0, Math.round(Number(v)) || 0));

  const content = readContent();
  content.stats = labels
    .map((label, i) => ({ label: label.trim(), value: values[i] ?? 0 }))
    .filter((s) => s.label.length > 0);
  writeContent(content);
  redirect('/admin/stats');
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export async function updateContact(formData: FormData): Promise<void> {
  requireAdmin();
  const field = (name: string) => String(formData.get(name) ?? '').trim();

  const content = readContent();
  content.contact = {
    email: { value: field('email_value'), href: field('email_href') },
    phone: { value: field('phone_value'), href: field('phone_href') },
    location: { value: field('location_value'), href: field('location_href') },
    mapsEmbedSrc: field('mapsEmbedSrc'),
  };
  writeContent(content);
  redirect('/admin/contact');
}

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

export async function updateSocials(formData: FormData): Promise<void> {
  requireAdmin();
  const labels = formData.getAll('label').map(String);
  const hrefs = formData.getAll('href').map(String);

  const content = readContent();
  content.socials = labels
    .map((label, i) => ({ label: label.trim(), href: (hrefs[i] ?? '').trim() }))
    .filter((s) => s.label.length > 0 && s.href.length > 0);
  writeContent(content);
  redirect('/admin/socials');
}

// ---------------------------------------------------------------------------
// Achievements gallery
// ---------------------------------------------------------------------------

export async function addAchievementImage(formData: FormData): Promise<void> {
  requireAdmin();
  const file = formData.get('image') as File | null;
  if (!file) redirect('/admin/achievements?error=1');

  const src = await saveUploadedImage(file, 'ach');
  const content = readContent();
  content.achievementsImages.push(src);
  writeContent(content);
  redirect('/admin/achievements');
}

export async function deleteAchievementImage(src: string): Promise<void> {
  requireAdmin();
  const content = readContent();
  content.achievementsImages = content.achievementsImages.filter((s) => s !== src);
  writeContent(content);
  redirect('/admin/achievements');
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export async function upsertTimelineEntry(formData: FormData): Promise<void> {
  requireAdmin();
  const indexRaw = String(formData.get('index') ?? '-1');
  const index = Number.isFinite(Number(indexRaw)) ? Number(indexRaw) : -1;

  const entry: TimelineEntry = {
    date: String(formData.get('date') ?? '').trim(),
    title: String(formData.get('title') ?? '').trim(),
    logo: formData.get('logo') === 'on',
    summary: String(formData.get('summary') ?? '').trim(),
    detail: String(formData.get('detail') ?? '').trim(),
  };

  const content = readContent();
  if (index >= 0 && index < content.timeline.length) {
    content.timeline[index] = entry;
  } else {
    content.timeline.push(entry);
  }
  writeContent(content);
  redirect('/admin/timeline');
}

export async function deleteTimelineEntry(index: number): Promise<void> {
  requireAdmin();
  const content = readContent();
  content.timeline.splice(index, 1);
  writeContent(content);
  redirect('/admin/timeline');
}

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export async function upsertCourse(formData: FormData): Promise<void> {
  requireAdmin();
  const existingSlug = String(formData.get('existingSlug') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const sessions = Math.max(0, Math.round(Number(formData.get('sessions')) || 0));
  const color = String(formData.get('color') ?? '#3d7fff').trim();
  const icon = String(formData.get('icon') ?? 'Bot').trim();
  const videoUrl = String(formData.get('videoUrl') ?? '').trim();

  if (!title) redirect('/admin/courses?error=1');

  const content = readContent();
  const otherSlugs = content.courses.filter((c) => c.slug !== existingSlug).map((c) => c.slug);

  if (existingSlug) {
    const idx = content.courses.findIndex((c) => c.slug === existingSlug);
    if (idx >= 0) {
      const oldTitle = content.courses[idx].title;
      content.courses[idx] = {
        ...content.courses[idx],
        title,
        description,
        sessions,
        color,
        icon,
        videoUrl: videoUrl || undefined,
      };
      // Keep age-group membership in sync if the title changed.
      if (oldTitle !== title) {
        content.ageGroups = content.ageGroups.map((g) => ({
          ...g,
          courseTitles: g.courseTitles.map((t) => (t === oldTitle ? title : t)),
        }));
      }
    }
  } else {
    const slug = uniqueSlug(slugify(title), otherSlugs);
    content.courses.push({ slug, title, description, sessions, color, icon, videoUrl: videoUrl || undefined });
  }

  writeContent(content);
  redirect('/admin/courses');
}

export async function deleteCourse(slug: string): Promise<void> {
  requireAdmin();
  const content = readContent();
  const course = content.courses.find((c) => c.slug === slug);
  content.courses = content.courses.filter((c) => c.slug !== slug);
  if (course) {
    content.ageGroups = content.ageGroups.map((g) => ({
      ...g,
      courseTitles: g.courseTitles.filter((t) => t !== course.title),
    }));
  }
  writeContent(content);
  redirect('/admin/courses');
}

// ---------------------------------------------------------------------------
// Age groups
// ---------------------------------------------------------------------------

export async function updateAgeGroup(formData: FormData): Promise<void> {
  requireAdmin();
  const slug = String(formData.get('slug') ?? '').trim();
  const label = String(formData.get('label') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const courseTitles = formData.getAll('courseTitles').map(String);

  const content = readContent();
  const idx = content.ageGroups.findIndex((g) => g.slug === slug);
  if (idx >= 0) {
    content.ageGroups[idx] = { ...content.ageGroups[idx], label, description, courseTitles };
    writeContent(content);
  }
  redirect('/admin/age-groups');
}

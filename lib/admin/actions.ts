'use server';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { readContent, writeContent } from '@/lib/content/store';
import { setMessageRead, deleteMessage as deleteMessageEntry } from '@/lib/messages/store';
import { checkCredentials, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { requireAdmin } from '@/lib/admin/guard';
import type { TimelineEntry, LocalizedString } from '@/lib/content/types';

function localizedField(formData: FormData, name: string): LocalizedString {
  return {
    en: String(formData.get(`${name}_en`) ?? '').trim(),
    fr: String(formData.get(`${name}_fr`) ?? '').trim(),
  };
}

// Public pages under app/[locale] now render with ISR (`revalidate = 300`)
// instead of force-dynamic, so an admin edit no longer shows up on the very
// next request automatically — call this after every `writeContent()` to
// invalidate the cached HTML for both locales immediately instead of waiting
// out the revalidate window.
function revalidatePublicContent(): void {
  revalidatePath('/[locale]', 'layout');
}

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

const UPLOAD_FOLDERS = ['partners', 'ach', 'courses', 'age'] as const;
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
  revalidatePublicContent();
  redirect('/admin/sponsors?saved=1');
}

export async function deleteSponsor(src: string): Promise<void> {
  requireAdmin();
  const content = readContent();
  content.sponsors = content.sponsors.filter((s) => s !== src);
  writeContent(content);
  revalidatePublicContent();
  redirect('/admin/sponsors?saved=1');
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function updateStats(formData: FormData): Promise<void> {
  requireAdmin();
  const labelsEn = formData.getAll('label_en').map(String);
  const labelsFr = formData.getAll('label_fr').map(String);
  const values = formData.getAll('value').map((v) => Math.max(0, Math.round(Number(v)) || 0));

  const content = readContent();
  content.stats = labelsEn
    .map((en, i) => ({ label: { en: en.trim(), fr: (labelsFr[i] ?? '').trim() }, value: values[i] ?? 0 }))
    .filter((s) => s.label.en.length > 0);
  writeContent(content);
  revalidatePublicContent();
  redirect('/admin/stats?saved=1');
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
  revalidatePublicContent();
  redirect('/admin/contact?saved=1');
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
  revalidatePublicContent();
  redirect('/admin/socials?saved=1');
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
  revalidatePublicContent();
  redirect('/admin/achievements?saved=1');
}

export async function deleteAchievementImage(src: string): Promise<void> {
  requireAdmin();
  const content = readContent();
  content.achievementsImages = content.achievementsImages.filter((s) => s !== src);
  writeContent(content);
  revalidatePublicContent();
  redirect('/admin/achievements?saved=1');
}

// ---------------------------------------------------------------------------
// News — announcements shown on the parent-portal dashboard
// ---------------------------------------------------------------------------

export async function addNews(formData: FormData): Promise<void> {
  requireAdmin();
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  if (!title || !body) redirect('/admin/news?error=1');

  const targetAgeGroups = formData.getAll('targetAgeGroups').map(String);
  const targetCourses = formData.getAll('targetCourses').map(String);

  const content = readContent();
  content.news.unshift({
    id: crypto.randomUUID(),
    title,
    body,
    createdAt: new Date().toISOString(),
    targetAgeGroups,
    targetCourses,
  });
  writeContent(content);
  revalidatePublicContent();
  redirect('/admin/news?saved=1');
}

export async function deleteNews(id: string): Promise<void> {
  requireAdmin();
  const content = readContent();
  content.news = content.news.filter((n) => n.id !== id);
  writeContent(content);
  revalidatePublicContent();
  redirect('/admin/news?saved=1');
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export async function upsertTimelineEntry(formData: FormData): Promise<void> {
  requireAdmin();
  const indexRaw = String(formData.get('index') ?? '-1');
  const index = Number.isFinite(Number(indexRaw)) ? Number(indexRaw) : -1;

  const facebookUrl = String(formData.get('facebookUrl') ?? '').trim();
  const entry: TimelineEntry = {
    date: localizedField(formData, 'date'),
    title: localizedField(formData, 'title'),
    logo: formData.get('logo') === 'on',
    summary: localizedField(formData, 'summary'),
    facebookUrl: facebookUrl || undefined,
  };

  const content = readContent();
  if (index >= 0 && index < content.timeline.length) {
    content.timeline[index] = entry;
  } else {
    content.timeline.push(entry);
  }
  writeContent(content);
  revalidatePublicContent();
  redirect('/admin/timeline?saved=1');
}

export async function deleteTimelineEntry(index: number): Promise<void> {
  requireAdmin();
  const content = readContent();
  content.timeline.splice(index, 1);
  writeContent(content);
  revalidatePublicContent();
  redirect('/admin/timeline?saved=1');
}

// `order` is the current entries' original indices in their new order, e.g.
// [2, 0, 1] to move the third entry to the front. Called directly from a
// client component's drag-and-drop handler, not a <form>, so it revalidates
// instead of redirecting — a redirect would fight the client's own state.
export async function reorderTimeline(order: number[]): Promise<void> {
  requireAdmin();
  const content = readContent();
  const reordered = order.map((i) => content.timeline[i]).filter((entry): entry is TimelineEntry => Boolean(entry));
  if (reordered.length !== content.timeline.length) return;
  content.timeline = reordered;
  writeContent(content);
  revalidatePublicContent();
  revalidatePath('/admin/timeline');
}

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export async function upsertCourse(formData: FormData): Promise<void> {
  requireAdmin();
  const existingSlug = String(formData.get('existingSlug') ?? '').trim();
  const title = localizedField(formData, 'title');
  const description = localizedField(formData, 'description');
  const sessions = Math.max(0, Math.round(Number(formData.get('sessions')) || 0));
  const price = Math.max(0, Math.round(Number(formData.get('price')) || 0));
  const ageGroupSlug = String(formData.get('ageGroupSlug') ?? '').trim();
  const color = String(formData.get('color') ?? '#3d7fff').trim();
  const icon = String(formData.get('icon') ?? 'Bot').trim();
  const videoUrl = String(formData.get('videoUrl') ?? '').trim();
  const imageFile = formData.get('image') as File | null;

  if (!title.en || !ageGroupSlug) redirect('/admin/courses?error=1');

  const content = readContent();
  const otherSlugs = content.courses.filter((c) => c.slug !== existingSlug).map((c) => c.slug);

  if (existingSlug) {
    const idx = content.courses.findIndex((c) => c.slug === existingSlug);
    if (idx >= 0) {
      const image = imageFile && imageFile.size > 0 ? await saveUploadedImage(imageFile, 'courses') : content.courses[idx].image;
      content.courses[idx] = {
        ...content.courses[idx],
        title,
        description,
        sessions,
        price,
        ageGroupSlug,
        color,
        icon,
        videoUrl: videoUrl || undefined,
        image,
      };
    }
  } else {
    const slug = uniqueSlug(slugify(`${title.en}-${ageGroupSlug}`), otherSlugs);
    const image = imageFile && imageFile.size > 0 ? await saveUploadedImage(imageFile, 'courses') : undefined;
    content.courses.push({ slug, title, description, sessions, price, ageGroupSlug, color, icon, videoUrl: videoUrl || undefined, image });
  }

  writeContent(content);
  revalidatePublicContent();
  redirect('/admin/courses?saved=1');
}

export async function deleteCourse(slug: string): Promise<void> {
  requireAdmin();
  const content = readContent();
  content.courses = content.courses.filter((c) => c.slug !== slug);
  writeContent(content);
  revalidatePublicContent();
  redirect('/admin/courses?saved=1');
}

// ---------------------------------------------------------------------------
// Age groups
// ---------------------------------------------------------------------------

export async function upsertAgeGroup(formData: FormData): Promise<void> {
  requireAdmin();
  const existingSlug = String(formData.get('existingSlug') ?? '').trim();
  const label = localizedField(formData, 'label');
  const description = localizedField(formData, 'description');
  const imageFile = formData.get('image') as File | null;

  if (!label.en) redirect('/admin/age-groups?error=1');

  const content = readContent();
  const otherSlugs = content.ageGroups.filter((g) => g.slug !== existingSlug).map((g) => g.slug);

  if (existingSlug) {
    const idx = content.ageGroups.findIndex((g) => g.slug === existingSlug);
    if (idx >= 0) {
      const image = imageFile && imageFile.size > 0 ? await saveUploadedImage(imageFile, 'age') : content.ageGroups[idx].image;
      content.ageGroups[idx] = { ...content.ageGroups[idx], label, description, image };
    }
  } else {
    const slug = uniqueSlug(slugify(label.en), otherSlugs);
    const image = imageFile && imageFile.size > 0 ? await saveUploadedImage(imageFile, 'age') : '';
    content.ageGroups.push({ slug, label, description, icon: 'Puzzle', image });
  }

  writeContent(content);
  revalidatePublicContent();
  redirect('/admin/age-groups?saved=1');
}

export async function deleteAgeGroup(slug: string): Promise<void> {
  requireAdmin();
  const content = readContent();
  content.ageGroups = content.ageGroups.filter((g) => g.slug !== slug);
  content.courses = content.courses.filter((c) => c.ageGroupSlug !== slug);
  writeContent(content);
  revalidatePublicContent();
  redirect('/admin/age-groups?saved=1');
}

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------

export async function markMessageRead(id: string, read: boolean): Promise<void> {
  requireAdmin();
  setMessageRead(id, read);
  revalidatePath('/admin/messages');
}

export async function deleteMessage(id: string): Promise<void> {
  requireAdmin();
  deleteMessageEntry(id);
  redirect('/admin/messages?saved=1');
}

'use server';

import path from 'path';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { readContent, writeContent } from '@/lib/content/store';
import { saveUpload, type UploadFolder } from '@/lib/uploads';
import { setMessageRead, deleteMessage as deleteMessageEntry } from '@/lib/messages/store';
import { checkCredentials, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { requireAdmin, requireAdminOnly } from '@/lib/admin/guard';
import { destroyPortalSession } from '@/lib/portal-auth/session';
import {
  upsertDbPricingRule,
  deleteDbPricingRulesByAgeGroup,
  deleteDbPricingRulesByCourse,
} from '@/lib/db/pricing';
import { listDbCourseSessionsByCourse, updateDbCourseSession } from '@/lib/db/sessions';
import { SCHOOL_YEAR_PLAN_TYPES, SUMMER_PLAN_TYPES, summerTerm } from '@/lib/content/summer';
import { DEFAULT_SESSION_TERM } from '@/lib/scheduling/slots';
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
    redirect('/admin/login?role=admin&error=1');
  }
  // Clear any leftover reception portal session from this browser so logging
  // out of the admin account later doesn't fall back into that session.
  await destroyPortalSession();
  (await cookies()).set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect('/admin');
}

export async function logout(): Promise<void> {
  // Clears both the legacy admin cookie and a secretary's DB-backed portal
  // session — whichever one is actually in use, the other is a no-op.
  (await cookies()).delete(SESSION_COOKIE_NAME);
  await destroyPortalSession();
  redirect('/admin/login');
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function saveUploadedImage(file: File, folder: UploadFolder): Promise<string> {
  if (!file || file.size === 0) throw new Error('No file provided');
  if (!file.type.startsWith('image/')) throw new Error('File must be an image');

  const ext = path.extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 10) || '.jpg';
  const safeBase = path
    .basename(file.name, path.extname(file.name))
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .slice(0, 40);
  const filename = `${Date.now()}-${safeBase}${ext}`;

  return saveUpload(folder, filename, Buffer.from(await file.arrayBuffer()));
}

const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

function slugify(input: string): string {
  return (input
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'item');
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
  await requireAdminOnly();
  const file = formData.get('logo') as File | null;
  if (!file) redirect('/admin/sponsors?error=1');

  const src = await saveUploadedImage(file, 'partners');
  const content = (await readContent());
  content.sponsors.push(src);
  await writeContent(content);
  revalidatePublicContent();
  redirect('/admin/sponsors?saved=1');
}

export async function deleteSponsor(src: string): Promise<void> {
  await requireAdminOnly();
  const content = (await readContent());
  content.sponsors = content.sponsors.filter((s) => s !== src);
  await writeContent(content);
  revalidatePublicContent();
  redirect('/admin/sponsors?saved=1');
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function updateStats(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const labelsEn = formData.getAll('label_en').map(String);
  const labelsFr = formData.getAll('label_fr').map(String);
  const values = formData.getAll('value').map((v) => Math.max(0, Math.round(Number(v)) || 0));

  const content = (await readContent());
  content.stats = labelsEn
    .map((en, i) => ({ label: { en: en.trim(), fr: (labelsFr[i] ?? '').trim() }, value: values[i] ?? 0 }))
    .filter((s) => s.label.en.length > 0);
  await writeContent(content);
  revalidatePublicContent();
  redirect('/admin/stats?saved=1');
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export async function updateContact(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const field = (name: string) => String(formData.get(name) ?? '').trim();

  const content = (await readContent());
  content.contact = {
    email: { value: field('email_value'), href: field('email_href') },
    phone: { value: field('phone_value'), href: field('phone_href') },
    location: { value: field('location_value'), href: field('location_href') },
    mapsEmbedSrc: field('mapsEmbedSrc'),
  };
  await writeContent(content);
  revalidatePublicContent();
  redirect('/admin/contact?saved=1');
}

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

export async function updateSocials(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const labels = formData.getAll('label').map(String);
  const hrefs = formData.getAll('href').map(String);

  const content = (await readContent());
  content.socials = labels
    .map((label, i) => ({ label: label.trim(), href: (hrefs[i] ?? '').trim() }))
    .filter((s) => s.label.length > 0 && s.href.length > 0);
  await writeContent(content);
  revalidatePublicContent();
  redirect('/admin/socials?saved=1');
}

// ---------------------------------------------------------------------------
// Achievements gallery
// ---------------------------------------------------------------------------

export async function addAchievementImage(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const file = formData.get('image') as File | null;
  if (!file) redirect('/admin/achievements?error=1');

  const src = await saveUploadedImage(file, 'ach');
  const content = (await readContent());
  content.achievementsImages.push(src);
  await writeContent(content);
  revalidatePublicContent();
  redirect('/admin/achievements?saved=1');
}

export async function deleteAchievementImage(src: string): Promise<void> {
  await requireAdminOnly();
  const content = (await readContent());
  content.achievementsImages = content.achievementsImages.filter((s) => s !== src);
  await writeContent(content);
  revalidatePublicContent();
  redirect('/admin/achievements?saved=1');
}

// ---------------------------------------------------------------------------
// News — announcements shown on the parent-portal dashboard
// ---------------------------------------------------------------------------

export async function addNews(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  if (!title || !body) redirect('/admin/news?error=1');

  const targetAgeGroups = formData.getAll('targetAgeGroups').map(String);
  const targetCourses = formData.getAll('targetCourses').map(String);

  const content = (await readContent());
  content.news.unshift({
    id: crypto.randomUUID(),
    title,
    body,
    createdAt: new Date().toISOString(),
    targetAgeGroups,
    targetCourses,
  });
  await writeContent(content);
  revalidatePublicContent();
  redirect('/admin/news?saved=1');
}

export async function deleteNews(id: string): Promise<void> {
  await requireAdminOnly();
  const content = (await readContent());
  content.news = content.news.filter((n) => n.id !== id);
  await writeContent(content);
  revalidatePublicContent();
  redirect('/admin/news?saved=1');
}

// ---------------------------------------------------------------------------
// Calendar events — admin-pinned dates shown on the parent-portal schedule
// ---------------------------------------------------------------------------

export async function addCalendarEvent(formData: FormData): Promise<void> {
  await requireAdmin();
  const label = String(formData.get('label') ?? '').trim();
  const date = String(formData.get('date') ?? '').trim();
  const color = String(formData.get('color') ?? '').trim() || '#3d7fff';
  if (!label || !date) redirect('/admin/calendar?error=1');

  const targetAgeGroups = formData.getAll('targetAgeGroups').map(String);
  const targetCourses = formData.getAll('targetCourses').map(String);

  const content = (await readContent());
  content.calendarEvents.unshift({
    id: crypto.randomUUID(),
    label,
    date,
    color,
    createdAt: new Date().toISOString(),
    targetAgeGroups,
    targetCourses,
  });
  await writeContent(content);
  revalidatePublicContent();
  redirect('/admin/calendar?saved=1');
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await requireAdmin();
  const content = (await readContent());
  content.calendarEvents = content.calendarEvents.filter((e) => e.id !== id);
  await writeContent(content);
  revalidatePublicContent();
  redirect('/admin/calendar?saved=1');
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export async function upsertTimelineEntry(formData: FormData): Promise<void> {
  await requireAdminOnly();
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

  const content = (await readContent());
  if (index >= 0 && index < content.timeline.length) {
    content.timeline[index] = entry;
  } else {
    content.timeline.push(entry);
  }
  await writeContent(content);
  revalidatePublicContent();
  redirect('/admin/timeline?saved=1');
}

export async function deleteTimelineEntry(index: number): Promise<void> {
  await requireAdminOnly();
  const content = (await readContent());
  content.timeline.splice(index, 1);
  await writeContent(content);
  revalidatePublicContent();
  redirect('/admin/timeline?saved=1');
}

// `order` is the current entries' original indices in their new order, e.g.
// [2, 0, 1] to move the third entry to the front. Called directly from a
// client component's drag-and-drop handler, not a <form>, so it revalidates
// instead of redirecting — a redirect would fight the client's own state.
export async function reorderTimeline(order: number[]): Promise<void> {
  await requireAdminOnly();
  const content = (await readContent());
  const reordered = order.map((i) => content.timeline[i]).filter((entry): entry is TimelineEntry => Boolean(entry));
  if (reordered.length !== content.timeline.length) return;
  content.timeline = reordered;
  await writeContent(content);
  revalidatePublicContent();
  revalidatePath('/admin/timeline');
}

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export async function upsertCourse(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const existingSlug = String(formData.get('existingSlug') ?? '').trim();
  const title = localizedField(formData, 'title');
  const description = localizedField(formData, 'description');
  const sessions = Math.max(0, Math.round(Number(formData.get('sessions')) || 0));
  const ageGroupSlug = String(formData.get('ageGroupSlug') ?? '').trim();
  const color = String(formData.get('color') ?? '#3d7fff').trim();
  const icon = String(formData.get('icon') ?? 'Bot').trim();
  const videoUrl = String(formData.get('videoUrl') ?? '').trim();
  const imageFile = formData.get('image') as File | null;
  // Empty = use the standard session length from the Pricing page
  const sessionHoursValue = Number(formData.get('sessionHours'));
  const sessionHours = sessionHoursValue > 0 ? sessionHoursValue : undefined;
  const tagline = localizedField(formData, 'tagline');
  const outcome = localizedField(formData, 'outcome');
  const highlights = [0, 1, 2]
    .map((i) => ({
      icon: String(formData.get(`highlight${i}_icon`) ?? 'Lightbulb'),
      title: localizedField(formData, `highlight${i}_title`),
      text: localizedField(formData, `highlight${i}_text`),
    }))
    .filter((h) => h.title.en || h.title.fr);
  // Two textareas, one skill per line, paired by line number
  const skillLines = (lang: 'en' | 'fr') =>
    String(formData.get(`skills_${lang}`) ?? '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  const skillsEn = skillLines('en');
  const skillsFr = skillLines('fr');
  const skills = Array.from({ length: Math.max(skillsEn.length, skillsFr.length) }, (_, i) => ({
    en: skillsEn[i] ?? skillsFr[i],
    fr: skillsFr[i] ?? skillsEn[i],
  }));
  const tools = String(formData.get('tools') ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const summer = String(formData.get('summer') ?? '') === 'on';

  if (!title.en || !ageGroupSlug) redirect('/admin/courses?error=1');

  const content = (await readContent());
  const otherSlugs = content.courses.filter((c) => c.slug !== existingSlug).map((c) => c.slug);

  let slug: string;
  let wasSummer = false;
  if (existingSlug) {
    slug = existingSlug;
    const idx = content.courses.findIndex((c) => c.slug === existingSlug);
    if (idx >= 0) {
      wasSummer = Boolean(content.courses[idx].summer);
      const image = imageFile && imageFile.size > 0 ? await saveUploadedImage(imageFile, 'courses') : content.courses[idx].image;
      content.courses[idx] = {
        ...content.courses[idx],
        title,
        description,
        sessions,
        sessionHours,
        tagline,
        highlights,
        outcome,
        skills,
        tools,
        ageGroupSlug,
        color,
        icon,
        videoUrl: videoUrl || undefined,
        image,
        summer: summer || undefined,
      };
    }
  } else {
    slug = uniqueSlug(slugify(`${title.en}-${ageGroupSlug}`), otherSlugs);
    const image = imageFile && imageFile.size > 0 ? await saveUploadedImage(imageFile, 'courses') : undefined;
    // Pricing lives in PricingRule (age-group default or the course override
    // handled below) — this legacy field is kept only because CourseEntry
    // still requires it; nothing reads it anymore.
    content.courses.push({
      slug,
      title,
      description,
      sessions,
      sessionHours,
      tagline,
      highlights,
      outcome,
      skills,
      tools,
      price: 0,
      ageGroupSlug,
      color,
      icon,
      videoUrl: videoUrl || undefined,
      image,
      summer: summer || undefined,
    });
  }

  await writeContent(content);

  // Moving a course in or out of the summer school moves its groups too
  if (existingSlug && wasSummer !== summer) {
    const term = summer ? summerTerm(content.summerSchool) : DEFAULT_SESSION_TERM;
    const groups = await listDbCourseSessionsByCourse(slug);
    await Promise.all(groups.map((group) => updateDbCourseSession(group.id, { summer, term })));
  }

  // Pricing: either this course rides the age group's default rate (any
  // existing course-specific override is cleared), or it pins its own
  // monthly/quarterly/yearly amounts that win over that default (resolvePrice).
  // Summer courses always have their own monthly and full-season prices.
  const useDefaultPricing = !summer && String(formData.get('useDefaultPricing') ?? '') === 'on';
  await deleteDbPricingRulesByCourse(slug);
  if (!useDefaultPricing) {
    const currency = String(formData.get('pricingCurrency') ?? 'TND').trim() || 'TND';
    await Promise.all(
      (summer ? SUMMER_PLAN_TYPES : SCHOOL_YEAR_PLAN_TYPES).map((planType) => {
        const amount = Math.max(0, Number(formData.get(`amount_${planType}`)) || 0);
        return upsertDbPricingRule({ planType, courseSlug: slug, amount, currency });
      }),
    );
  }

  revalidatePublicContent();
  redirect(summer ? '/admin/summer-school?saved=1' : '/admin/courses?saved=1');
}

export async function deleteCourse(slug: string): Promise<void> {
  await requireAdminOnly();
  const content = (await readContent());
  const summer = Boolean(content.courses.find((c) => c.slug === slug)?.summer);
  content.courses = content.courses.filter((c) => c.slug !== slug);
  await writeContent(content);
  await deleteDbPricingRulesByCourse(slug);
  revalidatePublicContent();
  redirect(summer ? '/admin/summer-school?saved=1' : '/admin/courses?saved=1');
}

// ---------------------------------------------------------------------------
// Age groups
// ---------------------------------------------------------------------------

export async function upsertAgeGroup(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const existingSlug = String(formData.get('existingSlug') ?? '').trim();
  const label = localizedField(formData, 'label');
  const description = localizedField(formData, 'description');
  const stage = localizedField(formData, 'stage');
  const imageFile = formData.get('image') as File | null;
  const minAge = Number.parseInt(String(formData.get('minAge') ?? ''), 10);
  const maxAge = Number.parseInt(String(formData.get('maxAge') ?? ''), 10);

  if (!label.en || Number.isNaN(minAge) || Number.isNaN(maxAge) || minAge > maxAge) redirect('/admin/age-groups?error=1');

  const content = (await readContent());
  const otherSlugs = content.ageGroups.filter((g) => g.slug !== existingSlug).map((g) => g.slug);

  if (existingSlug) {
    const idx = content.ageGroups.findIndex((g) => g.slug === existingSlug);
    if (idx >= 0) {
      const image = imageFile && imageFile.size > 0 ? await saveUploadedImage(imageFile, 'age') : content.ageGroups[idx].image;
      content.ageGroups[idx] = { ...content.ageGroups[idx], label, description, image, minAge, maxAge, stage };
    }
  } else {
    const slug = uniqueSlug(slugify(label.en), otherSlugs);
    const image = imageFile && imageFile.size > 0 ? await saveUploadedImage(imageFile, 'age') : '';
    content.ageGroups.push({ slug, label, description, icon: 'Puzzle', image, minAge, maxAge, stage });
  }

  await writeContent(content);
  revalidatePublicContent();
  redirect('/admin/age-groups?saved=1');
}

export async function deleteAgeGroup(slug: string): Promise<void> {
  await requireAdminOnly();
  const content = (await readContent());
  const removedCourseSlugs = content.courses.filter((c) => c.ageGroupSlug === slug).map((c) => c.slug);
  content.ageGroups = content.ageGroups.filter((g) => g.slug !== slug);
  content.courses = content.courses.filter((c) => c.ageGroupSlug !== slug);
  await writeContent(content);
  await Promise.all([
    deleteDbPricingRulesByAgeGroup(slug),
    ...removedCourseSlugs.map((cs) => deleteDbPricingRulesByCourse(cs)),
  ]);
  revalidatePublicContent();
  redirect('/admin/age-groups?saved=1');
}

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------

export async function markMessageRead(id: string, read: boolean): Promise<void> {
  await requireAdmin();
  await setMessageRead(id, read);
  revalidatePath('/admin/messages');
}

export async function deleteMessage(id: string): Promise<void> {
  await requireAdmin();
  await deleteMessageEntry(id);
  redirect('/admin/messages?saved=1');
}

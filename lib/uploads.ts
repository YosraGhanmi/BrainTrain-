import fs from 'fs';
import path from 'path';

// Images uploaded from the admin panel and the parent portal. They live
// outside public/ because `next start` only serves the public files that
// existed when it started; app/uploads/[...path]/route.ts serves these
// instead. In Docker this folder is a volume, so uploads survive rebuilds.
export const UPLOADS_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOADS_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), 'uploads'));

export const UPLOAD_FOLDERS = ['partners', 'ach', 'courses', 'age', 'children'] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

// Saves the file and returns the URL it is served at
export function saveUpload(folder: UploadFolder, filename: string, data: Buffer): string {
  const dir = path.join(/*turbopackIgnore: true*/ UPLOADS_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(/*turbopackIgnore: true*/ dir, filename), data);
  return `/uploads/${folder}/${filename}`;
}

// Absolute path of an uploaded file from its URL segments, or null when the
// segments would leave the uploads folder
export function resolveUpload(segments: string[]): string | null {
  const [folder, ...rest] = segments;
  if (!UPLOAD_FOLDERS.includes(folder as UploadFolder) || rest.length !== 1) return null;
  const file = path.resolve(/*turbopackIgnore: true*/ UPLOADS_DIR, folder, rest[0]);
  return file.startsWith(path.join(/*turbopackIgnore: true*/ UPLOADS_DIR, folder) + path.sep) ? file : null;
}

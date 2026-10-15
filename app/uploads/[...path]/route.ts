import fs from 'fs';
import path from 'path';
import { resolveUpload } from '@/lib/uploads';

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
};

// Serves uploaded images from the uploads folder (see lib/uploads.ts)
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const file = resolveUpload((await params).path);
  const contentType = file ? CONTENT_TYPES[path.extname(file).toLowerCase()] : undefined;
  if (!file || !contentType) return new Response('Not found', { status: 404 });

  let data: Buffer;
  try {
    data = await fs.promises.readFile(file);
  } catch {
    return new Response('Not found', { status: 404 });
  }

  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': contentType,
      // File names carry a timestamp, so a file never changes
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      // An uploaded SVG opened directly can't run scripts
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}

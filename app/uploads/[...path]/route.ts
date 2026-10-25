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
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

const HEADERS = {
  // File names carry a timestamp, so a file never changes
  'Cache-Control': 'public, max-age=31536000, immutable',
  'X-Content-Type-Options': 'nosniff',
  // An uploaded SVG opened directly can't run scripts
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  'Accept-Ranges': 'bytes',
};

// "bytes=start-end" (either end may be missing) → inclusive byte range within
// a file of `size` bytes, or null when it can't be satisfied
function parseRange(header: string, size: number): [number, number] | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return null;
  let start: number;
  let end: number;
  if (!match[1]) {
    // Suffix range: the last N bytes
    start = Math.max(0, size - Number(match[2]));
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }
  return start <= end && start < size ? [start, end] : null;
}

// Serves uploaded images and videos from the uploads folder (see
// lib/uploads.ts). Videos need byte ranges: Safari won't play a video from a
// server that can't answer them, and other browsers use them to seek.
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const file = resolveUpload((await params).path);
  const contentType = file ? CONTENT_TYPES[path.extname(file).toLowerCase()] : undefined;
  if (!file || !contentType) return new Response('Not found', { status: 404 });

  let size: number;
  try {
    const stat = await fs.promises.stat(file);
    if (!stat.isFile()) return new Response('Not found', { status: 404 });
    size = stat.size;
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const rangeHeader = request.headers.get('range');
  if (rangeHeader) {
    const range = parseRange(rangeHeader, size);
    if (!range) {
      return new Response(null, { status: 416, headers: { ...HEADERS, 'Content-Range': `bytes */${size}` } });
    }
    const [start, end] = range;
    const handle = await fs.promises.open(file, 'r');
    const data = Buffer.alloc(end - start + 1);
    try {
      await handle.read(data, 0, data.length, start);
    } finally {
      await handle.close();
    }
    return new Response(new Uint8Array(data), {
      status: 206,
      headers: {
        ...HEADERS,
        'Content-Type': contentType,
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-Length': String(data.length),
      },
    });
  }

  const data = await fs.promises.readFile(file);
  return new Response(new Uint8Array(data), {
    headers: { ...HEADERS, 'Content-Type': contentType, 'Content-Length': String(size) },
  });
}

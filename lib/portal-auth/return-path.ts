// The public page a visitor left to sign up or log in (passed as ?from=), so
// the auth screen's "back to site" link returns them there instead of the
// home page. Paths are locale-less (e.g. "/courses/6-9"); the locale-aware
// Link adds the prefix.

// Only same-site paths: a crafted ?from= must not be able to send visitors
// to another website.
export function safeReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  return value;
}

export function withReturnPath(path: string, from: string | null): string {
  if (!from) return path;
  return `${path}${path.includes('?') ? '&' : '?'}from=${encodeURIComponent(from)}`;
}

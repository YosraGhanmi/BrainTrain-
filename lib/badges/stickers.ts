// Sticker artwork a teacher can pick when awarding a badge (public/stickers).
// Kept as a fixed list (not a folder scan) so award submissions can be
// validated server-side against a known set instead of trusting free-form
// file paths from the client.
export const BADGE_STICKERS = [
  { label: 'Star Student', url: '/stickers/Star Student Energy Sticker.jpg' },
  { label: 'Brilliant', url: '/stickers/brilliant.jpg' },
  { label: 'Good Job', url: '/stickers/good.jpg' },
] as const;

export function isValidStickerUrl(url: string): boolean {
  return BADGE_STICKERS.some((s) => s.url === url);
}

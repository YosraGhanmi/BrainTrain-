import type { Badge } from '@prisma/client';

// Placeholder circular styling until real badge artwork is uploaded — each
// badge just cycles through this palette so a grid of several looks varied.
const PALETTE = [
  'bg-blue-50 ring-blue-300',
  'bg-amber-50 ring-amber-300',
  'bg-emerald-50 ring-emerald-300',
  'bg-orange-50 ring-orange-300',
  'bg-violet-50 ring-violet-300',
  'bg-rose-50 ring-rose-300',
];

export default function BadgesCard({ badges }: { badges: Badge[] }) {
  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="text-center text-base font-semibold text-ink">Badges</h2>

      {badges.length === 0 ? (
        <p className="mt-10 text-center text-sm text-stone">No badges earned yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-3 gap-x-4 gap-y-6 justify-items-center">
          {badges.map((badge, i) => (
            <div key={badge.id} className="flex flex-col items-center gap-2" title={badge.note ?? undefined}>
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl ring-4 ${
                  PALETTE[i % PALETTE.length]
                }`}
              >
                {badge.emoji}
              </div>
              <p className="max-w-[5.5rem] truncate text-center text-xs font-semibold text-ink">{badge.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PALETTE = ['#3d7fff', '#6c5ce7', '#00b894', '#ff8c42', '#f7b500', '#0b8793'];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function InitialsAvatar({ name, className = 'h-10 w-10 text-sm' }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`}
      style={{ backgroundColor: colorFor(name) }}
    >
      {initials || '?'}
    </div>
  );
}

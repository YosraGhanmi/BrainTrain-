import { PlayCircle } from 'lucide-react';

type Props = {
  url?: string;
  title: string;
  className?: string;
};

// Accepts a plain YouTube or Facebook video link (watch page, youtu.be short
// link, share link, ...) and turns it into an embeddable iframe src. Nothing
// fancy: paste the link BrainTrain would normally share and it just works.
function toEmbedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') {
        const id = u.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (u.pathname.startsWith('/shorts/') || u.pathname.startsWith('/embed/')) {
        const id = u.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      return null;
    }

    if (host === 'facebook.com' || host === 'fb.watch') {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0`;
    }

    return null;
  } catch {
    return null;
  }
}

export default function VideoEmbed({ url, title, className }: Props) {
  const embedSrc = url ? toEmbedSrc(url) : null;

  return (
    <div className={`relative h-full min-h-[520px] w-full overflow-hidden rounded-3xl bg-[#0b1a3a] ${className ?? ''}`}>
      {embedSrc ? (
        <iframe
          src={embedSrc}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
          <PlayCircle className="h-12 w-12" strokeWidth={1.25} />
          <p className="text-sm font-semibold uppercase tracking-wide">Video coming soon</p>
        </div>
      )}
    </div>
  );
}

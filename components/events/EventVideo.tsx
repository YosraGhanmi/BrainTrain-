'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, X } from 'lucide-react';

// Only Facebook's own hosts are ever put in the iframe
function facebookEmbedSrc(url: string, portrait: boolean): string | null {
  try {
    const { hostname } = new URL(url);
    if (!/(^|\.)facebook\.com$/.test(hostname) && hostname !== 'fb.watch') return null;
  } catch {
    return null;
  }
  const [width, height] = portrait ? [360, 640] : [800, 450];
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true&width=${width}&height=${height}`;
}

type Props = {
  title: string;
  // Our own file wins over the Facebook video
  videoFile: string;
  facebookUrl: string;
  poster: string;
  portrait: boolean;
  playLabel: string;
  closeLabel: string;
  // Shape of the preview (aspect-* and rounded-* classes), whatever the video's own shape
  previewClassName?: string;
};

// The preview picture with a play button. Pressing it opens the video in a
// lightbox sized to the video, so a tall reel is never squeezed into a wide
// card. Nothing from Facebook loads until then: the page stays fast and no
// third-party cookies are set before the visitor chooses to watch.
export default function EventVideo({ title, videoFile, facebookUrl, poster, portrait, playLabel, closeLabel, previewClassName = 'aspect-[4/5] rounded-[1.5rem]' }: Props) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const closer = useRef<HTMLButtonElement>(null);
  const embed = videoFile ? null : facebookEmbedSrc(facebookUrl, portrait);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closer.current?.focus();
    const button = opener.current;
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      button?.focus();
    };
  }, [open]);

  if (!videoFile && !embed) return null;

  return (
    <>
      <button
        ref={opener}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${playLabel}: ${title}`}
        className={`group relative block w-full overflow-hidden bg-[#0b1a3a] ${previewClassName} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b1a3a]`}
      >
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]" />
        ) : (
          <span className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_10%,#283880_0%,#0b1a3a_60%,#060d20_100%)]" />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-[#060d20]/55 via-transparent to-transparent" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#0b1a3a] shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:scale-110">
            <Play className="ml-0.5 h-7 w-7 fill-current" aria-hidden="true" />
          </span>
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#060d20]/90 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <button
            ref={closer}
            type="button"
            onClick={() => setOpen(false)}
            aria-label={closeLabel}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0b1a3a] shadow-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <div
            className={`relative overflow-hidden rounded-2xl bg-black shadow-2xl ${
              portrait ? 'aspect-[9/16] h-[min(88vh,820px)]' : 'aspect-video w-[min(94vw,1100px)]'
            }`}
          >
            {videoFile ? (
              <video src={videoFile} poster={poster || undefined} controls autoPlay playsInline className="absolute inset-0 h-full w-full bg-black object-contain">
                {title}
              </video>
            ) : (
              <iframe
                src={embed!}
                title={title}
                className="absolute inset-0 h-full w-full border-0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
                allowFullScreen
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

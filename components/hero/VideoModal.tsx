'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  src: string;
  poster?: string;
  closeLabel: string;
};

// The hero video in a popup, with sound and controls. A native <dialog>:
// Escape closes it and focus stays inside while it's open.
export default function VideoModal({ open, onClose, src, poster, closeLabel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const video = videoRef.current;
    if (!dialog || !video) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      // The page behind stays put (the smooth scroller ignores the dialog
      // via data-lenis-prevent, and the root can't scroll natively)
      document.documentElement.style.overflow = 'hidden';
      video.currentTime = 0;
      video.muted = false;
      // Opened by a click, so playing with sound is allowed
      video.play().catch(() => {});
    } else {
      video.pause();
      if (dialog.open) dialog.close();
      document.documentElement.style.overflow = '';
    }
  }, [open]);

  useEffect(() => () => {
    document.documentElement.style.overflow = '';
  }, []);

  return (
    <dialog
      ref={dialogRef}
      data-lenis-prevent
      onClose={onClose}
      // A click on the backdrop lands on the dialog itself, not its content
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto w-[min(92vw,1100px)] max-w-none overflow-visible bg-transparent p-0 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      <div className="relative">
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute -top-12 right-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <X className="h-5 w-5" />
        </button>
        <video
          ref={videoRef}
          src={open ? src : undefined}
          poster={poster || undefined}
          controls
          playsInline
          preload="none"
          className="aspect-video w-full rounded-xl bg-black object-contain shadow-2xl"
        />
      </div>
    </dialog>
  );
}

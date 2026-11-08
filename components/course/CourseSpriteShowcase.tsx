'use client';

import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import MarbleSprite from '@/components/course/MarbleSprite';

// The look tuned in Originkit's editor. Two things differ on purpose: pale glass
// instead of black, which reads as a dark disc on this light page, and following
// the cursor across the whole page with lower reach and lean. At the editor's full
// values a distant cursor would pin the face at its limit and tip the capsule over.
const LOOK = {
  restX: 0,
  restY: 10,
  roll: 0,
  maxTurn: 46,
  seamAngle: 88,
  seamTilt: 64,
  seamOffset: -5,
  shell: 1,
  lip: 5,
  spriteSize: 75,
  eyeGap: 46.5,
  eyeLength: 31.5,
  eyeWidth: 10,
  eyeColor: '#F3F2F8',
};

export default function CourseSpriteShowcase({ description, locale }: { description: string; locale: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const toggle = () => {
    if (!supported) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(description);
    utterance.lang = locale === 'fr' ? 'fr-FR' : 'en-US';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <div className="relative h-full min-h-[320px] w-full sm:min-h-[420px] lg:min-h-[520px]">
      <MarbleSprite
        transparent
        background="#f3f6ff"
        spriteColor="#1400F6"
        scale={86}
        frost={6.2}
        follow="page"
        reach={4}
        lean={3}
        blink={10}
        float={15}
        advanced={LOOK}
      />

      {supported ? (
        <button
          type="button"
          onClick={toggle}
          aria-label={speaking ? 'Mute' : 'Hear the description'}
          aria-pressed={speaking}
          className={`absolute bottom-0 left-1/2 z-20 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full shadow-soft transition ${
            speaking ? 'bg-accent text-white' : 'bg-ink text-white hover:bg-accent'
          }`}
        >
          {speaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      ) : null}
    </div>
  );
}

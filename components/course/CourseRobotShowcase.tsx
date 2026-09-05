'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Volume2, VolumeX } from 'lucide-react';

// Heavy three.js bundle — load in the browser only, same as the homepage hero.
const CourseRobotModel = dynamic(() => import('@/components/3d/CourseRobotModel'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[2rem] bg-ink/5" />,
});

export default function CourseRobotShowcase({ description, locale }: { description: string; locale: string }) {
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
    <div className="relative h-full min-h-[520px] w-full">
      <CourseRobotModel />

      {supported ? (
        <button
          type="button"
          onClick={toggle}
          aria-label={speaking ? 'Mute' : 'Hear the description'}
          aria-pressed={speaking}
          className={`absolute bottom-6 left-1/2 z-20 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full shadow-soft transition ${
            speaking ? 'bg-accent text-white' : 'bg-ink text-white hover:bg-accent'
          }`}
        >
          {speaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      ) : null}
    </div>
  );
}

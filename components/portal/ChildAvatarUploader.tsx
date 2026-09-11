'use client';

import { useState, useTransition } from 'react';
import { Camera } from 'lucide-react';
import { useTranslations } from 'next-intl';
import InitialsAvatar from './course/InitialsAvatar';

export default function ChildAvatarUploader({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const t = useTranslations('parentPortal.dashboard.profile');
  const [preview, setPreview] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="relative mx-auto h-20 w-20">
      {preview || photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview ?? photoUrl!}
          alt={name}
          className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-soft"
        />
      ) : (
        <InitialsAvatar name={name} className="h-20 w-20 border-4 border-white text-2xl shadow-soft" />
      )}

      <label
        className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-ink text-white shadow-soft transition hover:bg-accent"
        title={t('changePhoto')}
      >
        <Camera className="h-3.5 w-3.5" />
        <input
          type="file"
          name="photo"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            const form = e.currentTarget.form;
            if (!file || !form) return;
            setPreview(URL.createObjectURL(file));
            startTransition(() => {
              form.requestSubmit();
            });
          }}
        />
      </label>
    </div>
  );
}

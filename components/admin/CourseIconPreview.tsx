'use client';

import { useState } from 'react';
import CourseIllustration from '@/components/illustrations/CourseIllustration';
import { getIcon } from '@/lib/content/icons';

const COURSE_ICON_NAMES = ['Bot', 'Code2', 'Rocket', 'Smile', 'CircuitBoard', 'Printer', 'Terminal'] as const;

export default function CourseIconPreview({
  initialIcon,
  initialColor,
  image,
}: {
  initialIcon: string;
  initialColor: string;
  image?: string;
}) {
  const [icon, setIcon] = useState(initialIcon);
  const [color, setColor] = useState(initialColor);

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">
          Preview (what the age group's course grid will show)
        </span>
        <div className="h-32 w-full max-w-xs overflow-hidden rounded-2xl border border-ink/10 bg-white">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <CourseIllustration icon={getIcon(icon)} color={color} className="h-full w-full" />
          )}
        </div>
        {image ? <p className="mt-1.5 text-xs text-stone">The uploaded illustration image above takes priority over the icon.</p> : null}
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Icon</span>
        <select
          name="icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
        >
          {COURSE_ICON_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Color</span>
        <div className="flex items-center rounded-xl border border-ink/10 bg-slate-50 px-4 py-2">
          <input
            name="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-14 cursor-pointer rounded border-none bg-transparent"
          />
        </div>
      </label>
    </div>
  );
}

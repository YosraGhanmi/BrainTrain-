'use client';

import { useRef, useState } from 'react';
import { Facebook, Instagram, Linkedin, Twitter, Youtube, MessageCircle, Music2, Link2, Plus, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Row = { key: number; label: string; href: string };

function iconFor(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes('facebook')) return Facebook;
  if (l.includes('instagram')) return Instagram;
  if (l.includes('linkedin')) return Linkedin;
  if (l.includes('twitter') || l === 'x') return Twitter;
  if (l.includes('youtube')) return Youtube;
  if (l.includes('tiktok')) return Music2;
  if (l.includes('whatsapp')) return MessageCircle;
  return Link2;
}

export default function SocialLinksEditor({ initial }: { initial: { label: string; href: string }[] }) {
  const nextKey = useRef(initial.length);
  const [rows, setRows] = useState<Row[]>(initial.map((r, i) => ({ key: i, ...r })));

  const addRow = () => setRows((r) => [...r, { key: nextKey.current++, label: '', href: '' }]);
  const removeRow = (key: number) => setRows((r) => r.filter((row) => row.key !== key));
  const setLabel = (key: number, label: string) => setRows((r) => r.map((row) => (row.key === key ? { ...row, label } : row)));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => {
        const Icon = iconFor(row.label);
        return (
          <div
            key={row.key}
            className="relative space-y-3 overflow-hidden rounded-2xl border border-accent/15 bg-accent/[0.04] p-5"
          >
            <span className="absolute inset-x-0 top-0 h-1 bg-accent" />

            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-sm shadow-accent/30">
                <Icon className="h-5 w-5" />
              </span>
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                aria-label="Remove"
                className="flex items-center justify-center rounded-lg border border-red-200 p-1.5 text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <input
              name="label"
              value={row.label}
              onChange={(e) => setLabel(row.key, e.target.value)}
              placeholder="Facebook / Instagram / LinkedIn"
              className="w-full rounded-xl border border-accent/15 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent/40"
            />
            <input
              name="href"
              defaultValue={row.href}
              placeholder="https://..."
              className="w-full rounded-xl border border-accent/15 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent/40"
            />
          </div>
        );
      })}

      <button
        type="button"
        onClick={addRow}
        className="flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-accent/30 text-sm font-semibold text-stone transition hover:border-accent/60 hover:text-accent"
      >
        <Plus className="h-5 w-5" />
        Add link
      </button>
    </div>
  );
}

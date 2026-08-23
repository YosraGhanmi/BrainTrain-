import { readContent } from '@/lib/content/store';
import { updateSocials } from '@/lib/admin/actions';

export const dynamic = 'force-dynamic';

export default function AdminSocialsPage() {
  const { socials } = readContent();
  const rows = [...socials, { label: '', href: '' }];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Social media links</h1>
      <p className="mt-2 text-stone">Shown in the sidebar icons on every page. Leave a row blank to remove it.</p>

      <form action={updateSocials} className="mt-8 max-w-lg space-y-4 rounded-2xl border border-ink/10 bg-white p-6">
        {rows.map((social, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              name="label"
              defaultValue={social.label}
              placeholder="Facebook / Instagram / LinkedIn"
              className="w-40 rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
            />
            <input
              name="href"
              defaultValue={social.href}
              placeholder="https://..."
              className="flex-1 rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
            />
          </div>
        ))}

        <button
          type="submit"
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
        >
          Save
        </button>
      </form>
    </div>
  );
}

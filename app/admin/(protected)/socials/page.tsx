import { readContent } from '@/lib/content/store';
import { updateSocials } from '@/lib/admin/actions';
import SocialLinksEditor from '@/components/admin/SocialLinksEditor';

export const dynamic = 'force-dynamic';

export default function AdminSocialsPage() {
  const { socials } = readContent();

  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">Social media links</h1>

      <form action={updateSocials} className="mt-8 rounded-2xl border border-ink/10 bg-white p-6">
        <SocialLinksEditor initial={socials} />

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

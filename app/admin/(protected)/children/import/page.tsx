import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { requireAdminOnly } from '@/lib/admin/guard';
import { listAgeGroupEntries } from '@/lib/content/lookup';
import ChildrenImport from '@/components/admin/ChildrenImport';

export const dynamic = 'force-dynamic';

export default async function ImportChildrenPage() {
  await requireAdminOnly();
  const ageGroups = await listAgeGroupEntries();

  return (
    <div className="mx-auto max-w-6xl pb-6">
      <Link href="/admin/children" className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Children
      </Link>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Import children from Excel</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone">
            One row per child; only the name is required. Your own file works too: each column is read from its header (French or English)
            or guessed from its values, and you can correct any column before importing. Rows with the same phone or email become brothers
            and sisters, and every child gets a parent code.
          </p>
        </div>
        <a
          href="/admin/children/import/template"
          download
          className="flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Download the template
        </a>
      </div>

      <div className="mt-6">
        <ChildrenImport groupLabels={Object.fromEntries(ageGroups.map((g) => [g.slug, g.label.en]))} />
      </div>
    </div>
  );
}

import type { NextRequest } from 'next/server';
import { getAdminSession } from '@/lib/admin/guard';
import { listAgeGroupEntries } from '@/lib/content/lookup';
import { filterChildren, parseChildrenFilters } from '@/lib/children/list';
import { buildChildrenExport } from '@/lib/children/excel';
import { listAllDbChildren } from '@/lib/db/children';

export const dynamic = 'force-dynamic';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// The Children list as an Excel file, with the filters the page had (its
// query string is passed along). Admin only: it holds parents' phone numbers.
export async function GET(request: NextRequest): Promise<Response> {
  if ((await getAdminSession())?.kind !== 'admin') return new Response('Forbidden', { status: 403 });

  const [all, ageGroups] = await Promise.all([listAllDbChildren(), listAgeGroupEntries()]);
  const children = filterChildren(all, parseChildrenFilters(request.nextUrl.searchParams));
  const file = await buildChildrenExport(children, ageGroups);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Type': XLSX,
      'Content-Disposition': `attachment; filename="braintrain-children-${date}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}

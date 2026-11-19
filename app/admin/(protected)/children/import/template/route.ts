import { getAdminSession } from '@/lib/admin/guard';
import { listAgeGroupEntries } from '@/lib/content/lookup';
import { buildImportTemplate } from '@/lib/children/excel';

export const dynamic = 'force-dynamic';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// The empty workbook staff fill in to import children (Admin only)
export async function GET(): Promise<Response> {
  if ((await getAdminSession())?.kind !== 'admin') return new Response('Forbidden', { status: 403 });
  const file = await buildImportTemplate(await listAgeGroupEntries());
  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Type': XLSX,
      'Content-Disposition': 'attachment; filename="braintrain-children-template.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}

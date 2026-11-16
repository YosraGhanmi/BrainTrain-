import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/guard';

// Fixed and variable charges each have their own page now.
export default async function AdminDispensesPage() {
  await requireAdmin();
  redirect('/admin/dispenses/fixed');
}

import { redirect } from 'next/navigation';

// Fixed and variable charges each have their own page now.
export default function AdminDispensesPage() {
  redirect('/admin/dispenses/fixed');
}

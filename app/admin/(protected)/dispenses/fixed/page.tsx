import ExpenseLedger from '../ExpenseLedger';

export const dynamic = 'force-dynamic';

export default async function AdminFixedChargesPage(props: {
  searchParams: Promise<{ saved?: string; error?: string; month?: string }>;
}) {
  return <ExpenseLedger chargeType="FIXED" searchParams={await props.searchParams} />;
}

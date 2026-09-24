import ExpenseLedger from '../ExpenseLedger';

export const dynamic = 'force-dynamic';

export default async function AdminVariableChargesPage(props: {
  searchParams: Promise<{ saved?: string; error?: string; month?: string }>;
}) {
  return <ExpenseLedger chargeType="VARIABLE" searchParams={await props.searchParams} />;
}

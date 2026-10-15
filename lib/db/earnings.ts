import { prisma } from '@/lib/db/prisma';

// Income logged by hand (e.g. workshop fees, sponsorships, desk sales).
// Tuition payments marked PAID live in `payments` and are not duplicated here.
export type DbEarning = {
  id: string;
  label: string;
  amount: number;
  currency: string;
  note: string | null;
  date: Date;
  createdByName: string;
  createdByRole: string;
  createdAt: Date;
};

export async function createDbEarning(input: Omit<DbEarning, 'id' | 'createdAt'>): Promise<string> {
  const row = await prisma.earning.create({ data: input });
  return row.id;
}

export async function deleteDbEarning(id: string): Promise<void> {
  await prisma.earning.delete({ where: { id } });
}

export async function listDbEarningsBetween(start: Date, end: Date): Promise<DbEarning[]> {
  const rows = await prisma.earning.findMany({ where: { date: { gte: start, lt: end } }, orderBy: { date: 'desc' } });
  return rows.map((row) => ({ ...row, amount: Number(row.amount) }));
}

import { prisma } from '@/lib/db/prisma';

export type ExpenseChargeType = 'FIXED' | 'VARIABLE';

export type DbExpense = {
  id: string;
  label: string;
  amount: number;
  currency: string;
  note: string | null;
  date: Date;
  chargeType: ExpenseChargeType;
  createdByName: string;
  createdByRole: string;
  createdAt: Date;
};

export async function createDbExpense(input: Omit<DbExpense, 'id' | 'createdAt'>): Promise<string> {
  const row = await prisma.expense.create({ data: input });
  return row.id;
}

export async function deleteDbExpense(id: string): Promise<void> {
  await prisma.expense.delete({ where: { id } });
}

export async function listDbExpenses(): Promise<DbExpense[]> {
  const rows = await prisma.expense.findMany({ orderBy: { date: 'desc' } });
  return rows.map((row) => ({ ...row, amount: Number(row.amount) }));
}

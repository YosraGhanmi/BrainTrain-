import { prisma } from '@/lib/db/prisma';

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  read: boolean;
};

// Newest first
export async function readMessages(): Promise<ContactMessage[]> {
  const rows = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function addMessage(entry: { name: string; email: string; message: string }): Promise<void> {
  await prisma.contactMessage.create({ data: entry });
}

export async function setMessageRead(id: string, read: boolean): Promise<void> {
  await prisma.contactMessage.update({ where: { id }, data: { read } });
}

export async function deleteMessage(id: string): Promise<void> {
  await prisma.contactMessage.delete({ where: { id } });
}

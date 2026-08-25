'use server';

import { addMessage } from '@/lib/messages/store';

export async function submitContactMessage(data: { name: string; email: string; message: string }): Promise<void> {
  const name = data.name.trim();
  const email = data.email.trim();
  const message = data.message.trim();
  if (!name || !email || !message) return;

  addMessage({ name, email, message });
}

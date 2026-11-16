'use server';

import { z } from 'zod';
import { addMessage } from '@/lib/messages/store';
import { clientIp, takeAttempt, WINDOW } from '@/lib/auth/rate-limit';

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(1).max(4000),
});

// Open to everyone, so the input is checked and the number of messages per
// address is capped. Anything that doesn't pass is dropped quietly.
export async function submitContactMessage(data: { name: string; email: string; message: string }): Promise<void> {
  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) return;
  if (!(await takeAttempt(`contact-ip:${await clientIp()}`, 5, WINDOW.tenMinutes))) return;

  await addMessage(parsed.data);
}

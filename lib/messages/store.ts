import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  read: boolean;
};

const MESSAGES_PATH = path.join(process.cwd(), 'data', 'messages.json');

function ensureFile(): void {
  const dir = path.dirname(MESSAGES_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(MESSAGES_PATH)) fs.writeFileSync(MESSAGES_PATH, '[]', 'utf-8');
}

export function readMessages(): ContactMessage[] {
  ensureFile();
  const raw = fs.readFileSync(MESSAGES_PATH, 'utf-8');
  const messages: ContactMessage[] = JSON.parse(raw);
  return messages.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function writeMessages(messages: ContactMessage[]): void {
  ensureFile();
  fs.writeFileSync(MESSAGES_PATH, JSON.stringify(messages, null, 2), 'utf-8');
}

export function addMessage(entry: { name: string; email: string; message: string }): void {
  const messages = readMessages();
  messages.push({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
    ...entry,
  });
  writeMessages(messages);
}

export function setMessageRead(id: string, read: boolean): void {
  writeMessages(readMessages().map((m) => (m.id === id ? { ...m, read } : m)));
}

export function deleteMessage(id: string): void {
  writeMessages(readMessages().filter((m) => m.id !== id));
}

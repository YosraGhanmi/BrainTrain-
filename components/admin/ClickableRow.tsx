'use client';

import { useRouter } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';

// A table row that opens `href` when clicked anywhere, except on its own
// links, buttons and forms (edit/delete keep working as usual).
export default function ClickableRow({ href, className = '', children }: { href: string; className?: string; children: ReactNode }) {
  const router = useRouter();

  const onClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if ((event.target as HTMLElement).closest('a, button, form, input, select, textarea')) return;
    if (window.getSelection()?.toString()) return; // selecting text to copy, not navigating
    if (event.metaKey || event.ctrlKey) window.open(href, '_blank');
    else router.push(href);
  };

  return (
    <tr onClick={onClick} className={`cursor-pointer ${className}`}>
      {children}
    </tr>
  );
}

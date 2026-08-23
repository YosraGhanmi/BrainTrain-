'use client';

import { useState, useTransition, Children, type ReactNode } from 'react';

export default function TimelineDragList({
  children,
  onReorder,
}: {
  children: ReactNode;
  onReorder: (order: number[]) => Promise<void>;
}) {
  const items = Children.toArray(children);
  const [order, setOrder] = useState<number[]>(items.map((_, i) => i));
  const [dragPos, setDragPos] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const handleDrop = (targetPos: number) => {
    if (dragPos === null || dragPos === targetPos) {
      setDragPos(null);
      return;
    }
    const next = [...order];
    const [moved] = next.splice(dragPos, 1);
    next.splice(targetPos, 0, moved);
    setOrder(next);
    setDragPos(null);
    startTransition(() => {
      onReorder(next);
    });
  };

  return (
    <>
      {order.map((originalIndex, pos) => (
        <div
          key={originalIndex}
          draggable
          onDragStart={() => setDragPos(pos)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(pos)}
          onDragEnd={() => setDragPos(null)}
          className={`cursor-grab transition active:cursor-grabbing ${dragPos === pos ? 'opacity-40' : ''}`}
        >
          {items[originalIndex]}
        </div>
      ))}
    </>
  );
}

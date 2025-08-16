'use client';

import { useMemo } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import type { BaseItem } from '@/lib/types';

export function ItemPicker({
  title,
  items,
  selected,
  onChange
}: {
  title: string;
  items: BaseItem[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((it) => {
          const isOn = selectedSet.has(it.id);
          return (
            <li key={it.id}>
              <button
                className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left hover:bg-neutral-50"
                onClick={() => {
                  const next = new Set(selectedSet);
                  if (isOn) next.delete(it.id); else next.add(it.id);
                  onChange(Array.from(next));
                }}
              >
                <span className="text-sm">
                  <span className="font-medium">{it.title || it.name}</span>
                  {('subtitle' in it && it.subtitle) ? (
                    <span className="text-neutral-500"> — {(it as any).subtitle}</span>
                  ) : null}
                </span>
                {isOn ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
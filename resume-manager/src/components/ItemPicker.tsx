'use client';

import { useMemo } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import type { BaseItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((it) => {
          const isOn = selectedSet.has(it.id);
          return (
            <Button
              key={it.id}
              variant="ghost"
              className="w-full justify-between h-auto p-3 text-left"
              onClick={() => {
                const next = new Set(selectedSet);
                if (isOn) next.delete(it.id); else next.add(it.id);
                onChange(Array.from(next));
              }}
            >
              <span className="text-sm flex-1 text-left">
                <span className="font-medium">{it.title || it.name}</span>
                {('subtitle' in it && it.subtitle) ? (
                  <span className="text-muted-foreground"> — {(it as any).subtitle}</span>
                ) : null}
              </span>
              {isOn ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} className="text-muted-foreground" />}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
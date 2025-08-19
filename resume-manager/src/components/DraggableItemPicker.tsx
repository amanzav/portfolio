'use client';

import { useMemo } from 'react';
import { CheckSquare, Square, GripVertical } from 'lucide-react';
import type { BaseItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  item: BaseItem;
  isSelected: boolean;
  onToggle: () => void;
}

function SortableItem({ id, item, isSelected, onToggle }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-background border rounded-lg"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical size={16} />
      </div>
      
      <Button
        variant="ghost"
        className="flex-1 justify-between h-auto p-2 text-left"
        onClick={onToggle}
      >
        <span className="text-sm flex-1 text-left">
          <span className="font-medium">{item.title || item.name}</span>
          {('subtitle' in item && item.subtitle) ? (
            <span className="text-muted-foreground"> — {(item as any).subtitle}</span>
          ) : null}
        </span>
        {isSelected ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} className="text-muted-foreground" />}
      </Button>
    </div>
  );
}

export function DraggableItemPicker({
  title,
  items,
  selected,
  onChange,
  onReorder
}: {
  title: string;
  items: BaseItem[];
  selected: string[];
  onChange: (ids: string[]) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  
  // Create ordered list with selected items first, maintaining their order
  const orderedItems = useMemo(() => {
    const selectedItems = selected.map(id => items.find(item => item.id === id)).filter(Boolean) as BaseItem[];
    const unselectedItems = items.filter(item => !selectedSet.has(item.id));
    return [...selectedItems, ...unselectedItems];
  }, [items, selected, selectedSet]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id && onReorder) {
      const oldIndex = orderedItems.findIndex(item => item.id === active.id);
      const newIndex = orderedItems.findIndex(item => item.id === over?.id);
      
      // Only allow reordering within selected items
      const isActiveSelected = selectedSet.has(active.id as string);
      const isOverSelected = selectedSet.has(over?.id as string);
      
      if (isActiveSelected && isOverSelected) {
        const selectedOldIndex = selected.indexOf(active.id as string);
        const selectedNewIndex = selected.indexOf(over?.id as string);
        onReorder(selectedOldIndex, selectedNewIndex);
      }
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
            {orderedItems.map((item) => {
              const isSelected = selectedSet.has(item.id);
              return (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  item={item}
                  isSelected={isSelected}
                  onToggle={() => {
                    const next = new Set(selectedSet);
                    if (isSelected) next.delete(item.id); else next.add(item.id);
                    onChange(Array.from(next));
                  }}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}

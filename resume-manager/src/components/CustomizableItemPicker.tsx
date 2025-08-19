'use client';

import { useMemo, useState } from 'react';
import { CheckSquare, Square, GripVertical, Edit3, RotateCcw } from 'lucide-react';
import type { BaseItem, Profile, Experience, Project, Skill, Education } from '@/lib/types';
import { hasProfileOverride } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  item: BaseItem;
  isSelected: boolean;
  hasOverride: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onResetOverride: () => void;
}

function SortableItem({ id, item, isSelected, hasOverride, onToggle, onEdit, onResetOverride }: SortableItemProps) {
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
      className="flex items-center gap-3 p-2 bg-card border border-border rounded-lg hover:bg-accent/30 transition-colors group"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical size={16} />
      </div>
      
      <div
        className="flex-1 flex justify-between items-center h-auto text-left min-h-[3rem] cursor-pointer px-2 truncate"
        onClick={onToggle}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-base truncate mr-8">{item.title || item.name}</span>
              {hasOverride && <Badge variant="secondary" className="text-xs flex-shrink-0">Customized</Badge>}
            </div>
            {('subtitle' in item && (item as Experience | Project).subtitle) ? (
              <div className="text-sm text-muted-foreground mt-1 truncate">
                {(item as Experience | Project).subtitle}
              </div>
            ) : null}
          </div>
          {isSelected ? <CheckSquare size={20} className="text-primary flex-shrink-0" /> : <Square size={20} className="text-muted-foreground flex-shrink-0" />}
        </div>
      </div>

      {isSelected && (
        <div className="flex gap-1 ml-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="h-9 w-9 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
            title="Customize for this resume"
          >
            <Edit3 size={16} />
          </Button>
          {hasOverride && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onResetOverride();
              }}
              className="h-9 w-9 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900"
              title="Reset to master data"
            >
              <RotateCcw size={16} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface EditDialogProps {
  item: Experience | Project | Skill | Education;
  type: 'experience' | 'project' | 'skill' | 'education';
  isOpen: boolean;
  onClose: () => void;
  onSave: (patch: Partial<Experience | Project | Skill | Education>) => void;
}

function EditDialog({ item, type, isOpen, onClose, onSave }: EditDialogProps) {
  const [editedItem, setEditedItem] = useState(item);

  const handleSave = () => {
    onSave(editedItem);
    onClose();
  };

  const renderFields = () => {
    switch (type) {
      case 'experience':
        const exp = editedItem as Experience;
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={exp.title}
                  onChange={(e) => setEditedItem({...exp, title: e.target.value})}
                  className="border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={exp.company}
                  onChange={(e) => setEditedItem({...exp, company: e.target.value})}
                  className="border-border focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                value={exp.date}
                onChange={(e) => setEditedItem({...exp, date: e.target.value})}
                className="border-border focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label>Bullet Points</Label>
              {exp.bullets.map((bullet, index) => (
                <RichTextEditor
                  key={index}
                  value={bullet}
                  onChange={(value) => {
                    const newBullets = [...exp.bullets];
                    newBullets[index] = value;
                    setEditedItem({...exp, bullets: newBullets});
                  }}
                  className="border-border focus:border-primary"
                />
              ))}
            </div>
          </>
        );
      case 'project':
        const proj = editedItem as Project;
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={proj.title}
                  onChange={(e) => setEditedItem({...proj, title: e.target.value})}
                  className="border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Link</Label>
                <Input
                  id="link"
                  value={proj.link || ''}
                  onChange={(e) => setEditedItem({...proj, link: e.target.value})}
                  className="border-border focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bullet Points</Label>
              {proj.bullets.map((bullet, index) => (
                <RichTextEditor
                  key={index}
                  value={bullet}
                  onChange={(value) => {
                    const newBullets = [...proj.bullets];
                    newBullets[index] = value;
                    setEditedItem({...proj, bullets: newBullets});
                  }}
                  className="border-border focus:border-primary"
                />
              ))}
            </div>
          </>
        );
      case 'skill':
        const skill = editedItem as Skill;
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Category</Label>
              <Input
                id="name"
                value={skill.name}
                onChange={(e) => setEditedItem({...skill, name: e.target.value})}
                className="border-border focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Details</Label>
              <RichTextEditor
                value={skill.details}
                onChange={(value) => setEditedItem({...skill, details: value})}
                className="border-border focus:border-primary"
                placeholder="Describe your skill level and relevant experience..."
              />
            </div>
          </>
        );
      case 'education':
        const edu = editedItem as Education;
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Program/Degree</Label>
              <Input
                id="title"
                value={edu.title}
                onChange={(e) => setEditedItem({...edu, title: e.target.value})}
                className="border-border focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Details</Label>
              <Input
                id="details"
                value={edu.details}
                onChange={(e) => setEditedItem({...edu, details: e.target.value})}
                className="border-border focus:border-primary"
              />
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize {type} for this resume</DialogTitle>
          <DialogDescription>
            Changes made here will only affect this resume profile, not the master data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {renderFields()}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CustomizableItemPicker({
  title,
  type,
  items,
  selected,
  profile,
  onChange,
  onReorder,
  onUpdateItem,
  onResetOverride
}: {
  title: string;
  type: 'experience' | 'project' | 'skill' | 'education';
  items: BaseItem[];
  selected: string[];
  profile: Profile;
  onChange: (ids: string[]) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onUpdateItem: (itemId: string, patch: Partial<Experience | Project | Skill | Education>) => void;
  onResetOverride: (itemId: string) => void;
}) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const [editingItem, setEditingItem] = useState<BaseItem | null>(null);
  
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
    <>
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={orderedItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
              {orderedItems.map((item) => {
                const isSelected = selectedSet.has(item.id);
                const hasOverride = hasProfileOverride(profile, type, item.id);
                return (
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    item={item}
                    isSelected={isSelected}
                    hasOverride={hasOverride}
                    onToggle={() => {
                      const next = new Set(selectedSet);
                      if (isSelected) next.delete(item.id); else next.add(item.id);
                      onChange(Array.from(next));
                    }}
                    onEdit={() => setEditingItem(item)}
                    onResetOverride={() => onResetOverride(item.id)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {editingItem && (
        <EditDialog
          item={editingItem as Experience | Project | Skill | Education}
          type={type}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(patch) => onUpdateItem(editingItem.id, patch)}
        />
      )}
    </>
  );
}

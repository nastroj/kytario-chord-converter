import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem, SortableItemContent } from './SortableItem';
import { useState } from 'react';

export interface SectionItem {
  id: string;
  text: string;
}

interface ReorderListProps {
  items: SectionItem[];
  setItems: React.Dispatch<React.SetStateAction<SectionItem[]>>;
  isDarkMode: boolean;
  onReorder?: (items: SectionItem[]) => void;
}

export function ReorderList({ items, setItems, isDarkMode, onReorder }: ReorderListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex) as SectionItem[];
        if (onReorder) {
          onReorder(newItems);
        }
        return newItems;
      });
    }
  };

  return (
    <div className={`p-4 h-full overflow-y-auto ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext 
          items={items.map(i => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <SortableItem key={item.id} id={item.id} text={item.text} isDarkMode={isDarkMode} />
            ))}
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeId ? (
            <SortableItemContent 
              text={items.find(item => item.id === activeId)?.text || ''}
              isDarkMode={isDarkMode}
              isDragging={true}
              isOverlay={true}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

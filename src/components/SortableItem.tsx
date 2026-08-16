import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string;
  text: string;
  isDarkMode: boolean;
  key?: React.Key;
}

export function SortableItemContent({ 
  text, 
  isDarkMode, 
  isDragging, 
  isOverlay, 
  attributes, 
  listeners, 
  setActivatorNodeRef 
}: any) {
  const previewLines = text.split(/\r?\n/).slice(0, 4);
  const isTruncated = text.split(/\r?\n/).length > 4;

  let containerClasses = `relative rounded-md border flex items-stretch shadow-sm ${
    isDarkMode 
      ? 'bg-slate-800 border-slate-700 text-slate-200' 
      : 'bg-white border-slate-200 text-slate-800'
  }`;

  if (isDragging && !isOverlay) {
    containerClasses = `relative rounded-md border-2 border-dashed flex items-stretch shadow-none opacity-40 ${
      isDarkMode 
        ? 'border-slate-600 bg-slate-800/30' 
        : 'border-slate-300 bg-slate-100'
    }`;
  }

  if (isOverlay) {
    containerClasses += ` shadow-xl ring-2 ring-indigo-500 scale-[1.02] rotate-1 cursor-grabbing opacity-95`;
  }

  return (
    <div className={containerClasses}>
      <div 
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className={`flex items-center p-2 border-r touch-none ${
          isOverlay || (isDragging && !isOverlay) ? 'cursor-grabbing' : 'cursor-grab'
        } ${
          isDarkMode ? 'border-slate-700 hover:bg-slate-750' : 'border-slate-100 hover:bg-slate-50'
        }`}
      >
        <GripVertical className={`w-5 h-5 ${isDragging && !isOverlay ? 'opacity-30' : 'text-slate-400'}`} />
      </div>
      <div className={`p-3 font-mono text-xs overflow-hidden flex-1 select-none ${isDragging && !isOverlay ? 'opacity-30' : ''}`}>
        {previewLines.map((line: string, i: number) => (
          <div key={i} className="whitespace-pre-wrap">{line || ' '}</div>
        ))}
        {isTruncated && <div className="text-slate-400 mt-1 italic">...</div>}
      </div>
    </div>
  );
}

export function SortableItem({ id, text, isDarkMode }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 0 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SortableItemContent
        text={text}
        isDarkMode={isDarkMode}
        isDragging={isDragging}
        isOverlay={false}
        attributes={attributes}
        listeners={listeners}
        setActivatorNodeRef={setActivatorNodeRef}
      />
    </div>
  );
}

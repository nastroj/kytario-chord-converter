import React, { useState } from 'react';
import { 
  Music, 
  Mic2, 
  Sparkles, 
  Disc, 
  Flag, 
  Compass, 
  Layers, 
  Copy, 
  Check, 
  GripVertical,
  X
} from 'lucide-react';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SongSection, SectionType } from '../utils/sectionParser';

interface SectionMapProps {
  sections: SongSection[];
  isDarkMode: boolean;
  lang: 'cs' | 'en';
  onJumpToSection: (section: SongSection) => void;
  onReorderSections: (newSections: SongSection[]) => void;
  onClose?: () => void;
  activeSectionIndex?: number;
}

export function getSectionBadgeConfig(type: SectionType, isDarkMode: boolean) {
  switch (type) {
    case 'intro':
      return {
        bg: isDarkMode ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60' : 'bg-cyan-50 text-cyan-700 border-cyan-200',
        dot: 'bg-cyan-400',
        icon: Disc,
      };
    case 'chorus':
      return {
        bg: isDarkMode ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-400',
        icon: Mic2,
      };
    case 'bridge':
      return {
        bg: isDarkMode ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-400',
        icon: Compass,
      };
    case 'pre-chorus':
      return {
        bg: isDarkMode ? 'bg-purple-950/60 text-purple-300 border-purple-800/60' : 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-400',
        icon: Sparkles,
      };
    case 'outro':
      return {
        bg: isDarkMode ? 'bg-violet-950/60 text-violet-300 border-violet-800/60' : 'bg-violet-50 text-violet-700 border-violet-200',
        dot: 'bg-violet-400',
        icon: Flag,
      };
    case 'solo':
      return {
        bg: isDarkMode ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-400',
        icon: Sparkles,
      };
    case 'verse':
    default:
      return {
        bg: isDarkMode ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dot: 'bg-indigo-400',
        icon: Music,
      };
  }
}

interface SectionItemCardProps {
  section: SongSection;
  idx: number;
  isDarkMode: boolean;
  isActive: boolean;
  isDragging?: boolean;
  isOverlay?: boolean;
  copiedId: string | null;
  t: any;
  onJumpToSection: (section: SongSection) => void;
  onCopySection: (e: React.MouseEvent, section: SongSection) => void;
  attributes?: any;
  listeners?: any;
  setActivatorNodeRef?: (node: HTMLElement | null) => void;
}

function SectionItemCard({
  section,
  idx,
  isDarkMode,
  isActive,
  isDragging,
  isOverlay,
  copiedId,
  t,
  onJumpToSection,
  onCopySection,
  attributes,
  listeners,
  setActivatorNodeRef,
}: SectionItemCardProps) {
  const badge = getSectionBadgeConfig(section.type, isDarkMode);
  const Icon = badge.icon;
  const isCopied = copiedId === section.id;

  let containerClasses = `group relative rounded-lg border transition-all flex items-stretch overflow-hidden select-none ${
    isDarkMode 
      ? 'bg-slate-800/80 border-slate-700/70 text-slate-200 hover:border-slate-600' 
      : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300 hover:shadow-xs'
  }`;

  if (isActive) {
    containerClasses += isDarkMode 
      ? ' ring-1 ring-indigo-500 border-indigo-500/80 bg-slate-800' 
      : ' ring-1 ring-indigo-500 border-indigo-400 bg-indigo-50/20';
  }

  if (isDragging && !isOverlay) {
    containerClasses = `relative rounded-lg border-2 border-dashed flex items-stretch shadow-none opacity-40 ${
      isDarkMode ? 'border-slate-600 bg-slate-800/30' : 'border-slate-300 bg-slate-100'
    }`;
  }

  if (isOverlay) {
    containerClasses += ` shadow-xl ring-2 ring-indigo-500 scale-[1.02] cursor-grabbing opacity-95`;
  }

  return (
    <div className={containerClasses}>
      {/* Drag handle */}
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        title={t.dragHint}
        className={`flex items-center justify-center px-1.5 border-r touch-none transition-colors ${
          isOverlay || (isDragging && !isOverlay) ? 'cursor-grabbing' : 'cursor-grab'
        } ${
          isDarkMode 
            ? 'border-slate-750 bg-slate-850/50 hover:bg-slate-750 text-slate-400 hover:text-slate-200' 
            : 'border-slate-100 bg-slate-50/70 hover:bg-slate-100 text-slate-400 hover:text-slate-600'
        }`}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Content body */}
      <div 
        onClick={() => onJumpToSection(section)}
        className="flex-1 p-2 flex flex-col gap-1 min-w-0 cursor-pointer"
      >
        {/* Top row */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md border shrink-0 ${badge.bg}`}>
              <Icon className="w-2.5 h-2.5" />
              <span className="truncate max-w-[90px]">{section.label}</span>
            </span>
            <span className={`text-[10px] font-mono shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              #{idx + 1}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`text-[10px] flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>{section.lineCount} {t.lines}</span>
              {section.chordCount > 0 && (
                <>
                  <span>•</span>
                  <span className="font-mono text-indigo-500 dark:text-indigo-400 font-semibold">{section.chordCount} {t.chords}</span>
                </>
              )}
            </div>

            {!isOverlay && (
              <button
                type="button"
                onClick={(e) => onCopySection(e, section)}
                title={isCopied ? t.copied : t.jumpTo}
                className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                  isDarkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Preview snippet */}
        {section.preview && (
          <div className={`text-[10px] font-mono truncate pl-1 border-l-2 ${
            isDarkMode ? 'text-slate-400 border-slate-700' : 'text-slate-600 border-slate-200'
          }`}>
            {section.preview}
          </div>
        )}
      </div>
    </div>
  );
}

function SortableSectionItem({
  section,
  idx,
  isDarkMode,
  isActive,
  copiedId,
  t,
  onJumpToSection,
  onCopySection,
}: {
  key?: React.Key;
  section: SongSection;
  idx: number;
  isDarkMode: boolean;
  isActive: boolean;
  copiedId: string | null;
  t: any;
  onJumpToSection: (section: SongSection) => void;
  onCopySection: (e: React.MouseEvent, section: SongSection) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SectionItemCard
        section={section}
        idx={idx}
        isDarkMode={isDarkMode}
        isActive={isActive}
        isDragging={isDragging}
        isOverlay={false}
        copiedId={copiedId}
        t={t}
        onJumpToSection={onJumpToSection}
        onCopySection={onCopySection}
        attributes={attributes}
        listeners={listeners}
        setActivatorNodeRef={setActivatorNodeRef}
      />
    </div>
  );
}

export function SectionMap({
  sections,
  isDarkMode,
  lang,
  onJumpToSection,
  onReorderSections,
  onClose,
  activeSectionIndex
}: SectionMapProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  const t = {
    cs: {
      title: "Řazení & mapa sekcí",
      sectionsCount: (n: number) => `${n} sekcí`,
      empty: "Žádné sekce nebyly nalezeny. Vložte píseň s prázdnými řádky nebo označením sekcí (např. [Verse 1], [Chorus], - 1., - REF).",
      flow: "Přehled:",
      jumpTo: "Přejít na sekci",
      copied: "Zkopírováno",
      lines: "řádků",
      chords: "ak.",
      dragHint: "Uchopte a přetáhněte pro změnu pořadí sekcí",
    },
    en: {
      title: "Reorder & Section Structure",
      sectionsCount: (n: number) => `${n} sections`,
      empty: "No sections detected. Paste a song with blank lines or section tags (e.g. [Verse 1], [Chorus], - 1., - REF).",
      flow: "Flow:",
      jumpTo: "Jump to section",
      copied: "Copied",
      lines: "lines",
      chords: "ch.",
      dragHint: "Drag and drop to reorder sections",
    }
  }[lang];

  const handleCopySection = (e: React.MouseEvent, section: SongSection) => {
    e.stopPropagation();
    navigator.clipboard.writeText(section.rawText);
    setCopiedId(section.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

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
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(sections, oldIndex, newIndex);
        onReorderSections(reordered);
      }
    }
  };

  const activeSection = activeId ? sections.find(s => s.id === activeId) : null;
  const activeSectionRealIdx = activeId ? sections.findIndex(s => s.id === activeId) : -1;

  if (sections.length === 0) {
    return (
      <div className={`p-4 rounded-lg border text-center text-xs ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
      }`}>
        <Layers className="w-6 h-6 mx-auto mb-2 opacity-50" />
        {t.empty}
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full overflow-hidden select-none border-b sm:border-b-0 sm:border-l ${
      isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-50/95 border-slate-200'
    }`}>
      {/* Header */}
      <div className={`p-2.5 sm:p-3 border-b flex items-center justify-between shrink-0 ${
        isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/50' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {t.title}
            </h4>
            <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {t.sectionsCount(sections.length)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bird's-Eye Flow Breadcrumb Badges */}
      <div className={`p-2 border-b overflow-x-auto shrink-0 flex items-center gap-1 scrollbar-thin ${
        isDarkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-100/60 border-slate-200'
      }`}>
        <span className={`text-[9px] font-bold uppercase tracking-wider shrink-0 mr-1 ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {t.flow}
        </span>
        {sections.map((sec, idx) => {
          const badge = getSectionBadgeConfig(sec.type, isDarkMode);
          const Icon = badge.icon;
          return (
            <React.Fragment key={sec.id}>
              {idx > 0 && (
                <span className={`text-[9px] opacity-40 shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  ➔
                </span>
              )}
              <button
                type="button"
                onClick={() => onJumpToSection(sec)}
                title={`${sec.label} (${sec.lineCount} ${t.lines}) - ${t.jumpTo}`}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border shrink-0 transition-all cursor-pointer hover:scale-105 active:scale-95 ${badge.bg} ${
                  activeSectionIndex === idx ? 'ring-1 ring-indigo-500 font-bold' : ''
                }`}
              >
                <Icon className="w-2.5 h-2.5" />
                <span>{sec.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Detailed Drag-and-Drop Section Navigation List */}
      <div className="flex-1 p-2 overflow-y-auto min-h-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-1.5">
              {sections.map((sec, idx) => (
                <SortableSectionItem
                  key={sec.id}
                  section={sec}
                  idx={idx}
                  isDarkMode={isDarkMode}
                  isActive={activeSectionIndex === idx}
                  copiedId={copiedId}
                  t={t}
                  onJumpToSection={onJumpToSection}
                  onCopySection={handleCopySection}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{
            duration: 250,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}>
            {activeSection ? (
              <SectionItemCard
                section={activeSection}
                idx={activeSectionRealIdx}
                isDarkMode={isDarkMode}
                isActive={false}
                isDragging={true}
                isOverlay={true}
                copiedId={copiedId}
                t={t}
                onJumpToSection={() => {}}
                onCopySection={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

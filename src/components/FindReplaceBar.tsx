import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  X, 
  Replace, 
  CheckCheck, 
  CaseSensitive, 
  WholeWord,
  Sparkles
} from "lucide-react";

export interface FindReplaceBarProps {
  mode: "input" | "output";
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  replaceQuery?: string;
  onReplaceQueryChange?: (replaceText: string) => void;
  totalMatches: number;
  activeMatchIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  onReplace?: () => void;
  onReplaceAll?: () => void;
  caseSensitive: boolean;
  onToggleCaseSensitive: () => void;
  wholeWord: boolean;
  onToggleWholeWord: () => void;
  showReplaceRow?: boolean;
  onToggleReplaceRow?: () => void;
  onClose: () => void;
  isDarkMode: boolean;
  lang: "cs" | "en";
  replaceFeedback?: string | null;
}

export function FindReplaceBar({
  mode,
  searchQuery,
  onSearchQueryChange,
  replaceQuery = "",
  onReplaceQueryChange,
  totalMatches,
  activeMatchIndex,
  onNextMatch,
  onPrevMatch,
  onReplace,
  onReplaceAll,
  caseSensitive,
  onToggleCaseSensitive,
  wholeWord,
  onToggleWholeWord,
  showReplaceRow = false,
  onToggleReplaceRow,
  onClose,
  isDarkMode,
  lang,
  replaceFeedback,
}: FindReplaceBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus search input when find bar opens
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch();
      } else {
        onNextMatch();
      }
    }
  };

  const handleReplaceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        onReplaceAll?.();
      } else {
        onReplace?.();
      }
    }
  };

  const texts = {
    cs: {
      findPlaceholder: mode === "input" ? "Hledat v editoru (text nebo akordy)..." : "Hledat ve výstupu...",
      replacePlaceholder: "Nahradit čím...",
      noMatches: "0 shod",
      matchCount: `${totalMatches > 0 ? activeMatchIndex + 1 : 0} z ${totalMatches}`,
      prevTooltip: "Předchozí shoda (Shift+Enter)",
      nextTooltip: "Další shoda (Enter)",
      matchCaseTooltip: "Rozlišovat velikost písmen (Aa)",
      wholeWordTooltip: "Pouze celá slova (\\b)",
      toggleReplaceTooltip: "Zobrazit nahrazování",
      replaceBtn: "Nahradit",
      replaceAllBtn: "Nahradit vše",
      closeTooltip: "Zavřít hledání (Esc)",
    },
    en: {
      findPlaceholder: mode === "input" ? "Find in editor (lyrics or chords)..." : "Find in output...",
      replacePlaceholder: "Replace with...",
      noMatches: "0 matches",
      matchCount: `${totalMatches > 0 ? activeMatchIndex + 1 : 0} of ${totalMatches}`,
      prevTooltip: "Previous match (Shift+Enter)",
      nextTooltip: "Next match (Enter)",
      matchCaseTooltip: "Match case (Aa)",
      wholeWordTooltip: "Match whole word (\\b)",
      toggleReplaceTooltip: "Toggle replace mode",
      replaceBtn: "Replace",
      replaceAllBtn: "Replace all",
      closeTooltip: "Close find (Esc)",
    },
  }[lang];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={`border-b px-2.5 py-2 text-xs transition-colors z-20 shadow-xs ${
        isDarkMode
          ? "bg-slate-900/95 border-slate-700 text-slate-200"
          : "bg-slate-50/95 border-slate-200 text-slate-800"
      }`}
      id={`find-replace-bar-${mode}`}
    >
      <div className="flex flex-col gap-1.5 max-w-full">
        {/* Top Row: Find Input + Match Counter + Navigation + Toggles + Close */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          {/* Search Input Box */}
          <div
            className={`flex items-center gap-1.5 flex-1 min-w-[170px] px-2 py-1 rounded-md border text-xs transition-all focus-within:ring-1 focus-within:ring-indigo-500 ${
              isDarkMode
                ? "bg-slate-950 border-slate-700/80 text-slate-100"
                : "bg-white border-slate-300 text-slate-900"
            }`}
          >
            <Search className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={texts.findPlaceholder}
              className="bg-transparent border-none outline-none w-full text-xs font-mono placeholder:font-sans placeholder:text-slate-400 dark:placeholder:text-slate-500"
              spellCheck="false"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchQueryChange("");
                  searchInputRef.current?.focus();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Match Counter Badge */}
          <div
            className={`px-2 py-1 rounded text-[11px] font-mono shrink-0 select-none ${
              totalMatches > 0
                ? isDarkMode
                  ? "bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold"
                : searchQuery
                ? isDarkMode
                  ? "bg-rose-950/40 text-rose-300 border border-rose-900/40"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
                : isDarkMode
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            {searchQuery ? texts.matchCount : texts.noMatches}
          </div>

          {/* Navigation Controls: Prev / Next */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={onPrevMatch}
              disabled={totalMatches === 0}
              title={texts.prevTooltip}
              className={`p-1 rounded border transition-all cursor-pointer ${
                totalMatches === 0
                  ? "opacity-40 cursor-not-allowed border-transparent"
                  : isDarkMode
                  ? "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200"
                  : "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
              }`}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onNextMatch}
              disabled={totalMatches === 0}
              title={texts.nextTooltip}
              className={`p-1 rounded border transition-all cursor-pointer ${
                totalMatches === 0
                  ? "opacity-40 cursor-not-allowed border-transparent"
                  : isDarkMode
                  ? "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200"
                  : "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
              }`}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Options Toggles: Case Sensitive & Whole Word */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={onToggleCaseSensitive}
              title={texts.matchCaseTooltip}
              className={`px-1.5 py-1 rounded text-[11px] font-bold font-mono border transition-all cursor-pointer ${
                caseSensitive
                  ? isDarkMode
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-indigo-600 border-indigo-600 text-white"
                  : isDarkMode
                  ? "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-400 hover:text-slate-200"
                  : "bg-white hover:bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900"
              }`}
            >
              <CaseSensitive className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onToggleWholeWord}
              title={texts.wholeWordTooltip}
              className={`px-1.5 py-1 rounded text-[11px] font-bold font-mono border transition-all cursor-pointer ${
                wholeWord
                  ? isDarkMode
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-indigo-600 border-indigo-600 text-white"
                  : isDarkMode
                  ? "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-400 hover:text-slate-200"
                  : "bg-white hover:bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900"
              }`}
            >
              <WholeWord className="w-3.5 h-3.5" />
            </button>

            {/* Toggle Replace Row (Only in Input mode) */}
            {mode === "input" && onToggleReplaceRow && (
              <button
                type="button"
                onClick={onToggleReplaceRow}
                title={texts.toggleReplaceTooltip}
                className={`p-1 rounded border transition-all cursor-pointer ${
                  showReplaceRow
                    ? isDarkMode
                      ? "bg-indigo-950 border-indigo-600 text-indigo-300"
                      : "bg-indigo-100 border-indigo-300 text-indigo-800"
                    : isDarkMode
                    ? "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-400 hover:text-slate-200"
                    : "bg-white hover:bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900"
                }`}
              >
                <Replace className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            title={texts.closeTooltip}
            className={`p-1 rounded hover:opacity-80 transition-opacity ml-auto shrink-0 cursor-pointer ${
              isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Row: Replace Input + Replace Buttons (when showReplaceRow is true in Input mode) */}
        {mode === "input" && showReplaceRow && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 pt-0.5 flex-wrap sm:flex-nowrap"
          >
            <div
              className={`flex items-center gap-1.5 flex-1 min-w-[170px] px-2 py-1 rounded-md border text-xs transition-all focus-within:ring-1 focus-within:ring-indigo-500 ${
                isDarkMode
                  ? "bg-slate-950 border-slate-700/80 text-slate-100"
                  : "bg-white border-slate-300 text-slate-900"
              }`}
            >
              <Replace className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
              <input
                ref={replaceInputRef}
                type="text"
                value={replaceQuery}
                onChange={(e) => onReplaceQueryChange?.(e.target.value)}
                onKeyDown={handleReplaceKeyDown}
                placeholder={texts.replacePlaceholder}
                className="bg-transparent border-none outline-none w-full text-xs font-mono placeholder:font-sans placeholder:text-slate-400 dark:placeholder:text-slate-500"
                spellCheck="false"
              />
              {replaceQuery && (
                <button
                  type="button"
                  onClick={() => onReplaceQueryChange?.("")}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onReplace}
                disabled={totalMatches === 0}
                className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                  totalMatches === 0
                    ? "opacity-40 cursor-not-allowed border-transparent"
                    : isDarkMode
                    ? "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-100"
                    : "bg-white hover:bg-slate-100 border-slate-300 text-slate-800"
                }`}
              >
                {texts.replaceBtn}
              </button>

              <button
                type="button"
                onClick={onReplaceAll}
                disabled={totalMatches === 0}
                className={`px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                  totalMatches === 0
                    ? "opacity-40 cursor-not-allowed border-transparent"
                    : isDarkMode
                    ? "bg-indigo-900/70 hover:bg-indigo-900 border-indigo-700 text-indigo-200"
                    : "bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-800"
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{texts.replaceAllBtn}</span>
              </button>
            </div>

            {replaceFeedback && (
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded animate-pulse ${
                isDarkMode ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}>
                {replaceFeedback}
              </span>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

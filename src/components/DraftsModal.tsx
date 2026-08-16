import React from "react";
import { motion } from "motion/react";
import { X, Clock, Save, Trash2, ArchiveRestore, Sparkles, Sliders } from "lucide-react";
import { Draft } from "../utils/useDrafts";

interface DraftsModalProps {
  drafts: Draft[];
  isDarkMode: boolean;
  lang: "cs" | "en";
  onClose: () => void;
  onRestore: (text: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onClearAllAndResetEditor?: () => void;
  onManualSave: () => void;
}

export function DraftsModal({
  drafts,
  isDarkMode,
  lang,
  onClose,
  onRestore,
  onDelete,
  onClearAll,
  onClearAllAndResetEditor,
  onManualSave
}: DraftsModalProps) {
  const t = {
    cs: {
      title: "Historie návrhů a milníků",
      autoSave: "Automaticky uloženo",
      manualSave: "Ručně uloženo",
      milestoneSave: "Bod obratu / Akce",
      noDrafts: "Zatím nejsou uloženy žádné návrhy ani milníky.",
      saveDraftBtn: "Uložit aktuální stav",
      clearAllBtn: "Smazat všechny návrhy",
      clearAllAndResetBtn: "Smazat návrhy a vyčistit editor",
      restoreBtn: "Obnovit",
      deleteBtn: "Smazat",
      statusCleared: "Návrhy byly smazány. Nové automatické ukládání začne až po úpravě textu.",
    },
    en: {
      title: "Drafts & Milestone History",
      autoSave: "Auto-saved",
      manualSave: "Manually saved",
      milestoneSave: "Milestone / Action",
      noDrafts: "No drafts or milestones saved yet.",
      saveDraftBtn: "Save current state",
      clearAllBtn: "Delete all drafts",
      clearAllAndResetBtn: "Delete drafts & clear editor",
      restoreBtn: "Restore",
      deleteBtn: "Delete",
      statusCleared: "Drafts have been cleared. Auto-save will resume when new text is typed.",
    }
  };

  const currentT = t[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs font-sans overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className={`relative w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden ${
          isDarkMode ? "bg-slate-900 border border-slate-700/50" : "bg-white border border-slate-200"
        }`}
      >
        {/* Header */}
        <div className={`px-4 py-3 sm:px-5 sm:py-4 border-b flex items-center justify-between shrink-0 ${
          isDarkMode ? "bg-slate-950 border-slate-700" : "bg-slate-50 border-slate-300"
        }`}>
          <div className="flex items-center gap-2">
            <ArchiveRestore className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} />
            <h3 className={`font-bold text-sm sm:text-base ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>
              {currentT.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-all cursor-pointer ${isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-slate-200 text-slate-500 hover:text-slate-800"}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[60vh]">
          {drafts.length === 0 ? (
            <div className={`text-center py-8 flex flex-col items-center gap-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              <Sparkles className="w-8 h-8 opacity-40 text-indigo-400 mb-1" />
              <p className="font-medium text-sm">{currentT.noDrafts}</p>
              <p className="text-xs opacity-75 max-w-xs">{currentT.statusCleared}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {drafts.map(draft => {
                const isAuto = draft.type === "auto";
                const isMilestone = draft.type === "milestone";
                const date = new Date(draft.timestamp);
                const timeString = date.toLocaleTimeString(lang === 'cs' ? 'cs-CZ' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const dateString = date.toLocaleDateString(lang === 'cs' ? 'cs-CZ' : 'en-US');
                
                return (
                  <div key={draft.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                    isDarkMode ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      {isAuto ? (
                        <Clock className={`w-8 h-8 p-1.5 shrink-0 rounded-full ${isDarkMode ? "bg-indigo-900/50 text-indigo-400" : "bg-indigo-100 text-indigo-700"}`} />
                      ) : isMilestone ? (
                        <Sliders className={`w-8 h-8 p-1.5 shrink-0 rounded-full ${isDarkMode ? "bg-amber-900/50 text-amber-400" : "bg-amber-100 text-amber-700"}`} />
                      ) : (
                        <Save className={`w-8 h-8 p-1.5 shrink-0 rounded-full ${isDarkMode ? "bg-teal-900/50 text-teal-400" : "bg-teal-100 text-teal-700"}`} />
                      )}
                      <div className="min-w-0">
                        <div className={`text-sm font-semibold truncate ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                          {isAuto ? currentT.autoSave : isMilestone ? (draft.title || currentT.milestoneSave) : currentT.manualSave}
                        </div>
                        {isMilestone && draft.title && (
                          <div className={`text-xs font-medium text-amber-500 dark:text-amber-400 truncate`}>
                            {currentT.milestoneSave}
                          </div>
                        )}
                        <div className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                          {dateString} {timeString}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onDelete(draft.id)}
                        title={currentT.deleteBtn}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          isDarkMode ? "hover:bg-slate-700 text-slate-400 hover:text-red-400" : "hover:bg-slate-200 text-slate-500 hover:text-red-600"
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          onRestore(draft.text);
                          onClose();
                        }}
                        className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                          isDarkMode 
                            ? "bg-indigo-600 hover:bg-indigo-500 text-white" 
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      >
                        {currentT.restoreBtn}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-4 py-3 sm:px-5 sm:py-4 border-t flex flex-col gap-2.5 ${
          isDarkMode ? "bg-slate-950/50 border-slate-700" : "bg-slate-50 border-slate-300"
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <button
              onClick={() => {
                onClearAll();
              }}
              disabled={drafts.length === 0}
              className={`w-full sm:w-auto text-xs sm:text-sm font-semibold px-3 py-2 rounded-md transition-colors cursor-pointer text-center ${
                drafts.length === 0 
                  ? "opacity-40 cursor-not-allowed text-slate-500" 
                  : isDarkMode ? "hover:bg-slate-800 text-rose-400" : "hover:bg-rose-50 text-rose-600 border border-rose-200 dark:border-transparent"
              }`}
            >
              {currentT.clearAllBtn}
            </button>

            <button
              onClick={() => {
                onManualSave();
              }}
              className={`w-full sm:w-auto px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-600" 
                  : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"
              }`}
            >
              <Save className="w-4 h-4" />
              {currentT.saveDraftBtn}
            </button>
          </div>

          {onClearAllAndResetEditor && (
            <button
              onClick={() => {
                onClearAllAndResetEditor();
                onClose();
              }}
              className={`w-full py-1.5 px-3 text-xs font-semibold rounded transition-colors text-center cursor-pointer border ${
                isDarkMode 
                  ? "bg-slate-900/60 border-slate-700 text-slate-400 hover:text-rose-300 hover:border-rose-900/60" 
                  : "bg-white border-slate-300 text-slate-600 hover:text-rose-600 hover:border-rose-300"
              }`}
            >
              {currentT.clearAllAndResetBtn}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

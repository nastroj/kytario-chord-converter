import React from "react";
import { motion } from "motion/react";
import { X, Music, Hash } from "lucide-react";

interface SettingsBarProps {
  notation: "czech" | "english";
  onNotationChange: (n: "czech" | "english") => void;
  accidentals: "original" | "sharps" | "flats";
  onAccidentalsChange: (a: "original" | "sharps" | "flats") => void;
  convertAngloToEuropean: boolean;
  onConvertAngloChange: (val: boolean) => void;
  onClose: () => void;
  isDarkMode: boolean;
  lang: string;
}

export function SettingsBar({
  notation,
  onNotationChange,
  accidentals,
  onAccidentalsChange,
  convertAngloToEuropean,
  onConvertAngloChange,
  onClose,
  isDarkMode,
  lang
}: SettingsBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -6 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{ opacity: 0, height: 0, y: -6 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`border-b px-2.5 py-2 flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap text-xs font-sans shrink-0 ${
        isDarkMode ? "bg-slate-900/98 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
      }`}
      id="settings-inline-bar"
    >
      {/* Notation */}
      <div className="flex items-center gap-2">
        <Music className={`w-4 h-4 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} title={lang === "cs" ? "Notace" : "Notation"} />
        <div className={`flex rounded-md border overflow-hidden ${isDarkMode ? "border-slate-700" : "border-slate-300"}`}>
          <button
            onClick={() => onNotationChange("czech")}
            className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
              notation === "czech"
                ? "bg-indigo-600 text-white"
                : isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-750" : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            CZ (H/B)
          </button>
          <button
            onClick={() => onNotationChange("english")}
            className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors border-l ${
              notation === "english"
                ? "bg-indigo-600 text-white"
                : isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-750 border-slate-700" : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
            }`}
          >
            EN (B/Bb)
          </button>
        </div>
      </div>

      {/* Accidentals */}
      <div className="flex items-center gap-2">
        <Hash className={`w-4 h-4 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} title={lang === "cs" ? "Posuvky" : "Accidentals"} />
        <div className={`flex rounded-md border overflow-hidden ${isDarkMode ? "border-slate-700" : "border-slate-300"}`}>
          {(["original", "sharps", "flats"] as const).map((acc, idx) => (
            <button
              key={acc}
              onClick={() => onAccidentalsChange(acc)}
              className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors uppercase ${
                idx > 0 ? (isDarkMode ? "border-l border-slate-700" : "border-l border-slate-200") : ""
              } ${
                accidentals === acc
                  ? "bg-indigo-600 text-white"
                  : isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-750" : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {acc === "original" ? (lang === "cs" ? "Původní" : "Orig") : acc === "sharps" ? "♯" : "♭"}
            </button>
          ))}
        </div>
      </div>

      {/* Anglo conversion checkbox */}
      <label className={`flex items-center gap-1.5 cursor-pointer text-[11px] font-medium px-2.5 py-1 rounded-md border transition-colors ${
        isDarkMode ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}>
        <input
          type="checkbox"
          checked={convertAngloToEuropean}
          onChange={(e) => onConvertAngloChange(e.target.checked)}
          className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
        />
        <span>
          {lang === "cs" ? "B ➔ H" : "B ➔ H"}
        </span>
      </label>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        title={lang === "cs" ? "Zavřít" : "Close"}
        className={`p-1 rounded hover:opacity-80 transition-opacity ml-auto shrink-0 cursor-pointer ${
          isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

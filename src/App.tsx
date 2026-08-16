import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Music, 
  FileDown, 
  X, 
  BookOpen, 
  UploadCloud,
  AlertTriangle,
  Sun,
  Moon,
  Settings,
  ListOrdered, 
  Undo2, 
  Redo2, 
  ArchiveRestore,
  Search,
  Key,
  Trash2,
  Wand2
} from "lucide-react";
import { 
  convertToKytario, 
  detectFormatDetailed,
  FormatDetectionDetails,
  transposeSongContent,
  convertTargetFormat,
  isChord,
  isChordLine,
  noteToIndex,
  indexToNote,
  formatInputText
} from "./utils/converter";
import { useHistory } from "./utils/useHistory";
import { useDrafts } from "./utils/useDrafts";
import { DraftsModal } from "./components/DraftsModal";
import { parseSongSections, SongSection } from "./utils/sectionParser";
import { SectionMap } from "./components/SectionMap";
import { FindReplaceBar } from "./components/FindReplaceBar";
import { SettingsBar } from "./components/SettingsBar";
import {
  findMatchesInText,
  replaceAllInText,
  replaceSingleMatch,
  highlightText,
  highlightInputMatches
} from "./utils/searchHighlight";



const translations = {
  cs: {
    appTitle: "Kytario Chord Converter",
    editor: "Editor",
    input: "Vstup",
    output: "Výstup",
    autoFormat: "⚡ Auto formát",
    clear: "Vymazat",
    inputTitle: "Vstup: text a akordy",
    outputTitle: "Výstup: převedený text",
    format: "Formát:",
    placeholderInput: "Sem napište nebo vložte text písně s akordy...&#10;&#10;[Intro]&#10;C  G  Am  F&#10;&#10;[Verse 1]&#10;C             G&#10;Slunce svítí, den začíná,&#10;Am            F&#10;stará píseň v dálce zní.&#10;&#10;[Chorus]&#10;C         G&#10;Zpívej se mnou dál,&#10;Am        F&#10;hudba nám sílu dá.",
    placeholderKytario: "Zde se objeví automaticky převedená skladba ve formátu Kytario...",
    placeholderChordpro: "Zde se objeví automaticky převedená skladba ve formátu ChordPro [C]...",
    placeholderLyrics: "Zde se objeví automaticky převedená skladba ve formátu Chords Over Lyrics...",
    docs: "Dokumentace",
    help: "Nápověda",
    themeLight: "Přepnout na světlý režim",
    themeDark: "Přepnout na tmavý režim",
    docsTitle: "Zápis skladby v Kytariu — Pravidla",
    docsClose: "Zavřít",
    docsIntro: "Formátování skladeb na portálu Kytario.com nepodléhá barvám ani fontům, ale striktním značkovacím pravidlům:",
    docsChordsTitle: "🎸 Akordy a Notace",
    docsChordsDesc: "Akordy zapisujeme do složených závorek, např. {Em}, {Ami}, {C#m7}. Základní tón akordu i případný basový tón za lomítkem (např. {A/C#}, {G/H}) musí VŽDY začínat velkým písmenem. Pro moll akordy lze v nastavení zvolit zápis 'm' nebo 'mi'.",
    docsPositionsTitle: "📍 Pozice akordů",
    docsPositionsDesc: "Zapisují se přímo v textu tak, aby předcházely slovu/písmenu: {C}Slib{D}ujeme.",
    docsSectionsTitle: "📂 Sekce (Sloky & Refrény)",
    docsSectionsDesc: "Zpívané sekce začínají pomlčkou (zobrazování vždy) nebo plusem (jen pro mobily):\n- REF1, - REF2 (refrény)\n- 1., - 2. (sloky)\n- BRD (bridge), - INT (intro), - SOLO, - OUT (outro)",
    docsLinksTitle: "🔗 Odkazy na sekce",
    docsLinksDesc: "Pokud se refrén či sloka opakuje beze změny slov, odkazuje se v hranatých závorkách: [REF1] nebo [1.].",
    docsRepeatsTitle: "🔁 Repetice",
    docsRepeatsDesc: "Ohraničují se znaky |: a :|, s počtem opakování na konci, např. |: {Am} :| 3x.",
    docsAcappellaTitle: "🔇 A Cappella / Pauza",
    docsAcappellaDesc: "Text bez doprovodu nebo pauzu označujeme tónem {X} nebo {N.C.}.",
    tipTitle: "💡 Doporučení:",
    tipDesc: "Tento převodník plně podporuje automatickou detekci formátu, inteligentní transpozici akordů, kontrolu Kytario pravidel a přizpůsobení posuvek podle vašich preferencí.",
    download: "Stáhnout .txt",
    copy: "Kopírovat",
    copied: "Zkopírováno!",
    sourceFormat: "Zdrojový formát:",
    detected: "detekováno",
    unknown: "neznámý",
    transposeDown: "Snížit o půltón",
    transposeUp: "Zvýšit o půltón",
    settingsTitle: "Pokročilé nastavení převodu",
    settingsClose: "Uložit a zavřít",
    settingsButton: "Nastavení",
    notationLabel: "Hudební notace (Zápis akordů)",
    notationCzech: "Česká / středoevropská (H / B)",
    notationEnglish: "Anglo-americká (B / Bb)",
    accidentalsLabel: "Preferované posuvky",
    accidentalsOriginal: "Zachovat původní (podle předlohy)",
    accidentalsSharps: "Křížky (#, např. F#, C#)",
    accidentalsFlats: "Béčka (b, např. Gb, Db)",
    minorFormatLabel: "Zápis akordů v moll",
    minorFormatShort: "Krátké 'm' (např. Am, Em, C#m7)",
    minorFormatCzech: "České 'mi' (např. Ami, Emi, C#mi7)",
    convertAngloLabel: "Převést anglo-americký zápis not na evropský (B ➔ H, Bb ➔ B)",
    convertAngloDesc: "Automaticky převede akord B na H a Bb na B.",
    inputConversionLabel: "Převod zápisu na vstupu",
    transpositionLabel: "Transpozice tóniny",
    transpositionReset: "Vynulovat transpozici",
    tooltipTransposeValue: "Kliknutím vynulujete transpozici",
    tooltipSourceFormat: "Metoda zjištění formátu vstupu",
    tooltipTargetFormat: "Formát, do kterého se píseň převede",
    tooltipSettings: "Změnit notaci (H/B) a posuvky (#/b)",
    tooltipDocs: "Zobrazit pravidla zápisu v Kytariu",
    tooltipTheme: "Změnit barevný motiv (Světlý / Tmavý)",
    tooltipLang: "Přepnout jazyk (CS / EN)",
    tooltipClear: "Vymazat veškerý text v editoru",
    tooltipCopy: "Kopírovat převedenou píseň do schránky",
    tooltipDownload: "Uložit píseň jako soubor .txt",
    openFile: "Otevřít",
    tooltipOpenFile: "Otevřít soubor písně (.txt, .chopro, .crd, .pro, .tab)",
    tooltipFormatText: "Automaticky naformátovat velikosti akordů",
    reorderSections: "Řadit sekce",
    tooltipReorder: "Zobrazit přehled sekcí a měnit jejich pořadí přetažením",
    tooltipDrafts: "Historie návrhů a milníků (automatické i ruční zálohy)",
    undo: "Zpět",
    redo: "Vpřed",
    tooltipUndo: "Vrátit zpět poslední změnu",
    tooltipRedo: "Opakovat vrácenou změnu",
    ambiguousFormatTitle: "Nejednoznačný formát vstupu",
    variantDetected: "Varianta zápisu:",
    switchTo: "Přepnout na",
    confidenceLabel: "Jistota detekce:",
    dismiss: "Skrýt",
    autoDetectedBadge: "Detekováno:",
    formatScore: "Skóre",
    find: "Hledat",
    findReplace: "Hledat & nahradit",
    tooltipFindInput: "Hledat a nahradit v editoru (Ctrl+F / Ctrl+H)",
    tooltipFindOutput: "Hledat v převedeném textu (Ctrl+F)",
    transposeKey: "Tónina:",
  },
  en: {
    appTitle: "Kytario Chord Converter",
    editor: "Editor",
    input: "Input",
    output: "Output",
    autoFormat: "⚡ Auto Format",
    clear: "Clear",
    inputTitle: "Input: text & chords",
    outputTitle: "Output: converted text",
    format: "Format:",
    placeholderInput: "Type or paste your song with chords here...&#10;&#10;[Intro]&#10;C  G  Am  F&#10;&#10;[Verse 1]&#10;C               G&#10;Morning sun is rising high,&#10;Am                F&#10;singing tunes into the sky.&#10;&#10;[Chorus]&#10;C            G&#10;Sing along with me tonight,&#10;Am           F&#10;everything will be alright.",
    placeholderKytario: "Here will appear the automatically converted song in Kytario format...",
    placeholderChordpro: "Here will appear the automatically converted song in ChordPro [C] format...",
    placeholderLyrics: "Here will appear the automatically converted song in Chords Over Lyrics format...",
    docs: "Documentation",
    help: "Help",
    themeLight: "Switch to light mode",
    themeDark: "Switch to dark mode",
    docsTitle: "Song notation in Kytario — Rules",
    docsClose: "Close",
    docsIntro: "Formatting songs on the Kytario.com portal does not rely on colors or fonts, but on strict markup rules:",
    docsChordsTitle: "🎸 Chords & Notation",
    docsChordsDesc: "Chords are written in curly braces, e.g. {Em}, {Ami}, {C#m7}. Both the root note and slash bass notes (e.g. {A/C#}, {G/H}) MUST be capitalized. Minor chord notation style ('m' vs 'mi') can be chosen in Settings.",
    docsPositionsTitle: "📍 Chord Positions",
    docsPositionsDesc: "They are written directly in the text, preceding the word/letter: {C}Prom{D}ise.",
    docsSectionsTitle: "📂 Sections (Verses & Choruses)",
    docsSectionsDesc: "Sung sections start with a hyphen (always shown) or a plus (mobile only):\n- REF1, - REF2 (choruses)\n- 1., - 2. (verses)\n- BRD (bridge), - INT (intro), - SOLO, - OUT (outro)",
    docsLinksTitle: "🔗 Section Links",
    docsLinksDesc: "If a chorus or verse repeats without changing lyrics, link to it in square brackets: [REF1] or [1.].",
    docsRepeatsTitle: "🔁 Repetitions",
    docsRepeatsDesc: "They are enclosed by characters |: and :|, with the repetition count at the end, e.g. |: {Am} :| 3x.",
    docsAcappellaTitle: "🔇 A Cappella / Pause",
    docsAcappellaDesc: "Unaccompanied text or pause is marked with note {X} or {N.C.}.",
    tipTitle: "💡 Recommendation:",
    tipDesc: "This converter fully supports automatic format detection, smart chord transposition, Kytario validation, and customizable accidental preferences.",
    download: "Download .txt",
    copy: "Copy Chords",
    copied: "Copied!",
    sourceFormat: "Source Format:",
    detected: "detected",
    unknown: "unknown",
    transposeDown: "Lower by semitone",
    transposeUp: "Raise by semitone",
    settingsTitle: "Advanced Conversion Settings",
    settingsClose: "Save & Close",
    settingsButton: "Settings",
    notationLabel: "Musical Notation System",
    notationCzech: "Central European (H / B)",
    notationEnglish: "Anglo-American (B / Bb)",
    accidentalsLabel: "Preferred Accidentals",
    accidentalsOriginal: "Keep originals (as in source)",
    accidentalsSharps: "Sharps (#, e.g. F#, C#)",
    accidentalsFlats: "Flats (b, e.g. Gb, Db)",
    minorFormatLabel: "Minor Chords Style",
    minorFormatShort: "Short 'm' (e.g., Am, Em, C#m7)",
    minorFormatCzech: "Czech 'mi' (e.g., Ami, Emi, C#mi7)",
    convertAngloLabel: "Convert Anglo-American notation to European (B ➔ H, Bb ➔ B)",
    convertAngloDesc: "Automatically converts chord B to H and Bb to B.",
    inputConversionLabel: "Input System Conversion",
    transpositionLabel: "Key Transposition",
    transpositionReset: "Reset transposition",
    tooltipTransposeValue: "Click to reset transposition to 0",
    tooltipSourceFormat: "Input format detection mode",
    tooltipTargetFormat: "Format to convert the song into",
    tooltipSettings: "Change notation (H/B) and accidentals (#/b)",
    tooltipDocs: "Show Kytario notation rules",
    tooltipTheme: "Toggle color theme (Light / Dark)",
    tooltipLang: "Switch language (CS / EN)",
    tooltipClear: "Clear all text in the editor",
    tooltipCopy: "Copy the converted song to clipboard",
    tooltipDownload: "Save the song as a .txt file",
    openFile: "Open",
    tooltipOpenFile: "Open song file (.txt, .chopro, .crd, .pro, .tab)",
    tooltipFormatText: "Auto-format chords and casing",
    reorderSections: "Reorder",
    tooltipReorder: "View song structure and drag-and-drop to reorder sections",
    tooltipDrafts: "Drafts & milestone history (auto & manual backups)",
    undo: "Undo",
    redo: "Redo",
    tooltipUndo: "Undo last change",
    tooltipRedo: "Redo last reverted change",
    ambiguousFormatTitle: "Ambiguous input format",
    variantDetected: "Notation variant:",
    switchTo: "Switch to",
    confidenceLabel: "Detection confidence:",
    dismiss: "Dismiss",
    autoDetectedBadge: "Detected:",
    formatScore: "Score",
    find: "Find",
    findReplace: "Find & Replace",
    tooltipFindInput: "Find and replace in editor (Ctrl+F / Ctrl+H)",
    tooltipFindOutput: "Find in output text (Ctrl+F)",
    transposeKey: "Key:",
  }
};

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right" | "top-right" | "top-left" | "bottom-right" | "bottom-left";
  isDarkMode: boolean;
}

function Tooltip({ content, children, position = "top", isDarkMode }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [isTouch, setIsTouch] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none) and (pointer: coarse)").matches);
  }, []);

  const handleMouseEnter = () => {
    if (isTouch) return;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let top = position.startsWith("bottom") ? rect.bottom + 6 : rect.top - 6;
        let left = rect.left + rect.width / 2;
        if (position.includes("right")) left = rect.right;
        if (position.includes("left")) left = rect.left;
        setCoords({ top, left });
      }
      setShow(true);
    }, 350);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setShow(false);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setShow(false);
  };

  useEffect(() => {
    if (show && tooltipRef.current && triggerRef.current) {
      const tRect = tooltipRef.current.getBoundingClientRect();
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let newLeft = triggerRect.left + triggerRect.width / 2 - tRect.width / 2;
      let newTop = position.startsWith("bottom") ? triggerRect.bottom + 6 : triggerRect.top - tRect.height - 6;

      if (position.includes("right")) {
        newLeft = triggerRect.right - tRect.width;
      } else if (position.includes("left")) {
        newLeft = triggerRect.left;
      }

      if (newLeft < 8) newLeft = 8;
      if (newLeft + tRect.width > vw - 8) newLeft = vw - tRect.width - 8;
      if (newTop < 8) newTop = triggerRect.bottom + 6;
      if (newTop + tRect.height > vh - 8) newTop = triggerRect.top - tRect.height - 6;

      tooltipRef.current.style.left = `${newLeft}px`;
      tooltipRef.current.style.top = `${newTop}px`;
    }
  }, [show, position]);

  return (
    <div 
      ref={triggerRef}
      className="inline-flex items-center" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => {
        if (isTouch) return;
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setCoords({ top: rect.top - 6, left: rect.left + rect.width / 2 });
        }
        setShow(true);
      }}
      onBlur={() => setShow(false)}
      onClick={hideTooltip}
    >
      {children}
      {show && createPortal(
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          style={{ position: 'fixed', top: coords.top, left: coords.left }}
          className={`pointer-events-none z-[9999] px-2.5 py-1.5 rounded shadow-xl text-[11px] font-sans font-medium text-center whitespace-normal break-words max-w-[220px] leading-normal border transition-colors ${
            isDarkMode 
              ? "bg-slate-800 border-slate-700 text-slate-100 shadow-slate-950/50" 
              : "bg-slate-900 border-slate-900 text-white shadow-slate-900/20"
          }`}
        >
          {content}
        </motion.div>,
        document.body
      )}
    </div>
  );
}

const renderLine = (
  line: string, 
  format: "kytario" | "chordpro" | "chords_over_lyrics", 
  isDarkMode: boolean, 
  index: number,
  searchQuery = "",
  caseSensitive = false,
  wholeWord = false,
  currentMatchIndex = -1,
  globalMatchCounter: { count: number } = { count: 0 }
) => {
  const hl = (txt: string) => {
    if (!searchQuery) return txt;
    return highlightText(txt, searchQuery, caseSensitive, wholeWord, currentMatchIndex, globalMatchCounter, isDarkMode);
  };

  const trimmed = line.trim();
  if (line === "") {
    return <div key={index} className="h-5 select-text">&nbsp;</div>;
  }

  // 1. Check for Kytario headers: lines starting with "- " or "+ "
  if (format === "kytario" && (trimmed.startsWith("- ") || trimmed.startsWith("+ "))) {
    return (
      <div key={index} className="text-emerald-600 dark:text-emerald-400 font-bold font-sans my-1 select-text whitespace-pre">
        {hl(line)}
      </div>
    );
  }

  // 2. Check for bracketed or braced headers in ChordPro or chords_over_lyrics: e.g. [Intro], [Verse 1], [Chorus], [Bridge], [Bridges]
  const isBracketedHeader = (() => {
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const inner = trimmed.slice(1, -1).trim();
      if (isChord(inner)) return false;
      const innerTokens = inner.split(/\s+/);
      if (innerTokens.some(t => isChord(t))) return false;
      return true;
    }
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const inner = trimmed.slice(1, -1).trim();
      if (/^(soc|eoc|start_of_chorus|end_of_chorus|c:|comment:|title:|subtitle:|key:|tempo:)/i.test(inner)) return true;
      if (!isChord(inner) && !inner.includes(" ")) return true;
    }
    return false;
  })();

  if (isBracketedHeader) {
    return (
      <div key={index} className="text-emerald-600 dark:text-emerald-400 font-bold font-sans my-1 select-text whitespace-pre">
        {hl(line)}
      </div>
    );
  }

  // 3. Check for section header lines in chords_over_lyrics (e.g. "Bridge:", "Chorus:", "Verse 1")
  if (format === "chords_over_lyrics") {
    const clean = trimmed.replace(/:$/, "").trim();
    const isHeaderWord = /^(intro|verse|chorus|bridge|bridges|outro|solo|refrain|pre-chorus|interlude|refrém|sloka|refr|refrén|sólo|mezihra|sloka\s*\d*|refrén\s*\d*|verse\s*\d*|chorus\s*\d*|bridge\s*\d*)/i.test(clean);
    if (isHeaderWord && !isChordLine(line) && !isChord(clean)) {
      return (
        <div key={index} className="text-emerald-600 dark:text-emerald-400 font-bold font-sans my-1 select-text whitespace-pre">
          {hl(line)}
        </div>
      );
    }
  }

  // 4. Chord lines (specifically in plain text format)
  if (format === "chords_over_lyrics" && isChordLine(line)) {
    const parts = line.split(/(\s+|\|:|:\||[\|])/);
    return (
      <div key={index} className="leading-relaxed select-text whitespace-pre">
        {parts.map((part, pIdx) => {
          if (!part || part.trim() === "") {
            return <span key={pIdx}>{part}</span>;
          }
          if (part === "|:" || part === ":|" || part === "|") {
            return (
              <span key={pIdx} className="text-amber-600 dark:text-amber-400 font-bold font-mono">
                {hl(part)}
              </span>
            );
          }
          if (/^\d+x$/i.test(part.trim())) {
            return (
              <span key={pIdx} className="text-amber-600 dark:text-amber-400 font-mono font-semibold">
                {hl(part)}
              </span>
            );
          }
          if (isChord(part)) {
            return (
              <span key={pIdx} className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                {hl(part)}
              </span>
            );
          }
          return <span key={pIdx}>{hl(part)}</span>;
        })}
      </div>
    );
  }

  // 5. Lines with bracketed or brace chords (e.g., ChordPro [C], Kytario {C}, or inline chords)
  const tokenRegex = /(\[[^\]]+\]|\{[^\}]+\}|\<[^\>]+\>)/g;
  const parts = line.split(tokenRegex);

  if (parts.length > 1) {
    const nodes: React.ReactNode[] = [];
    if (parts[0]) {
      nodes.push(<span key="p-0">{hl(parts[0])}</span>);
    }

    for (let i = 1; i < parts.length; i += 2) {
      const token = parts[i];
      const nextText = parts[i + 1] || "";
      
      const inner = token.slice(1, -1).trim();
      const openChar = token[0];
      const closeChar = token[token.length - 1];

      // Check if it's a section link in Kytario like [REF1], [1.], [2.], [BRD1]
      const isKytarioSectionLink = openChar === "[" && closeChar === "]" && /^(REF\d*|\d+\.|BRD\d*|INT|OUT|SOLO|PRE)$/i.test(inner);
      
      // Check if inner is a single chord or multiple chords (e.g. {A E Bm})
      const isSingleChord = isChord(inner);
      const innerTokens = inner.split(/(\s+)/);
      const isMultiChord = !isSingleChord && innerTokens.some(t => t.trim().length > 0 && isChord(t.trim()));

      if (isKytarioSectionLink) {
        const linkEl = (
          <span key={`link-${i}`} className="text-emerald-600 dark:text-emerald-400 font-bold font-sans">
            {hl(token)}
          </span>
        );
        nodes.push(linkEl);
        if (nextText) {
          nodes.push(<span key={`text-${i}`}>{hl(nextText)}</span>);
        }
      } else if (isSingleChord) {
        const chordEl = (
          <span key={`chord-${i}`} className="inline">
            <span className="text-indigo-600/40 dark:text-indigo-400/40 font-mono">{openChar}</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{hl(inner)}</span>
            <span className="text-indigo-600/40 dark:text-indigo-400/40 font-mono">{closeChar}</span>
          </span>
        );
        nodes.push(chordEl);
        if (nextText) {
          nodes.push(<span key={`text-${i}`}>{hl(nextText)}</span>);
        }
      } else if (isMultiChord) {
        // Render multiple chords inside brackets/braces
        const multiChordEl = (
          <span key={`multi-${i}`} className="inline">
            <span className="text-indigo-600/40 dark:text-indigo-400/40 font-mono">{openChar}</span>
            {innerTokens.map((t, tIdx) => {
              if (isChord(t)) {
                return <span key={tIdx} className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{hl(t)}</span>;
              }
              return <span key={tIdx}>{hl(t)}</span>;
            })}
            <span className="text-indigo-600/40 dark:text-indigo-400/40 font-mono">{closeChar}</span>
          </span>
        );
        nodes.push(multiChordEl);
        if (nextText) {
          nodes.push(<span key={`text-${i}`}>{hl(nextText)}</span>);
        }
      } else {
        const directiveEl = (
          <span key={`dir-${i}`} className="text-emerald-600 dark:text-emerald-400 font-bold font-sans">
            {hl(token)}
          </span>
        );
        nodes.push(directiveEl);
        if (nextText) {
          nodes.push(<span key={`text-${i}`}>{hl(nextText)}</span>);
        }
      }
    }

    return (
      <div key={index} className="leading-relaxed select-text whitespace-pre">
        {nodes}
      </div>
    );
  }

  // 5. Standard lyric line (preserve spaces & no-wrap)
  return (
    <div key={index} className={`leading-relaxed select-text whitespace-pre ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
      {hl(line)}
    </div>
  );
};

export default function App() {
  const { 
    state: sourceText, 
    set: setSourceText, 
    undo: undoSourceText, 
    redo: redoSourceText, 
    canUndo: canUndoSourceText, 
    canRedo: canRedoSourceText,
    saveHistory: saveSourceTextHistory
  } = useHistory("");

  // Restore latest auto-save on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem("kytario_drafts");
      if (stored) {
        const parsed = JSON.parse(stored);
        const autoSave = parsed.find((d: any) => d.type === "auto");
        if (autoSave && autoSave.text) {
          setSourceText(autoSave.text);
        }
      }
    } catch (e) {
      console.error("Failed to restore draft", e);
    }
  }, []);
  const srcTextareaRef = useRef<HTMLTextAreaElement>(null);
  const destTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileOpen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const formatted = formatInputText(content, { convertAngloToEuropean, minorFormat: notation === "czech" ? "mi" : "m" });
        saveSourceTextHistory(formatted);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Language State
  const [lang, setLang] = useState<"cs" | "en">(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("lang");
      if (saved === "cs" || saved === "en") return saved;
    }
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language.slice(0, 2);
      if (browserLang === "cs") return "cs";
    }
    return "cs";
  });

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.title = lang === "cs" 
      ? "Kytario Chord Converter | Převodník a transpozice akordů pro Kytario.com" 
      : "Kytario Chord Converter | Transpose and chord format converter";
  }, [lang]);


  const [selectedFormat, setSelectedFormat] = useState<"auto" | "chordpro" | "ultimateguitar" | "kytario">("auto");
  const [detectedFormat, setDetectedFormat] = useState<"chordpro" | "ultimateguitar" | "kytario">("ultimateguitar");
  const [targetFormat, setTargetFormat] = useState<"kytario" | "chordpro" | "chords_over_lyrics">("kytario");
  
  // Theme Toggle State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Conversion state
  const [kytarioOutput, setKytarioOutput] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  
  // Transpose state
  const [transposeSemitones, setTransposeSemitones] = useState(0);

  // Settings / Chord System Preference State
  const [notation, setNotation] = useState<"czech" | "english">(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("notation");
      if (saved === "czech" || saved === "english") return saved;
    }
    return "czech";
  });

  const [accidentals, setAccidentals] = useState<"original" | "sharps" | "flats">(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("accidentals");
      if (saved === "original" || saved === "sharps" || saved === "flats") return saved;
    }
    return "original";
  });

  const [convertAngloToEuropean, setConvertAngloToEuropean] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("convertAngloToEuropean");
      return saved === "true";
    }
    return false;
  });



  const [showSettingsBar, setShowSettingsBar] = useState(false);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSectionMap, setShowSectionMap] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("showSectionMap") === "true";
    }
    return false;
  });
  const { drafts, saveManualDraft, saveMilestoneDraft, deleteDraft, clearAllDrafts, clearAutoSave } = useDrafts(sourceText);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem("showSectionMap", String(showSectionMap));
  }, [showSectionMap]);

  const songSections = React.useMemo(() => {
    return parseSongSections(sourceText, lang);
  }, [sourceText, lang]);

  const handleJumpToSection = (section: SongSection) => {
    setActiveSectionIndex(section.index - 1);
    if (srcTextareaRef.current) {
      const textarea = srcTextareaRef.current;
      textarea.focus();
      textarea.setSelectionRange(section.startIndex, section.endIndex);
      const totalLength = Math.max(1, sourceText.length);
      const ratio = section.startIndex / totalLength;
      textarea.scrollTop = ratio * (textarea.scrollHeight - textarea.clientHeight);
    }
  };

  const handleReorderSections = (newSections: SongSection[]) => {
    const newSourceText = newSections.map(s => s.rawText).join("\n\n");
    saveMilestoneDraft(lang === 'cs' ? 'Přerovnání sekcí' : 'Section Reordering', newSourceText);
    saveSourceTextHistory(newSourceText);
  };

  useEffect(() => {
    localStorage.setItem("notation", notation);
  }, [notation]);

  useEffect(() => {
    localStorage.setItem("accidentals", accidentals);
  }, [accidentals]);

  useEffect(() => {
    localStorage.setItem("convertAngloToEuropean", String(convertAngloToEuropean));
  }, [convertAngloToEuropean]);



  
  // Feedback / Async states
  const [isCopied, setIsCopied] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [formatDetails, setFormatDetails] = useState<FormatDetectionDetails | null>(null);
  const [showAmbiguityNotice, setShowAmbiguityNotice] = useState(true);

  // Search & Replace States for Input Editor
  const [showInputFindBar, setShowInputFindBar] = useState(false);
  const [inputSearchQuery, setInputSearchQuery] = useState("");
  const [inputReplaceQuery, setInputReplaceQuery] = useState("");
  const [inputCaseSensitive, setInputCaseSensitive] = useState(false);
  const [inputWholeWord, setInputWholeWord] = useState(false);
  const [inputActiveMatchIndex, setInputActiveMatchIndex] = useState(0);
  const [showInputReplaceRow, setShowInputReplaceRow] = useState(true);
  const [inputReplaceFeedback, setInputReplaceFeedback] = useState<string | null>(null);

  // Search States for Output View
  const [showOutputFindBar, setShowOutputFindBar] = useState(false);
  const [outputSearchQuery, setOutputSearchQuery] = useState("");
  const [outputCaseSensitive, setOutputCaseSensitive] = useState(false);
  const [outputWholeWord, setOutputWholeWord] = useState(false);
  const [outputActiveMatchIndex, setOutputActiveMatchIndex] = useState(0);

  // Calculate matches for Input
  const inputMatches = useMemo(() => {
    return findMatchesInText(sourceText, inputSearchQuery, inputCaseSensitive, inputWholeWord);
  }, [sourceText, inputSearchQuery, inputCaseSensitive, inputWholeWord]);

  // Adjust active match index if match count changes
  useEffect(() => {
    if (inputActiveMatchIndex >= inputMatches.length) {
      setInputActiveMatchIndex(Math.max(0, inputMatches.length - 1));
    }
  }, [inputMatches.length]);

  // Highlight and scroll textarea to current input match
  const highlightInputMatch = (matchIndex: number) => {
    if (!srcTextareaRef.current || inputMatches.length === 0) return;
    const match = inputMatches[matchIndex];
    if (match) {
      const textarea = srcTextareaRef.current;
      
      // Select the match range
      try {
        textarea.setSelectionRange(match.start, match.end);
      } catch {
        // ignore
      }
      
      // Calculate line metrics to scroll into center view
      const textBefore = sourceText.substring(0, match.start);
      const lineIndex = (textBefore.match(/\n/g) || []).length;
      const totalLines = Math.max(1, (sourceText.match(/\n/g) || []).length + 1);
      
      const computedLineHeight = textarea.scrollHeight / totalLines;
      const targetScrollTop = (lineIndex * computedLineHeight) - (textarea.clientHeight / 2) + (computedLineHeight / 2);
      
      const lastLineBreak = textBefore.lastIndexOf("\n");
      const charInLine = lastLineBreak === -1 ? match.start : match.start - lastLineBreak - 1;
      const approxCharWidth = 8;
      const targetScrollLeft = Math.max(0, (charInLine * approxCharWidth) - (textarea.clientWidth / 2));
      
      textarea.scrollTo({
        top: Math.max(0, targetScrollTop),
        left: targetScrollLeft,
        behavior: "smooth"
      });

      // Sync backdrop overlay scroll if available
      const backdrop = document.getElementById("source-textarea-backdrop");
      if (backdrop) {
        backdrop.scrollTo({
          top: Math.max(0, targetScrollTop),
          left: targetScrollLeft,
          behavior: "smooth"
        });
      }
    }
  };

  // Automatically select and center the active match when input search changes or find bar opens
  useEffect(() => {
    if (showInputFindBar && inputSearchQuery && inputMatches.length > 0) {
      highlightInputMatch(inputActiveMatchIndex);
    }
  }, [inputActiveMatchIndex, inputSearchQuery, showInputFindBar, inputMatches.length, inputCaseSensitive, inputWholeWord]);

  const handleInputNextMatch = () => {
    if (inputMatches.length === 0) return;
    const nextIdx = (inputActiveMatchIndex + 1) % inputMatches.length;
    setInputActiveMatchIndex(nextIdx);
    highlightInputMatch(nextIdx);
  };

  const handleInputPrevMatch = () => {
    if (inputMatches.length === 0) return;
    const prevIdx = (inputActiveMatchIndex - 1 + inputMatches.length) % inputMatches.length;
    setInputActiveMatchIndex(prevIdx);
    highlightInputMatch(prevIdx);
  };

  const handleInputReplace = () => {
    if (inputMatches.length === 0) return;
    const match = inputMatches[inputActiveMatchIndex];
    if (match) {
      const newText = replaceSingleMatch(sourceText, match, inputReplaceQuery);
      saveSourceTextHistory(newText);
      setInputReplaceFeedback(lang === "cs" ? "Nahrazeno" : "Replaced");
      setTimeout(() => setInputReplaceFeedback(null), 1500);
    }
  };

  const handleInputReplaceAll = () => {
    if (!inputSearchQuery || inputMatches.length === 0) return;
    const { result, count } = replaceAllInText(sourceText, inputSearchQuery, inputReplaceQuery, inputCaseSensitive, inputWholeWord);
    if (count > 0) {
      saveMilestoneDraft(lang === 'cs' ? `Hromadné nahrazení (${count}x)` : `Find & Replace (${count}x)`, result);
      saveSourceTextHistory(result);
      setInputReplaceFeedback(lang === "cs" ? `Nahrazeno ${count} výskytů` : `Replaced ${count} occurrences`);
      setTimeout(() => setInputReplaceFeedback(null), 2000);
    }
  };

  // Auto-detect format and run programmatic converter on input changes
  useEffect(() => {
    const details = detectFormatDetailed(sourceText);
    setFormatDetails(details);
    const format = selectedFormat === "auto" ? details.format : selectedFormat;
    setDetectedFormat(format);

    if (sourceText.trim()) {
      const { result, metadata } = convertToKytario(
        sourceText, 
        selectedFormat, 
        { convertAngloToEuropean, minorFormat: "m" }
      );
      setKytarioOutput(result);
      if (metadata.title) setSongTitle(metadata.title);
      if (metadata.artist) setSongArtist(metadata.artist);
    } else {
      setKytarioOutput("");
      setSongTitle("");
      setSongArtist("");
    }
    // Reset transposing when source changes
    setTransposeSemitones(0);
  }, [sourceText, selectedFormat, convertAngloToEuropean]);

  // Detect song key from first chord
  const detectSongKey = (text: string, notat: "czech" | "english") => {
    const match = text.match(/\{([^\}]+)\}/);
    if (!match) return null;
    const chordContents = match[1].trim();
    const firstChord = chordContents.split(/\s+/)[0];
    const chordRegex = /^([A-H](?:b|#|♭|♯)?)/i;
    const m = firstChord.match(chordRegex);
    if (!m) return null;
    const root = m[1];
    const idx = noteToIndex(root, notat);
    if (idx === -1) return null;
    return { root, index: idx };
  };

  const baseKeyInfo = useMemo(() => {
    if (!kytarioOutput) return null;
    return detectSongKey(kytarioOutput, notation);
  }, [kytarioOutput, notation]);

  const availableKeys = useMemo(() => {
    const actualAcc = accidentals === "original" ? "sharps" : accidentals;
    const keys: string[] = [];
    for (let i = 0; i < 12; i++) {
      keys.push(indexToNote(i, notation, actualAcc));
    }
    return keys;
  }, [notation, accidentals]);

  const currentKeyNote = useMemo(() => {
    if (!baseKeyInfo) return availableKeys[0] || "C";
    const actualAcc = accidentals === "original" ? "sharps" : accidentals;
    const currentIndex = (baseKeyInfo.index + transposeSemitones + 12) % 12;
    return indexToNote(currentIndex, notation, actualAcc);
  }, [baseKeyInfo, transposeSemitones, notation, accidentals, availableKeys]);

  const handleKeyChange = (targetKey: string) => {
    if (!baseKeyInfo) return;
    const targetIndex = noteToIndex(targetKey, notation);
    if (targetIndex === -1) return;
    const newSemitones = (targetIndex - baseKeyInfo.index + 12) % 12;
    setTransposeSemitones(newSemitones);
    if (newSemitones !== 0) {
      saveMilestoneDraft(lang === 'cs' ? `Transpozice na tóninu ${targetKey}` : `Transposition to key ${targetKey}`, sourceText);
    }
  };

  // Handle transposing of converted song
  const handleTranspose = (semitones: number) => {
    setTransposeSemitones(prev => {
      const newVal = prev + semitones;
      const clamped = newVal < -11 ? 11 : newVal > 11 ? -11 : newVal;
      if (clamped !== 0) {
        const transposedText = getTransposedOutput();
        saveMilestoneDraft(lang === 'cs' ? `Transpozice (${clamped > 0 ? `+${clamped}` : clamped} půltónů)` : `Transposition (${clamped > 0 ? `+${clamped}` : clamped} semitones)`, sourceText);
      }
      return clamped;
    });
  };

  const getTransposedOutput = () => {
    const transposedKytario = transposeSongContent(kytarioOutput, transposeSemitones, { notation, accidentals });
    return convertTargetFormat(transposedKytario, targetFormat, songTitle, songArtist);
  };

  const outputText = getTransposedOutput();

  // Calculate matches for Output
  const outputMatches = useMemo(() => {
    return findMatchesInText(outputText, outputSearchQuery, outputCaseSensitive, outputWholeWord);
  }, [outputText, outputSearchQuery, outputCaseSensitive, outputWholeWord]);

  useEffect(() => {
    if (outputActiveMatchIndex >= outputMatches.length) {
      setOutputActiveMatchIndex(Math.max(0, outputMatches.length - 1));
    }
  }, [outputMatches.length]);

  const handleOutputNextMatch = () => {
    if (outputMatches.length === 0) return;
    setOutputActiveMatchIndex(prev => (prev + 1) % outputMatches.length);
  };

  const handleOutputPrevMatch = () => {
    if (outputMatches.length === 0) return;
    setOutputActiveMatchIndex(prev => (prev - 1 + outputMatches.length) % outputMatches.length);
  };

  // Scroll active match into view in output container without stealing focus
  useEffect(() => {
    if (showOutputFindBar && outputSearchQuery && outputMatches.length > 0) {
      // Use a timeout to ensure the DOM has updated with the latest active match highlighting
      const timeoutId = setTimeout(() => {
        const container = document.getElementById("destination-highlighted");
        const el = document.getElementById(`output-search-match-${outputActiveMatchIndex}`);
        if (container && el) {
          const containerRect = container.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          
          const targetScrollTop = container.scrollTop + (elRect.top - containerRect.top) - (containerRect.height / 2) + (elRect.height / 2);
          const targetScrollLeft = container.scrollLeft + (elRect.left - containerRect.left) - (containerRect.width / 2) + (elRect.width / 2);
          
          container.scrollTo({ 
            top: targetScrollTop, 
            left: targetScrollLeft,
            behavior: "smooth" 
          });
        }
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [outputActiveMatchIndex, outputSearchQuery, showOutputFindBar, outputMatches.length, outputCaseSensitive, outputWholeWord]);

  // Copy output to clipboard
  const handleCopyClipboard = async () => {
    const textToCopy = getTransposedOutput();
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy error:", err);
    }
  };

  // Keyboard Shortcuts for top-tier usability & accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        const textToCopy = getTransposedOutput();
        if (textToCopy) {
          e.preventDefault();
          handleCopyClipboard();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.id === "destination-textarea" || activeEl.closest("#destination-highlighted"))) {
          setShowOutputFindBar(true);
        } else {
          setShowInputFindBar(true);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setShowInputFindBar(true);
        setShowInputReplaceRow(true);
      }
      if (e.key === "Escape") {
        setShowDocsModal(false);
        setShowSettingsBar(false);
        setShowDraftsModal(false);
        setShowInputFindBar(false);
        setShowOutputFindBar(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [outputText, kytarioOutput, showDocsModal, showSettingsBar]);

  // Download converted txt file
  const handleDownloadFile = () => {
    const textToDownload = getTransposedOutput();
    if (!textToDownload) return;

    const blob = new Blob([textToDownload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const fileName = `${songTitle || "kytario_song"}_${songArtist || ""}`.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_") || "kytario_song";
    link.href = url;
    link.download = `${fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate standard classes for toolbar action buttons
  const getToolbarBtnClass = (isActive = false, isDisabled = false, isDestructive = false) => {
    const base = "w-9 h-9 border rounded-md transition-all flex items-center justify-center shrink-0 shadow-none";
    
    if (isDisabled) {
      return `${base} ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed" : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"}`;
    }

    if (isDestructive) {
      return `${base} cursor-pointer ${isDarkMode ? "bg-rose-950/20 border-rose-900/60 text-rose-400 hover:bg-rose-950/40 hover:border-rose-800" : "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100/70 hover:border-rose-400"}`;
    }

    if (isActive) {
      return `${base} cursor-pointer ${isDarkMode ? "bg-indigo-950/90 border-indigo-500/90 text-indigo-300 ring-1 ring-indigo-500/50" : "bg-indigo-50 border-indigo-400 text-indigo-700 ring-1 ring-indigo-300"}`;
    }

    return `${base} cursor-pointer ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"}`;
  };

  return (
    <div className={`min-h-screen md:h-screen md:max-h-screen flex flex-col antialiased transition-colors duration-200 overflow-y-auto md:overflow-hidden ${
      isDarkMode ? "bg-[#0b0f19] text-slate-100" : "bg-[#f1f5f9] text-slate-800"
    }`} id="main-applet-root">
      {/* High Density Header */}
      <header className={`h-14 flex-shrink-0 transition-colors duration-150 border-b ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`} id="app-header">
        <div className="max-w-[1920px] w-full mx-auto h-full px-3 sm:px-4 lg:px-6 py-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-800 rounded flex items-center justify-center text-white font-bold shadow-sm font-sans">
              K
            </div>
            <div>
              <h1 className={`text-sm sm:text-base font-bold font-sans tracking-tight transition-colors ${
                isDarkMode ? "text-slate-100" : "text-slate-850"
              }`}>
                {translations[lang].appTitle}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
            {/* Language Toggle Button */}
            <Tooltip content={translations[lang].tooltipLang} isDarkMode={isDarkMode} position="bottom">
              <button
                onClick={() => setLang(lang === "cs" ? "en" : "cs")}
                className={`h-9 px-3 rounded-md border text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center shadow-none ${
                  isDarkMode 
                    ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600" 
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                }`}
                id="language-toggle-btn"
              >
                <span className="flex items-center gap-1.5">
                  {lang === "cs" ? (
                    <div className="w-4.5 h-3 rounded-[2px] overflow-hidden shrink-0 border border-slate-400/40 flex items-center justify-center">
                      <svg width="100%" height="100%" viewBox="0 0 15 10" preserveAspectRatio="none" aria-hidden="true">
                        <rect width="15" height="5" fill="#FFF"/>
                        <rect y="5" width="15" height="5" fill="#D7141A"/>
                        <polygon points="0,0 7.5,5 0,10" fill="#11457E"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-4.5 h-3 rounded-[2px] overflow-hidden shrink-0 border border-slate-400/40 flex items-center justify-center">
                      <svg width="100%" height="100%" viewBox="0 0 60 30" preserveAspectRatio="none" aria-hidden="true">
                        <rect width="60" height="30" fill="#012169" />
                        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFF" strokeWidth="6" />
                        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2" />
                        <path d="M30,0 V30 M0,15 H60" stroke="#FFF" strokeWidth="10" />
                        <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
                      </svg>
                    </div>
                  )}
                  <span>{lang === "cs" ? "CZ" : "EN"}</span>
                </span>
              </button>
            </Tooltip>

            {/* Theme Toggle Button */}
            <Tooltip content={translations[lang].tooltipTheme} isDarkMode={isDarkMode} position="bottom">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={getToolbarBtnClass()}
                id="theme-toggle-btn"
              >
                {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
            </Tooltip>



            <div className={`h-4 w-px ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}></div>

            <Tooltip content={translations[lang].tooltipDocs} isDarkMode={isDarkMode} position="bottom-right">
              <button
                onClick={() => setShowDocsModal(true)}
                className={`flex items-center gap-1.5 hover:underline bg-transparent border-0 cursor-pointer transition-colors text-xs sm:text-sm font-bold ${
                  isDarkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-850 hover:text-indigo-900"
                }`}
                id="open-docs-btn"
              >
                <BookOpen className="w-4 h-4 text-indigo-850 dark:text-indigo-400" />
                <span className="hidden sm:inline">{translations[lang].docs}</span>
                <span className="inline sm:hidden">{translations[lang].help}</span>
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto px-2.5 sm:px-4 lg:px-6 py-2 sm:py-4 flex flex-col gap-3 sm:gap-4 overflow-y-auto md:overflow-hidden md:h-0 md:min-h-0" id="main-content-layout">
        
        {/* Workspace Dual Grid */}
        <section className="flex-1 flex flex-col md:grid md:grid-cols-2 gap-4 md:min-h-0 overflow-y-auto md:overflow-hidden pb-4 md:pb-0" id="workspace-grid">
          
          {/* LEFT COLUMN: Input with tabbed controllers */}
          <div className="flex flex-col gap-2 h-[460px] sm:h-[500px] md:h-full min-h-[460px] sm:min-h-[500px] md:min-h-0 shrink-0 md:shrink" id="left-column-container">
            <div className={`rounded-md border shadow-sm flex flex-col h-full transition-colors duration-150 ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`} id="input-container-card">
            {/* Split Header: compact switch & formats */}
            <div className={`py-2 border-b px-2 sm:px-3 flex flex-col gap-2 flex-shrink-0 rounded-t-md transition-colors duration-150 ${
              isDarkMode ? "border-slate-800 bg-slate-950/30" : "border-slate-200 bg-slate-50/50"
            }`}>
              {/* Line 1: Title & Format Select */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2 font-sans select-none">
                  <span className={`text-[11px] sm:text-sm font-bold uppercase tracking-wider transition-colors ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                    {translations[lang].input}
                  </span>
                </div>
                
                {/* Source Format Select */}
                <Tooltip content={translations[lang].tooltipSourceFormat} isDarkMode={isDarkMode} position="bottom">
                  <select
                    id="input-format-select"
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value as any)}
                    className={`h-9 px-2.5 rounded-md border text-xs sm:text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer shadow-none ${
                      isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                    }`}
                  >
                    <option value="auto">{translations[lang].autoFormat}</option>
                    <option value="ultimateguitar">UG / Chords Over Lyrics</option>
                    <option value="chordpro">ChordPro [C]</option>
                    <option value="kytario">Kytario {"{C}"}</option>
                  </select>
                </Tooltip>
              </div>

              {/* Line 2: Rest of buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 font-sans flex-wrap">
                <Tooltip content={translations[lang].tooltipOpenFile} isDarkMode={isDarkMode} position="bottom">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={getToolbarBtnClass()}
                    id="open-file-btn"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileOpen} 
                  accept=".txt,.chopro,.cho,.crd,.pro,.chordpro,.tab,.text" 
                  className="hidden" 
                />

                {sourceText && (
                  <Tooltip content={translations[lang].tooltipFindInput} isDarkMode={isDarkMode} position="bottom">
                    <button
                      type="button"
                      onClick={() => setShowInputFindBar(prev => !prev)}
                      className={getToolbarBtnClass(showInputFindBar)}
                      id="input-find-btn"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                )}

                {sourceText && (
                  <Tooltip content={translations[lang].tooltipReorder} isDarkMode={isDarkMode} position="bottom">
                    <button
                      type="button"
                      onClick={() => setShowSectionMap(prev => !prev)}
                      className={getToolbarBtnClass(showSectionMap)}
                      id="reorder-sections-btn"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                )}

                {sourceText && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Tooltip content={translations[lang].tooltipUndo} isDarkMode={isDarkMode} position="bottom">
                      <button
                        type="button"
                        onClick={undoSourceText}
                        disabled={!canUndoSourceText}
                        className={getToolbarBtnClass(false, !canUndoSourceText)}
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                    
                    <Tooltip content={translations[lang].tooltipRedo} isDarkMode={isDarkMode} position="bottom">
                      <button
                        type="button"
                        onClick={redoSourceText}
                        disabled={!canRedoSourceText}
                        className={getToolbarBtnClass(false, !canRedoSourceText)}
                      >
                        <Redo2 className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>

                    <div className={`w-px h-4 mx-0.5 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>

                    <Tooltip content={translations[lang].tooltipClear} isDarkMode={isDarkMode} position="bottom-right">
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className={getToolbarBtnClass(false, false, true)}
                        id="clear-input-btn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>

            {/* Ambiguity and Format Variant Feedback Banner */}
            {sourceText.trim() && selectedFormat === "auto" && formatDetails && (
              <AnimatePresence>
                {formatDetails.isAmbiguous && showAmbiguityNotice ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`border-b px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 transition-colors ${
                      isDarkMode 
                        ? "bg-amber-950/40 border-amber-900/60 text-amber-200" 
                        : "bg-amber-50 border-amber-200 text-amber-900"
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
                      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 sm:mt-0 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`} />
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-bold">{translations[lang].ambiguousFormatTitle}:</span>
                        <span className="opacity-90">{formatDetails.ambiguityReason}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      {formatDetails.suggestedAlternative && (
                        <button
                          type="button"
                          onClick={() => setSelectedFormat(formatDetails.suggestedAlternative!)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer shadow-xs ${
                            isDarkMode 
                              ? "bg-amber-900/60 border-amber-700 text-amber-100 hover:bg-amber-800" 
                              : "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200"
                          }`}
                        >
                          {translations[lang].switchTo} {formatDetails.suggestedAlternative === "chordpro" ? "ChordPro [C]" : "Chords Over Lyrics"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowAmbiguityNotice(false)}
                        className={`p-0.5 rounded hover:opacity-75 transition-opacity cursor-pointer ${
                          isDarkMode ? "text-amber-400" : "text-amber-700"
                        }`}
                        title={translations[lang].dismiss}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            )}

            {/* Input Find & Replace Bar */}
            <AnimatePresence>
              {showInputFindBar && (
                <FindReplaceBar
                  mode="input"
                  searchQuery={inputSearchQuery}
                  onSearchQueryChange={setInputSearchQuery}
                  replaceQuery={inputReplaceQuery}
                  onReplaceQueryChange={setInputReplaceQuery}
                  totalMatches={inputMatches.length}
                  activeMatchIndex={inputActiveMatchIndex}
                  onNextMatch={handleInputNextMatch}
                  onPrevMatch={handleInputPrevMatch}
                  onReplace={handleInputReplace}
                  onReplaceAll={handleInputReplaceAll}
                  caseSensitive={inputCaseSensitive}
                  onToggleCaseSensitive={() => setInputCaseSensitive(prev => !prev)}
                  wholeWord={inputWholeWord}
                  onToggleWholeWord={() => setInputWholeWord(prev => !prev)}
                  showReplaceRow={showInputReplaceRow}
                  onToggleReplaceRow={() => setShowInputReplaceRow(prev => !prev)}
                  onClose={() => setShowInputFindBar(false)}
                  isDarkMode={isDarkMode}
                  lang={lang}
                  replaceFeedback={inputReplaceFeedback}
                />
              )}
            </AnimatePresence>

            {/* Input fields & Section Map */}
            <div className="relative flex-grow flex font-mono text-[12px] sm:text-[13px] leading-relaxed min-h-[260px] sm:min-h-[340px] md:min-h-0 overflow-hidden">
              <div className={`relative flex-1 h-full min-w-0 ${showSectionMap ? "hidden sm:block" : "w-full"}`}>
                {/* Visual Backdrop with Highlight Marks for Input Search Matches */}
                {showInputFindBar && inputSearchQuery && inputMatches.length > 0 && (
                  <div
                    id="source-textarea-backdrop"
                    aria-hidden="true"
                    className={`absolute inset-0 p-2.5 sm:p-4 w-full h-full font-mono text-xs sm:text-sm leading-relaxed overflow-auto whitespace-pre pointer-events-none select-none z-0 ${
                      isDarkMode ? "text-transparent bg-[#111827]/40" : "text-transparent bg-transparent"
                    }`}
                    style={{ WebkitTextSizeAdjust: "100%", textSizeAdjust: "100%" }}
                  >
                    {highlightInputMatches(
                      sourceText,
                      inputSearchQuery,
                      inputCaseSensitive,
                      inputWholeWord,
                      inputActiveMatchIndex,
                      isDarkMode
                    )}
                  </div>
                )}

                <textarea
                  ref={srcTextareaRef}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  onBlur={(e) => {
                    const formatted = formatInputText(e.target.value, { convertAngloToEuropean, minorFormat: notation === "czech" ? "mi" : "m" });
                    if (formatted !== e.target.value) {
                      setSourceText(formatted);
                    }
                  }}
                  onScroll={(e) => {
                    const target = e.currentTarget;
                    const backdrop = document.getElementById("source-textarea-backdrop");
                    if (backdrop) {
                      backdrop.scrollTop = target.scrollTop;
                      backdrop.scrollLeft = target.scrollLeft;
                    }
                  }}
                  wrap="off"
                  placeholder={translations[lang].placeholderInput.replace(/&#10;/g, "\n")}
                  className={`relative z-10 p-2.5 sm:p-4 resize-none focus:outline-none w-full h-full font-mono text-xs sm:text-sm leading-relaxed overflow-auto whitespace-pre bg-transparent ${
                    isDarkMode 
                      ? "text-slate-100 placeholder-slate-550 md:bg-[#111827]/40" 
                      : "text-slate-700 placeholder-slate-400"
                  }`}
                  style={{ WebkitTextSizeAdjust: "100%", textSizeAdjust: "100%", color: isDarkMode ? "#f1f5f9" : "#334155" }}
                  id="source-textarea"
                  spellCheck="false"
                />
              </div>

              {showSectionMap && (
                <div className="w-full sm:w-64 md:w-72 sm:max-w-[46%] h-full shrink-0 z-10">
                  <SectionMap
                    sections={songSections}
                    isDarkMode={isDarkMode}
                    lang={lang}
                    activeSectionIndex={activeSectionIndex}
                    onJumpToSection={handleJumpToSection}
                    onReorderSections={handleReorderSections}
                    onClose={() => setShowSectionMap(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

                                {/* RIGHT COLUMN: Output */}
          <div className="flex flex-col gap-2 h-[460px] sm:h-[500px] md:h-full min-h-[460px] sm:min-h-[500px] md:min-h-0 shrink-0 md:shrink" id="right-column-container">
            <div className={`rounded-md border shadow-sm flex flex-col h-full transition-colors duration-150 ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`} id="output-container-card">
              {/* Header */}
              <div className={`py-2 border-b px-2 sm:px-3.5 flex flex-col gap-2 rounded-t-md transition-colors duration-150 ${
                isDarkMode ? "border-slate-800 bg-slate-950/30" : "border-slate-200 bg-slate-50/50"
              }`}>
                {/* Line 1: Title & Format Select */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <span className={`text-[11px] sm:text-sm font-bold uppercase tracking-wider transition-colors ${
                      isDarkMode ? "text-slate-200" : "text-slate-800"
                    }`}>
                      {translations[lang].output}
                    </span>
                  </div>

                  <Tooltip content={translations[lang].tooltipTargetFormat} isDarkMode={isDarkMode} position="bottom">
                    <select
                      id="target-format-select"
                      value={targetFormat}
                      onChange={(e) => setTargetFormat(e.target.value as any)}
                      className={`border rounded-md px-2.5 h-9 text-[11px] sm:text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer shadow-none ${
                        isDarkMode 
                          ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600" 
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                      }`}
                    >
                      <option value="kytario">Kytario {"{C}"}</option>
                      <option value="chordpro">ChordPro [C]</option>
                      <option value="chords_over_lyrics">Chords Over Lyrics</option>
                    </select>
                  </Tooltip>
                </div>

                {/* Line 2: Transposition & Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {/* Transpose Tool and Settings */}
                  {kytarioOutput && (
                    <div className="flex items-center gap-1.5 sm:gap-1.5 flex-wrap sm:flex-nowrap" id="output-tools-container">
                      <div className={`flex items-center gap-0.5 border rounded-md px-1 h-9 transition-colors ${
                        isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-700"
                      }`} id="transposition-widget">
                        <Tooltip content={translations[lang].transposeDown} isDarkMode={isDarkMode} position="bottom">
                          <button
                            onClick={() => handleTranspose(-1)}
                            className={`w-8 h-8 flex items-center justify-center font-sans font-bold rounded-md transition-all text-xs sm:text-sm cursor-pointer ${
                              isDarkMode 
                                ? "text-slate-200 hover:bg-slate-700 hover:text-white" 
                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                            }`}
                            id="transpose-down-btn"
                          >
                            -
                          </button>
                        </Tooltip>

                        <Tooltip content={translations[lang].tooltipTransposeValue} isDarkMode={isDarkMode} position="bottom">
                          <span 
                            onClick={() => setTransposeSemitones(0)}
                            className={`text-xs font-bold min-w-[28px] sm:min-w-[32px] text-center uppercase tracking-wide font-mono px-1 h-8 flex items-center justify-center transition-all rounded-md cursor-pointer select-none ${
                              isDarkMode 
                                ? "text-slate-200 hover:text-indigo-400 hover:bg-slate-750" 
                                : "text-slate-700 hover:text-indigo-800 hover:bg-slate-100"
                            }`}
                          >
                            {transposeSemitones === 0 ? "0" : `${transposeSemitones > 0 ? "+" : ""}${transposeSemitones}`}
                          </span>
                        </Tooltip>

                        <Tooltip content={translations[lang].transposeUp} isDarkMode={isDarkMode} position="bottom">
                          <button
                            onClick={() => handleTranspose(1)}
                            className={`w-8 h-8 flex items-center justify-center font-sans font-bold rounded-md transition-all text-xs sm:text-sm cursor-pointer ${
                              isDarkMode 
                                ? "text-slate-200 hover:bg-slate-700 hover:text-white" 
                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                            }`}
                            id="transpose-up-btn"
                          >
                            +
                          </button>
                        </Tooltip>
                      </div>

                      {/* Transpose Key Dropdown */}
                      {baseKeyInfo && (
                        <div className={`flex items-center gap-1.5 border rounded-md px-2.5 h-9 transition-colors ${
                          isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-700"
                        }`} id="key-selector-widget">
                          <Key className={`w-3.5 h-3.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} title={lang === "cs" ? "Cílová tónina" : "Target Key"} />
                          <select
                            value={currentKeyNote}
                            onChange={(e) => handleKeyChange(e.target.value)}
                            className={`bg-transparent text-xs font-bold font-mono outline-none cursor-pointer py-1 ${
                              isDarkMode ? "text-slate-200" : "text-slate-800"
                            }`}
                            title={lang === "cs" ? "Zvolit cílovou tóninu" : "Select target key"}
                          >
                            {availableKeys.map(k => (
                              <option key={k} value={k} className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"}>
                                {k}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Find in Output Button */}
                      <Tooltip content={translations[lang].tooltipFindOutput} isDarkMode={isDarkMode} position="bottom">
                        <button
                          onClick={() => setShowOutputFindBar(prev => !prev)}
                          className={getToolbarBtnClass(showOutputFindBar)}
                          id="output-find-btn"
                        >
                          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </Tooltip>

                      {/* Drafts Manager Button */}
                      <Tooltip content={translations[lang].tooltipDrafts} isDarkMode={isDarkMode} position="bottom">
                        <button
                          onClick={() => setShowDraftsModal(true)}
                          className={getToolbarBtnClass()}
                        >
                          <ArchiveRestore className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </Tooltip>

                      {/* Settings Button */}
                      <Tooltip content={translations[lang].tooltipSettings} isDarkMode={isDarkMode} position="bottom-right">
                        <button
                          onClick={() => setShowSettingsBar(prev => !prev)}
                          className={getToolbarBtnClass(showSettingsBar)}
                          id="settings-modal-btn"
                        >
                          <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>

            {/* Settings Bar */}
            <AnimatePresence>
              {showSettingsBar && (
                <SettingsBar
                  notation={notation}
                  onNotationChange={setNotation}
                  accidentals={accidentals}
                  onAccidentalsChange={setAccidentals}
                  convertAngloToEuropean={convertAngloToEuropean}
                  onConvertAngloChange={setConvertAngloToEuropean}
                  onClose={() => setShowSettingsBar(false)}
                  isDarkMode={isDarkMode}
                  lang={lang}
                />
              )}
            </AnimatePresence>

            {/* Output Find Bar */}
            <AnimatePresence>
              {showOutputFindBar && (
                <FindReplaceBar
                  mode="output"
                  searchQuery={outputSearchQuery}
                  onSearchQueryChange={setOutputSearchQuery}
                  totalMatches={outputMatches.length}
                  activeMatchIndex={outputActiveMatchIndex}
                  onNextMatch={handleOutputNextMatch}
                  onPrevMatch={handleOutputPrevMatch}
                  caseSensitive={outputCaseSensitive}
                  onToggleCaseSensitive={() => setOutputCaseSensitive(prev => !prev)}
                  wholeWord={outputWholeWord}
                  onToggleWholeWord={() => setOutputWholeWord(prev => !prev)}
                  onClose={() => setShowOutputFindBar(false)}
                  isDarkMode={isDarkMode}
                  lang={lang}
                />
              )}
            </AnimatePresence>

            {/* Output fields */}
            <div className="flex-grow relative flex font-mono text-[13px] leading-relaxed min-h-[260px] sm:min-h-[340px] md:min-h-0">
              <textarea
                readOnly
                ref={destTextareaRef}
                value={outputText}
                className="sr-only"
                id="destination-textarea"
                aria-hidden="true"
                tabIndex={-1}
              />

              {sourceText.trim() && (
                <div
                  id="destination-highlighted"
                  className={`absolute inset-0 p-4 font-mono text-sm leading-relaxed overflow-auto whitespace-pre bg-transparent ${
                    isDarkMode 
                      ? "text-slate-100 md:bg-[#111827]/40" 
                      : "text-slate-700 bg-slate-50/5"
                  }`}
                  style={{ WebkitTextSizeAdjust: "100%", textSizeAdjust: "100%" }}
                >
                  <motion.div
                    key={`${targetFormat}-${transposeSemitones}-${notation}-${accidentals}`}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    {(() => {
                      const globalCounter = { count: 0 };
                      return outputText.split(/\r?\n/).map((line, index) => 
                        renderLine(
                          line, 
                          targetFormat, 
                          isDarkMode, 
                          index, 
                          showOutputFindBar ? outputSearchQuery : "",
                          outputCaseSensitive,
                          outputWholeWord,
                          outputActiveMatchIndex,
                          globalCounter
                        )
                      );
                    })()}
                  </motion.div>
                </div>
              )}

              {!sourceText.trim() && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none p-6 text-center select-none bg-slate-50/5">
                  <FileDown className={`w-8 h-8 mb-1 ${isDarkMode ? "text-slate-700" : "text-slate-300"}`} />
                  <p className={`text-xs font-semibold ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{lang === "cs" ? "Zde uvidíte transkódovaný výstup" : "Here you will see the transcoded output"}</p>
                </div>
              )}
            </div>

            {/* Output Panel Actions */}
            {kytarioOutput && (
              <div className={`min-h-[3.5rem] py-2 px-3.5 border-t flex flex-wrap items-center justify-end gap-2 overflow-visible rounded-b-lg transition-colors ${
                isDarkMode ? "bg-slate-950/40 border-slate-700" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Tooltip content={translations[lang].tooltipDownload} isDarkMode={isDarkMode} position="top">
                    <button
                       onClick={handleDownloadFile}
                       className={`flex items-center gap-2 h-9 px-4 border rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-none ${
                         isDarkMode 
                           ? "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-slate-200 hover:text-white" 
                           : "bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 hover:text-slate-950"
                       }`}
                       id="download-output-btn"
                    >
                      <Download className={`w-4 h-4 ${isDarkMode ? "text-slate-350" : "text-slate-550"}`} />
                      <span>{translations[lang].download}</span>
                    </button>
                  </Tooltip>

                  <Tooltip content={translations[lang].tooltipCopy} isDarkMode={isDarkMode} position="top">
                    <button
                      onClick={handleCopyClipboard}
                      className={`flex items-center gap-2 h-9 px-4 rounded-md border text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-none ${
                        isCopied 
                          ? "bg-emerald-600 border-emerald-600 text-white" 
                          : "bg-indigo-600 border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 text-white dark:bg-indigo-600 dark:border-indigo-600 dark:hover:bg-indigo-500 dark:hover:border-indigo-500"
                      }`}
                      id="copy-output-btn"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>
                        {isCopied 
                          ? translations[lang].copied 
                          : translations[lang].copy
                        }
                      </span>
                    </button>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>
          </div>
        </section>

      </main>

      {/* SPECS SPECIFICATION DRAWER / MODAL */}
      <AnimatePresence>
        {showDocsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs font-sans overflow-y-auto" id="docs-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden transition-all border ${
                isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-300"
              }`}
              id="docs-modal-card"
            >
              <div className={`px-5 py-3.5 border-b flex items-center justify-between transition-colors shrink-0 ${
                isDarkMode ? "bg-slate-950 border-slate-700" : "bg-slate-50 border-slate-300"
              }`}>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-800 dark:text-indigo-400" />
                  <h3 className={`font-bold text-sm uppercase tracking-wide transition-colors ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>{translations[lang].docsTitle}</h3>
                </div>
                <button
                  onClick={() => setShowDocsModal(false)}
                  className={`px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                    isDarkMode 
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500" 
                      : "bg-indigo-800 hover:bg-indigo-900 text-white border border-indigo-950"
                  }`}
                  id="close-docs-modal-btn"
                >
                  <X className="w-4 h-4" /> {translations[lang].docsClose}
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-grow min-h-0 space-y-4 text-xs leading-relaxed" id="docs-modal-content">
                <p className={isDarkMode ? "text-slate-300" : "text-slate-650"}>
                  {translations[lang].docsIntro}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className={`p-3 border rounded transition-colors ${isDarkMode ? "bg-slate-950/40 border-slate-700" : "bg-slate-50 border-slate-300"}`}>
                    <span className={`font-bold text-[11px] uppercase block mb-1 ${isDarkMode ? "text-indigo-400" : "text-indigo-800"}`}>{translations[lang].docsChordsTitle}</span>
                    <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      {lang === "cs" ? (
                        <>
                          Akordy zapisujeme do složených závorek, např. <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`{Em}`}</code>, <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`{C#m7}`}</code>. První tón musí být velkým písmenem.
                        </>
                      ) : (
                        <>
                          Chords are written in curly braces, e.g. <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`{Em}`}</code>, <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`{C#m7}`}</code>. The first note must be capitalized.
                        </>
                      )}
                    </p>
                  </div>

                  <div className={`p-3 border rounded transition-colors ${isDarkMode ? "bg-slate-950/40 border-slate-700" : "bg-slate-50 border-slate-300"}`}>
                    <span className={`font-bold text-[11px] uppercase block mb-1 ${isDarkMode ? "text-indigo-400" : "text-indigo-800"}`}>{translations[lang].docsPositionsTitle}</span>
                    <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      {lang === "cs" ? (
                        <>
                          Zapisují se přímo v textu tak, aby předcházely slovu/písmenu: <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`{C}Slib{D}ujeme`}</code>.
                        </>
                      ) : (
                        <>
                          They are written directly in the text, preceding the word/letter: <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`{C}Prom{D}ise`}</code>.
                        </>
                      )}
                    </p>
                  </div>

                  <div className={`p-3 border rounded transition-colors ${isDarkMode ? "bg-slate-950/40 border-slate-700" : "bg-slate-50 border-slate-300"}`}>
                    <span className={`font-bold text-[11px] uppercase block mb-1 ${isDarkMode ? "text-indigo-400" : "text-indigo-800"}`}>
                      {lang === "cs" ? "📂 Sekce (Sloky & Refrény)" : "📂 Sections (Verses & Choruses)"}
                    </span>
                    <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      {lang === "cs" ? "Zpívané sekce začínají pomlčkou (zobrazování vždy) nebo plusem (jen pro mobily):" : "Sung sections start with a hyphen (always shown) or a plus (mobile only):"}
                      <br />
                      <code className={`rounded px-1 text-[10px] block mt-1 ${isDarkMode ? "bg-slate-850 text-slate-350" : "bg-slate-200/60"}`}>
                        - REF1, - REF2 ({lang === "cs" ? "refrény" : "choruses"})
                      </code>
                      <code className={`rounded px-1 text-[10px] block mt-1 ${isDarkMode ? "bg-slate-850 text-slate-350" : "bg-slate-200/60"}`}>
                        - 1., - 2. ({lang === "cs" ? "sloky" : "verses"})
                      </code>
                      <code className={`rounded px-1 text-[10px] block mt-1 ${isDarkMode ? "bg-slate-850 text-slate-350" : "bg-slate-200/60"}`}>
                        - BRD (bridge), - INT (intro)
                      </code>
                    </p>
                  </div>

                  <div className={`p-3 border rounded transition-colors ${isDarkMode ? "bg-slate-950/40 border-slate-700" : "bg-slate-50 border-slate-300"}`}>
                    <span className={`font-bold text-[11px] uppercase block mb-1 ${isDarkMode ? "text-indigo-400" : "text-indigo-800"}`}>{translations[lang].docsLinksTitle}</span>
                    <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      {lang === "cs" ? (
                        <>
                          Pokud se refrén či sloka opakuje beze změny slov, odkazuje se v hranatých závorkách: <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`[REF1]`}</code> nebo <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`[1.]`}</code>.
                        </>
                      ) : (
                        <>
                          If a chorus or verse repeats without changing lyrics, link to it in square brackets: <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`[REF1]`}</code> or <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`[1.]`}</code>.
                        </>
                      )}
                    </p>
                  </div>

                  <div className={`p-3 border rounded transition-colors ${isDarkMode ? "bg-slate-950/40 border-slate-700" : "bg-slate-50 border-slate-300"}`}>
                    <span className={`font-bold text-[11px] uppercase block mb-1 ${isDarkMode ? "text-indigo-400" : "text-indigo-800"}`}>{translations[lang].docsRepeatsTitle}</span>
                    <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      {lang === "cs" ? (
                        <>
                          Ohraničují se znaky <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`|:`}</code> a <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`:|`}</code>, s počtem opakování na konci, např. <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`|: {Am} :| 3x`}</code>.
                        </>
                      ) : (
                        <>
                          They are enclosed by characters <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`|:`}</code> and <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`:|`}</code>, with the repetition count at the end, e.g. <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`|: {Am} :| 3x`}</code>.
                        </>
                      )}
                    </p>
                  </div>

                  <div className={`p-3 border rounded transition-colors ${isDarkMode ? "bg-slate-950/40 border-slate-700" : "bg-slate-50 border-slate-300"}`}>
                    <span className={`font-bold text-[11px] uppercase block mb-1 ${isDarkMode ? "text-indigo-400" : "text-indigo-800"}`}>{translations[lang].docsAcappellaTitle}</span>
                    <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      {lang === "cs" ? (
                        <>
                          Text bez doprovodu označujeme na začátku řádku tónem <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`{X}`}</code>.
                        </>
                      ) : (
                        <>
                          Unaccompanied text is marked at the beginning of the line with the note <code className={`rounded px-1 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200/60"}`}>{`{X}`}</code>.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className={`border rounded p-3 text-[11px] transition-colors ${
                  isDarkMode ? "bg-indigo-950/40 border-indigo-900/65 text-indigo-200" : "bg-indigo-50 border-indigo-200 text-indigo-950"
                }`}>
                  <span className="font-bold block mb-0.5">{translations[lang].tipTitle}</span>
                  {translations[lang].tipDesc}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DRAFTS MANAGER MODAL */}
      <AnimatePresence>
        {showDraftsModal && (
          <DraftsModal 
            drafts={drafts}
            isDarkMode={isDarkMode}
            lang={lang}
            onClose={() => setShowDraftsModal(false)}
            onRestore={(text) => {
              saveSourceTextHistory(text);
            }}
            onDelete={deleteDraft}
            onClearAll={clearAllDrafts}
            onClearAllAndResetEditor={() => {
              clearAllDrafts();
              saveSourceTextHistory("");
            }}
            onManualSave={saveManualDraft}
          />
        )}
      </AnimatePresence>



      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-md w-full rounded-xl border p-6 shadow-2xl transition-all ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <h3 className="text-base font-bold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {lang === "cs" ? "Potvrzení vymazání" : "Confirm Clear"}
              </h3>
              <p className={`text-sm mb-6 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                {lang === "cs" 
                  ? "Opravdu chcete vymazat veškerý text v editoru? Tuto akci nelze vrátit zpět." 
                  : "Are you sure you want to clear all text in the editor? This action cannot be undone."}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {lang === "cs" ? "Zrušit" : "Cancel"}
                </button>
                <button
                  onClick={() => {
                    saveSourceTextHistory("");
                    clearAutoSave();
                    setShowClearConfirm(false);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-sm"
                >
                  {lang === "cs" ? "Vymazat text" : "Clear Text"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

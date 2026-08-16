import React from "react";

export interface SearchMatch {
  index: number;
  start: number;
  end: number;
  lineIndex: number;
  text: string;
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildSearchRegex(query: string, caseSensitive: boolean, wholeWord: boolean): RegExp | null {
  if (!query || !query.trim()) return null;
  
  try {
    let pattern = escapeRegExp(query);
    if (wholeWord) {
      // Check if starts/ends with alphanumeric/underscore for \b
      const startsWord = /^\w/.test(query);
      const endsWord = /\w$/.test(query);
      pattern = `${startsWord ? "\\b" : ""}${pattern}${endsWord ? "\\b" : ""}`;
    }
    const flags = caseSensitive ? "g" : "gi";
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

export function findMatchesInText(
  text: string,
  query: string,
  caseSensitive = false,
  wholeWord = false
): SearchMatch[] {
  if (!text || !query) return [];

  const regex = buildSearchRegex(query, caseSensitive, wholeWord);
  if (!regex) return [];

  const matches: SearchMatch[] = [];
  const lines = text.split(/\r?\n/);
  
  // Calculate line starting offsets
  const lineStartOffsets: number[] = [];
  let currentOffset = 0;
  for (let i = 0; i < lines.length; i++) {
    lineStartOffsets.push(currentOffset);
    currentOffset += lines[i].length + 1; // +1 for newline character
  }

  let match: RegExpExecArray | null;
  let matchCounter = 0;

  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const matchedText = match[0];
    const end = start + matchedText.length;

    // Find which line this match is on
    let lineIdx = 0;
    for (let i = 0; i < lineStartOffsets.length; i++) {
      if (lineStartOffsets[i] <= start) {
        lineIdx = i;
      } else {
        break;
      }
    }

    matches.push({
      index: matchCounter++,
      start,
      end,
      lineIndex: lineIdx,
      text: matchedText,
    });

    // Avoid infinite loops for 0-length matches
    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }

  return matches;
}

export function replaceAllInText(
  text: string,
  query: string,
  replaceWith: string,
  caseSensitive = false,
  wholeWord = false
): { result: string; count: number } {
  if (!text || !query) return { result: text, count: 0 };

  const regex = buildSearchRegex(query, caseSensitive, wholeWord);
  if (!regex) return { result: text, count: 0 };

  let count = 0;
  const result = text.replace(regex, () => {
    count++;
    return replaceWith;
  });

  return { result, count };
}

export function replaceSingleMatch(
  text: string,
  match: SearchMatch,
  replaceWith: string
): string {
  if (!text || !match) return text;
  return text.substring(0, match.start) + replaceWith + text.substring(match.end);
}

/**
 * Highlights matches within a piece of text (e.g. for Output preview rendering)
 */
export function highlightText(
  content: string,
  query: string,
  caseSensitive: boolean,
  wholeWord: boolean,
  currentMatchIndex: number,
  globalMatchCounter: { count: number },
  isDarkMode: boolean
): React.ReactNode {
  if (!query || !content) return content;

  const regex = buildSearchRegex(query, caseSensitive, wholeWord);
  if (!regex) return content;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const start = match.index;
    const matchedText = match[0];
    const end = start + matchedText.length;

    // Text before match
    if (start > lastIndex) {
      parts.push(content.substring(lastIndex, start));
    }

    const thisMatchIdx = globalMatchCounter.count++;
    const isActive = thisMatchIdx === currentMatchIndex;

    parts.push(
      <mark
        key={`match-${thisMatchIdx}-${start}`}
        id={`output-search-match-${thisMatchIdx}`}
        className={`px-0.5 py-0.2 rounded-xs transition-all duration-150 ${
          isActive
            ? "bg-amber-400 text-slate-950 font-bold ring-2 ring-amber-500 shadow-sm z-10 inline-block"
            : isDarkMode
            ? "bg-amber-500/35 text-amber-100 ring-1 ring-amber-400/30"
            : "bg-amber-200 text-slate-900 ring-1 ring-amber-300"
        }`}
      >
        {matchedText}
      </mark>
    );

    lastIndex = end;

    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : content;
}

/**
 * Highlights matches in raw input text for the backdrop behind textarea
 */
export function highlightInputMatches(
  fullText: string,
  query: string,
  caseSensitive: boolean,
  wholeWord: boolean,
  currentMatchIndex: number,
  isDarkMode: boolean
): React.ReactNode {
  if (!query || !fullText) return fullText;

  const regex = buildSearchRegex(query, caseSensitive, wholeWord);
  if (!regex) return fullText;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let matchIdx = 0;

  while ((match = regex.exec(fullText)) !== null) {
    const start = match.index;
    const matchedText = match[0];
    const end = start + matchedText.length;

    if (start > lastIndex) {
      parts.push(fullText.substring(lastIndex, start));
    }

    const thisIdx = matchIdx++;
    const isActive = thisIdx === currentMatchIndex;

    parts.push(
      <mark
        key={`input-match-${thisIdx}-${start}`}
        className={`rounded-xs transition-colors duration-150 inline ${
          isActive
            ? isDarkMode
              ? "bg-amber-400 text-slate-950 font-bold ring-2 ring-amber-400"
              : "bg-amber-400 text-slate-950 font-bold ring-2 ring-amber-500 shadow-xs"
            : isDarkMode
            ? "bg-amber-500/40 text-transparent ring-1 ring-amber-400/30"
            : "bg-amber-200/90 text-transparent ring-1 ring-amber-300"
        }`}
      >
        {matchedText}
      </mark>
    );

    lastIndex = end;

    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }

  if (lastIndex < fullText.length) {
    parts.push(fullText.substring(lastIndex));
  }

  return <>{parts}</>;
}

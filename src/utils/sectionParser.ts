import { isChord, isChordLine } from './converter';

export type SectionType = 'intro' | 'verse' | 'chorus' | 'pre-chorus' | 'bridge' | 'solo' | 'outro' | 'other';

export interface SongSection {
  id: string;
  index: number;
  label: string;
  type: SectionType;
  rawText: string;
  preview: string;
  startLine: number;
  endLine: number;
  startIndex: number;
  endIndex: number;
  chordCount: number;
  lineCount: number;
}

function detectSectionTypeAndLabel(firstFewLines: string[], defaultIndex: number, lang: 'cs' | 'en' = 'en'): { type: SectionType; label: string } {
  const combined = firstFewLines.join(' ').trim();
  const lower = combined.toLowerCase();

  // Explicit patterns
  // 1. Intro
  if (/\b(intro|předehra|úvod|int\.)\b/i.test(lower) || /^[\[\{\-] ?int/i.test(lower)) {
    return { type: 'intro', label: lang === 'cs' ? 'Intro (Předehra)' : 'Intro' };
  }

  // 2. Outro
  if (/\b(outro|dohra|závěr|out\.)\b/i.test(lower) || /^[\[\{\-] ?out/i.test(lower)) {
    return { type: 'outro', label: lang === 'cs' ? 'Outro (Dohra)' : 'Outro' };
  }

  // 3. Solo / Instrumental
  if (/\b(solo|sólo|interlude|mezihra)\b/i.test(lower)) {
    return { type: 'solo', label: lang === 'cs' ? 'Sólo / Mezihra' : 'Solo' };
  }

  // 4. Pre-Chorus
  if (/\b(pre-chorus|prechorus|předrefrén|pre\.)\b/i.test(lower)) {
    return { type: 'pre-chorus', label: lang === 'cs' ? 'Předrefrén' : 'Pre-Chorus' };
  }

  // 5. Chorus / Refrain
  const chorusMatch = lower.match(/\b(chorus|refrén|refren|ref\.?)\s*([0-9]*)/i) || combined.match(/^[\[\{\-] ?(?:ref|chorus)\s*([0-9]*)/i);
  if (chorusMatch || /\{soc\}|\{start_of_chorus\}/i.test(combined)) {
    const num = chorusMatch && chorusMatch[2] ? ` ${chorusMatch[2]}` : '';
    return { type: 'chorus', label: lang === 'cs' ? `Refrén${num}` : `Chorus${num}` };
  }

  // 6. Bridge
  if (/\b(bridge|přechod|brd\.?|můstek)\b/i.test(lower) || /^[\[\{\-] ?brd/i.test(lower) || /\{sob\}|\{start_of_bridge\}/i.test(combined)) {
    return { type: 'bridge', label: lang === 'cs' ? 'Bridge (Přechod)' : 'Bridge' };
  }

  // 7. Verse / Sloka
  const verseMatch = lower.match(/\b(verse|sloka)\s*([0-9]+)/i) || 
                     combined.match(/^[\[\{\-]\s*([0-9]+)\.?/i) || 
                     combined.match(/^([0-9]+)\.\s+/);
  if (verseMatch) {
    const num = verseMatch[2] || verseMatch[1];
    return { type: 'verse', label: lang === 'cs' ? `Sloka ${num}` : `Verse ${num}` };
  }

  if (/\b(verse|sloka)\b/i.test(lower) || /\{sov\}|\{start_of_verse\}/i.test(combined)) {
    return { type: 'verse', label: lang === 'cs' ? `Sloka ${defaultIndex}` : `Verse ${defaultIndex}` };
  }

  // Bracket headers e.g. [Part A], [Hook], [Theme]
  const bracketMatch = combined.match(/^\[([^\]]+)\]/);
  if (bracketMatch) {
    return { type: 'other', label: bracketMatch[1].trim() };
  }

  // Directive headers e.g. {comment: ...}
  const commentMatch = combined.match(/\{(?:comment|c):\s*([^\}]+)\}/i);
  if (commentMatch) {
    return { type: 'other', label: commentMatch[1].trim() };
  }

  // Default fallback
  return { type: 'verse', label: lang === 'cs' ? `Část ${defaultIndex}` : `Section ${defaultIndex}` };
}

export function parseSongSections(text: string, lang: 'cs' | 'en' = 'en'): SongSection[] {
  if (!text || !text.trim()) return [];

  const lines = text.split(/\r?\n/);
  const rawBlocks: { lines: string[]; startLine: number; endLine: number; startIndex: number; endIndex: number; rawText: string }[] = [];

  let currentBlockLines: string[] = [];
  let currentStartLine = 0;
  let currentStartIndex = 0;
  let runningIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isLineEmpty = !line.trim();

    if (isLineEmpty) {
      if (currentBlockLines.length > 0) {
        const rawText = currentBlockLines.join('\n');
        rawBlocks.push({
          lines: currentBlockLines,
          startLine: currentStartLine,
          endLine: i - 1,
          startIndex: currentStartIndex,
          endIndex: runningIndex,
          rawText,
        });
        currentBlockLines = [];
      }
    } else {
      if (currentBlockLines.length === 0) {
        currentStartLine = i;
        currentStartIndex = runningIndex;
      }
      currentBlockLines.push(line);
    }

    runningIndex += line.length + 1; // +1 for newline
  }

  if (currentBlockLines.length > 0) {
    const rawText = currentBlockLines.join('\n');
    rawBlocks.push({
      lines: currentBlockLines,
      startLine: currentStartLine,
      endLine: lines.length - 1,
      startIndex: currentStartIndex,
      endIndex: runningIndex,
      rawText,
    });
  }

  let verseCounter = 1;

  return rawBlocks.map((block, idx) => {
    const { type, label } = detectSectionTypeAndLabel(block.lines.slice(0, 2), idx + 1, lang);
    
    // Count chords
    let chordCount = 0;
    for (const line of block.lines) {
      const words = line.split(/\s+/);
      for (const w of words) {
        const cleaned = w.replace(/[\[\]\{\}\(\)]/g, '');
        if (isChord(cleaned)) chordCount++;
      }
    }

    // Get clean preview lines (ignore section headers for preview)
    const contentLines = block.lines.filter(l => !/^[\[\{\-]\s*[a-zA-Z0-9\.\s]+[\]\}]?$/i.test(l.trim()));
    const preview = (contentLines.length > 0 ? contentLines.slice(0, 2) : block.lines.slice(0, 2)).join(' / ');

    return {
      id: `sec-${idx}-${block.startLine}`,
      index: idx + 1,
      label,
      type,
      rawText: block.rawText,
      preview: preview.length > 60 ? preview.substring(0, 57) + '...' : preview,
      startLine: block.startLine,
      endLine: block.endLine,
      startIndex: block.startIndex,
      endIndex: block.endIndex,
      chordCount,
      lineCount: block.lines.length,
    };
  });
}

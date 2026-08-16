// Kytario Song Converter Utility

export interface ChordPosition {
  chord: string;
  index: number;
}

// Correct non-standard or misspelled chord notations (OCR-like parsing cleanup)
export function correctMisspelledChord(word: string): string {
  // Strip brackets, quotes, and punctuation symbols, but PRESERVE '/' for slash chords (e.g. Em/G#, C/E)
  let cleaned = word.trim().replace(/[\[\]\(\)\{\}［］【】〔〕〖〗「」『』❲❳⟦⟧⦋⦌\<\>«»‹›⟨⟩\|\%_\*]/g, "");
  if (!cleaned) return word;

  if (["N.C.", "NC", "X", "PAUSE", "REST"].includes(cleaned.toUpperCase())) {
    return cleaned;
  }

  // Remove trailing OCR punctuation like period, comma, colon
  cleaned = cleaned.replace(/[\.,;:!]+$/, "");

  // If the word was surrounded by slashes like /C/ (inline marker), strip enclosing slashes
  if (cleaned.startsWith("/") && cleaned.endsWith("/") && cleaned.length > 2) {
    cleaned = cleaned.slice(1, -1);
  }
  // Remove dangling leading or trailing slash
  cleaned = cleaned.replace(/^\/+(?=[A-Ha-h])/, "").replace(/\/+$/, "");

  // Normalize spaces around slash (e.g., "Em / G#" -> "Em/G#")
  cleaned = cleaned.replace(/\s*\/\s*/g, "/");

  // Fix space between root note and accidental/suffix (e.g., "C #" -> "C#", "E m" -> "Em")
  cleaned = cleaned.replace(/^([A-H])\s+([#b♭♯])/i, "$1$2");

  // Common European / OCR accidental notations (Fis -> F#, Cis -> C#, etc.)
  cleaned = cleaned.replace(/^Fis/i, "F#")
                   .replace(/^Cis/i, "C#")
                   .replace(/^Gis/i, "G#")
                   .replace(/^Dis/i, "D#")
                   .replace(/^Ais/i, "A#")
                   .replace(/^Es(?!u)/i, "Eb")
                   .replace(/^As(?!u)/i, "Ab")
                   .replace(/^Ces/i, "Cb")
                   .replace(/^Besp/i, "Bb");

  // Fix lowercase root note at start (e.g. am -> Am, c -> C)
  if (/^[a-h](?:b|#|♭|♯)?/i.test(cleaned)) {
    const rootChar = cleaned[0].toUpperCase();
    const rest = cleaned.slice(1);
    cleaned = rootChar + rest;
  }

  // Fix bass note in slash chords (e.g. A/c# -> A/C#, Em/gis -> Em/G#, D/fis -> D/F#)
  if (cleaned.includes("/")) {
    const slashIdx = cleaned.indexOf("/");
    const before = cleaned.slice(0, slashIdx).trim();
    let after = cleaned.slice(slashIdx + 1).trim();
    after = after.replace(/^Fis/i, "F#")
                 .replace(/^Cis/i, "C#")
                 .replace(/^Gis/i, "G#")
                 .replace(/^Dis/i, "D#")
                 .replace(/^Ais/i, "A#")
                 .replace(/^Es(?!u)/i, "Eb")
                 .replace(/^As(?!u)/i, "Ab")
                 .replace(/^Ces/i, "Cb")
                 .replace(/^Besp/i, "Bb");
    if (/^[a-h]/i.test(after)) {
      const bassRoot = after[0].toUpperCase();
      const bassRest = after.slice(1);
      after = `${bassRoot}${bassRest}`;
    }
    cleaned = `${before}/${after}`;
  }

  // Unicode accidentals replacement
  cleaned = cleaned.replace(/♭/g, "b").replace(/♯/g, "#");

  return cleaned;
}

export interface NormalizeOptions {
  convertAngloToEuropean?: boolean;
  minorFormat?: "m" | "mi";
}

// Normalize chord notation (e.g. flat symbols, minor abbreviations)
export function normalizeChordName(
  chord: string, 
  convertAngloToEuropean?: boolean | NormalizeOptions,
  options?: NormalizeOptions
): string {
  const opts: NormalizeOptions = typeof convertAngloToEuropean === "object"
    ? convertAngloToEuropean
    : { convertAngloToEuropean, ...options };

  const corrected = correctMisspelledChord(chord);
  const trimmed = corrected.trim();
  if (["N.C.", "NC", "X", "PAUSE", "REST"].includes(trimmed.toUpperCase())) {
    return trimmed;
  }
  const chordRegex = /^([A-H](?:b|#|♭|♯)?)([^/]*)(?:\/([A-H](?:b|#|♭|♯)?))?$/i;
  const match = trimmed.match(chordRegex);
  if (!match) {
    // Fallback global replacements if it doesn't match standard regex perfectly
    let fallback = trimmed.replace(/♭/g, "b").replace(/♯/g, "#");
    if (opts.minorFormat === "mi") {
      fallback = fallback.replace(/\bmin\b/gi, "mi").replace(/\bm([0-9]*|\b)(?![a-z])/gi, "mi$1");
    } else {
      fallback = fallback.replace(/min/gi, "m").replace(/mi/gi, "m");
    }
    return fallback;
  }

  let root = match[1];
  let suffix = match[2];
  let bass = match[3];

  // 1. Normalize root accidental & capitalization
  root = root.replace(/♭/g, "b").replace(/♯/g, "#");
  if (root.length > 0) {
    root = root.charAt(0).toUpperCase() + root.slice(1);
  }

  // 2. Normalize suffix (minor indicators: "m" vs "mi")
  if (opts.minorFormat === "mi") {
    if (/^min/i.test(suffix)) {
      suffix = suffix.replace(/^min/i, "mi");
    } else if (/^m(?![a-z])/i.test(suffix)) {
      suffix = suffix.replace(/^m/i, "mi");
    }
  } else if (opts.minorFormat === "m") {
    suffix = suffix.replace(/min/gi, "m").replace(/mi/gi, "m");
  } else {
    suffix = suffix.replace(/min/gi, "m").replace(/mi/gi, "m");
  }
  suffix = suffix.replace(/♭/g, "b").replace(/♯/g, "#");

  // 3. Normalize bass note
  if (bass) {
    bass = bass.replace(/♭/g, "b").replace(/♯/g, "#");
    if (bass.length > 0) {
      bass = bass.charAt(0).toUpperCase() + bass.slice(1);
    }
  }

  if (opts.convertAngloToEuropean) {
    // Root conversion
    const rootUpper = root.toUpperCase();
    if (rootUpper === "B") {
      root = root === "b" ? "h" : "H";
    } else if (rootUpper === "BB") {
      root = root.startsWith("b") ? "b" : "B";
    }

    // Bass conversion
    if (bass) {
      const bassUpper = bass.toUpperCase();
      if (bassUpper === "B") {
        bass = bass === "b" ? "h" : "H";
      } else if (bassUpper === "BB") {
        bass = bass.startsWith("b") ? "b" : "B";
      }
    }
  }

  return bass ? `${root}${suffix}/${bass}` : `${root}${suffix}`;
}

// Check if a word is a valid musical chord
export function isChord(word: string): boolean {
  const corrected = correctMisspelledChord(word);
  const cleaned = corrected.trim().replace(/[\[\]\(\)\{\}\<\>【】〔〕,;:.]/g, "");
  if (!cleaned) return false;

  if (["N.C.", "NC", "X", "PAUSE", "REST"].includes(cleaned.toUpperCase())) return true;

  // Handle slash chords: Root+Suffix / Bass (e.g. Em/G#, C/E, Asus4/F#)
  if (cleaned.includes("/")) {
    const parts = cleaned.split("/").map(p => p.trim());
    if (parts.length === 2) {
      const [mainChord, bassNote] = parts;
      if (!isChord(mainChord)) return false;
      const bassClean = correctMisspelledChord(bassNote);
      return /^([A-H](?:b|#|♭|♯)?)$/i.test(bassClean);
    }
    return false;
  }

  const rootMatch = cleaned.match(/^([A-H])(?:b|#|♭|♯|is|es|s)?/i);
  if (!rootMatch) return false;
  
  let rootExt = rootMatch[0];
  
  // If the chord continues with 'sus', the 's' belongs to the suffix (e.g., Asus4 -> A + sus4)
  if (cleaned.toLowerCase().substring(rootMatch[1].length).startsWith('sus')) {
      rootExt = rootMatch[1];
  } else if (rootExt.toLowerCase().endsWith('s') && !rootExt.toLowerCase().endsWith('is') && !rootExt.toLowerCase().endsWith('es')) {
      const rootChar = rootMatch[1].toUpperCase();
      if (rootChar !== 'A' && rootChar !== 'E') {
         // It's like Gsus4 (if we didn't catch it above), the 's' belongs to the suffix.
         rootExt = rootMatch[1]; // just the root
      }
  }

  let suffix = cleaned.slice(rootExt.length).toLowerCase();
  
  // We only allow certain sequences
  let strippedSuffix = suffix
    .replace(/(maj|min|dim|aug|sus|add|mi)/g, '')
    .replace(/[0-9\/\+\-\(\)#b♭♯\.\*]/g, ''); 
  
  // allow 'm' (minor)
  strippedSuffix = strippedSuffix.replace(/m/g, '');

  if (/[a-z]/i.test(strippedSuffix)) return false;

  return true;
}

// Check if an entire line is classified as a chord line (instead of lyrics)
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Exclude section brackets like [Verse 1] or Kytario directives
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return false;
  if (trimmed.startsWith("- ") || trimmed.startsWith("+ ")) return false;
  if (trimmed.startsWith("|:") || trimmed.endsWith(":|")) {
    const withoutRep = trimmed.replace(/\|:/g, "").replace(/:\|/g, "").trim();
    const tokens = withoutRep.split(/\s+/);
    return tokens.every(t => isChord(t));
  }

  // If the line contains curly braces {C} or standard bracketed inline chords [C] or <C>, it is NOT a plain UG chord line
  if (/\{[A-H][^}]*\}/i.test(trimmed) || /\[[A-H][^\]]*\]/i.test(trimmed) || /\<[A-H][^\>]*\>/i.test(trimmed)) {
    return false;
  }

  const tokens = trimmed.split(/\s+/);
  let chordCount = 0;
  let wordCount = 0;

  for (const token of tokens) {
    if (isChord(token)) {
      chordCount++;
    } else {
      wordCount++;
    }
  }

  if (chordCount === 0) return false;

  // If 100% of tokens are chords, yes
  if (wordCount === 0) return true;

  // If 70% or more tokens are chords and no token is longer than 7 characters, it's a chord line
  return (chordCount / tokens.length) >= 0.7;
}

// Parse chords and their horizontal column index on a chord line
export function parseChordLine(
  line: string, 
  convertAngloToEuropean?: boolean | NormalizeOptions,
  options?: NormalizeOptions
): ChordPosition[] {
  const opts: NormalizeOptions = typeof convertAngloToEuropean === "object"
    ? convertAngloToEuropean
    : { convertAngloToEuropean, ...options };

  const result: ChordPosition[] = [];
  const words = line.split(/(\s+)/); // split but keep spaces
  let currentIndex = 0;
  for (const part of words) {
    if (part.trim().length > 0) {
      if (isChord(part.trim())) {
        result.push({
          chord: normalizeChordName(part.trim(), opts),
          index: currentIndex,
        });
      }
    }
    currentIndex += part.length;
  }
  return result;
}

// Merge chords from a chord line with lyrics on the line beneath
export function mergeChordsAndLyrics(chords: ChordPosition[], lyrics: string): string {
  if (chords.length === 0) return lyrics;

  let result = "";
  let currentPos = 0;
  let chordPtr = 0;

  const maxLen = Math.max(
    lyrics.length,
    ...chords.map(c => c.index + c.chord.length)
  );

  for (let i = 0; i <= maxLen; i++) {
    while (chordPtr < chords.length && chords[chordPtr].index === i) {
      const chord = chords[chordPtr].chord;
      if (currentPos < i) {
        result += " ".repeat(i - currentPos);
        currentPos = i;
      }
      result += `{${chord}}`;
      currentPos += chord.length;
      chordPtr++;
    }

    if (i < lyrics.length) {
      if (currentPos < i) {
        result += " ".repeat(i - currentPos);
        currentPos = i;
      }
      result += lyrics[i];
      currentPos = Math.max(currentPos, i) + 1;
    }
  }

  while (chordPtr < chords.length) {
    const chord = chords[chordPtr].chord;
    result += ` {${chord}}`;
    chordPtr++;
  }

  return result;
}

export interface FormatDetectionDetails {
  format: "kytario" | "chordpro" | "ultimateguitar";
  confidence: number;
  isAmbiguous: boolean;
  ambiguityReason?: string;
  ambiguityReasonCs?: string;
  variant: "standard" | "unicode_brackets" | "angle_brackets" | "parentheses" | "inline_markers" | "directives_only" | "mixed" | "plain_ug" | "kytario_standard";
  variantDescription: string;
  variantDescriptionCs: string;
  scores: {
    kytario: number;
    chordpro: number;
    ultimateguitar: number;
  };
  stats: {
    chordProDirectives: number;
    standardBracketsCount: number;
    unicodeBracketsCount: number;
    angleBracketsCount: number;
    parenthesesChordsCount: number;
    inlineMarkerChordsCount: number;
    totalInlineChordsCount: number;
    kytarioBraceChordsCount: number;
    chordLinesCount: number;
    lyricLinesCount: number;
    sectionHeadersCount: number;
    kytarioHeadersCount: number;
  };
  suggestedAlternative?: "kytario" | "chordpro" | "ultimateguitar";
}

// Known non-chord terms in parentheses to avoid false positives
const NON_CHORD_PARENS = new Set([
  "2x", "3x", "4x", "5x", "6x", "7x", "8x", "repeat", "chorus", "refren", "ref", "refrén",
  "verse", "sloka", "bridge", "intro", "outro", "solo", "tab", "softly", "slowly", "fast",
  "fade", "fade out", "capo", "key", "instrumental", "mezihra", "dohra", "předehra", "přechod",
  "all", "band", "drums", "bass", "guitar", "lead", "acoustic", "riff", "end", "stop", "pause"
]);

// Detailed format detection with deep ChordPro variant parsing and ambiguity analysis
export function detectFormatDetailed(text: string): FormatDetectionDetails {
  if (!text || !text.trim()) {
    return {
      format: "ultimateguitar",
      confidence: 0.5,
      isAmbiguous: false,
      variant: "plain_ug",
      variantDescription: "Empty or plain text",
      variantDescriptionCs: "Prázdný nebo prostý text",
      scores: { kytario: 0, chordpro: 0, ultimateguitar: 0 },
      stats: {
        chordProDirectives: 0,
        standardBracketsCount: 0,
        unicodeBracketsCount: 0,
        angleBracketsCount: 0,
        parenthesesChordsCount: 0,
        inlineMarkerChordsCount: 0,
        totalInlineChordsCount: 0,
        kytarioBraceChordsCount: 0,
        chordLinesCount: 0,
        lyricLinesCount: 0,
        sectionHeadersCount: 0,
        kytarioHeadersCount: 0,
      }
    };
  }

  const lines = text.split(/\r?\n/);
  
  let chordProDirectives = 0;
  let standardBracketsCount = 0;
  let unicodeBracketsCount = 0;
  let angleBracketsCount = 0;
  let parenthesesChordsCount = 0;
  let inlineMarkerChordsCount = 0;
  let kytarioBraceChordsCount = 0;
  let kytarioHeadersCount = 0;
  let kytarioRepeatsCount = 0;
  let kytarioCrossRefs = 0;
  let chordLinesCount = 0;
  let lyricLinesCount = 0;
  let pairedChordLinesCount = 0;
  let ugHeadersCount = 0;

  // 1. Directives detection patterns
  const directiveNames = [
    "title", "t", "subtitle", "st", "sub", "artist", "a", "define", "chord", "diagrams",
    "start_of_chorus", "soc", "end_of_chorus", "eoc",
    "start_of_verse", "sov", "end_of_verse", "eov",
    "start_of_bridge", "sob", "end_of_bridge", "eob",
    "start_of_tab", "sot", "end_of_tab", "eot",
    "start_of_grid", "sog", "end_of_grid", "eog",
    "start_of_part", "end_of_part", "start_of_intro", "end_of_intro", "start_of_outro", "end_of_outro", "start_of_solo", "end_of_solo",
    "comment", "c", "comment_italic", "ci", "comment_bold", "cb", "highlight",
    "capo", "key", "k", "tempo", "time", "duration", "album", "composer", "lyricist", "arranger", "meta"
  ];
  const directiveRegex = new RegExp(`\\{(?:${directiveNames.join("|")})(?:[:\\s][^\\}]*)?\\}`, "i");
  const directiveBracketRegex = new RegExp(`\\[(?:${directiveNames.join("|")})[:\\s][^\\]]*\\]`, "i");
  const directiveHashRegex = new RegExp(`^#(?:${directiveNames.join("|")})[:\\s]`, "i");
  const directivePercentRegex = new RegExp(`^%(?:${directiveNames.join("|")})[:\\s]`, "i");

  // Analyze lines for directives and line structures
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for directives
    if (directiveRegex.test(trimmed) || directiveBracketRegex.test(trimmed) || directiveHashRegex.test(trimmed) || directivePercentRegex.test(trimmed)) {
      chordProDirectives++;
      continue;
    }

    // Check for Kytario section headers: - 1., - REF1, - BRD, - INT, + 1., etc.
    if (/^[\-\+]\s*(?:[0-9]+\.|REF[0-9]*|BRD|INT|OUT|SOLO|PRE|MEZ|DOH|PŘE|SLOKA|REFRÉN)/i.test(trimmed)) {
      kytarioHeadersCount++;
      continue;
    }

    // Check for Kytario repetition: |: ... :|
    if (trimmed.includes("|:") && trimmed.includes(":|")) {
      kytarioRepeatsCount++;
    }

    // Check for Kytario cross-references: [REF1], [1.], [2.]
    if (/\[(?:REF[0-9]*|[0-9]+\.)\]/i.test(trimmed)) {
      kytarioCrossRefs++;
    }

    // Check for UG section headers: [Verse 1], [Chorus], Intro:, Verse 1:, Refrén:
    if (/^\[([^\]]+)\]$|^([A-Za-z0-9\súSlokarefrén]+):$|^\-?\s*(Verse|Chorus|Ref|Refren|Bridge|Brd|Pre\-Chorus|Pre|Intro|Outro|Solo|Sloka)\s*([0-9]*)\.?$/i.test(trimmed)) {
      const headerInner = trimmed.replace(/[\[\]\:]/g, "").trim();
      if (!isChord(headerInner)) {
        ugHeadersCount++;
        continue;
      }
    }

    // Check if line is a pure chord line
    if (isChordLine(line)) {
      chordLinesCount++;
      // Check if followed by lyric line
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && !isChordLine(nextLine) && !directiveRegex.test(nextLine) && !/^[\-\+]/.test(nextLine)) {
          pairedChordLinesCount++;
        }
      }
    } else {
      lyricLinesCount++;
    }
  }

  // 2. Scan entire text for inline chord brackets and marker styles
  // Standard square brackets [C]
  const standardBracketMatches = text.matchAll(/\[([^\]\n]+)\]/g);
  for (const m of standardBracketMatches) {
    const inner = m[1].trim();
    if (isChord(inner) && !inner.toLowerCase().includes("verse") && !inner.toLowerCase().includes("chorus") && !inner.toLowerCase().includes("intro") && !inner.toLowerCase().includes("bridge")) {
      standardBracketsCount++;
    }
  }

  // Unicode / CJK fullwidth brackets: ［C］, 【C】, 〔C〕, 〖C〗, 「C」, 『C』, ❲C❳, ⟦C⟧, ⦋C⦌
  const unicodeBracketMatches = text.matchAll(/[［【〔〖「『❲⟦⦋]([^］】〕〗」』❳⟧⦌\n]+)[］】〕〗」』❳⟧⦌]/g);
  for (const m of unicodeBracketMatches) {
    const inner = m[1].trim();
    if (isChord(inner)) {
      unicodeBracketsCount++;
    }
  }

  // Angle brackets / Guillemets: <C>, «C», ‹C›, ⟨C⟩
  const angleBracketMatches = text.matchAll(/[<«‹⟨]([^>»›⟩\n]+)[>»›⟩]/g);
  for (const m of angleBracketMatches) {
    const inner = m[1].trim();
    // Exclude common HTML tags like <br>, <p>, <div>
    if (!["br", "p", "div", "span", "b", "i", "u", "hr", "h1", "h2", "h3"].includes(inner.toLowerCase()) && isChord(inner)) {
      angleBracketsCount++;
    }
  }

  // Parentheses: (C), (Am7)
  const parenMatches = text.matchAll(/\(([^\)\n]+)\)/g);
  for (const m of parenMatches) {
    const inner = m[1].trim();
    const innerLower = inner.toLowerCase();
    if (!NON_CHORD_PARENS.has(innerLower) && !innerLower.startsWith("capo") && !innerLower.startsWith("tónina") && !innerLower.startsWith("tempo") && isChord(inner)) {
      parenthesesChordsCount++;
    }
  }

  // Inline markers: /C/, |C|, %C%, _C_, *C*
  // First strip all {...} and [...] blocks to avoid matching slash chords inside braces (e.g. {Bm/D} {Bm/C#})
  const textWithoutBrackets = text.replace(/\{[^\}\n]*\}/g, " ").replace(/\[[^\]\n]*\]/g, " ");
  const markerMatches = textWithoutBrackets.matchAll(/(?:^|[\s,.:;])([\/\|\%_\*])([A-H][b#♭♯]?(?:maj|min|dim|aug|sus|add|mi|m)?[0-9]*(?:\/[A-H][b#♭♯]?)?)\1(?=[\s,.:;]|$)/gi);
  for (const m of markerMatches) {
    const inner = m[2].trim();
    if (isChord(inner)) {
      inlineMarkerChordsCount++;
    }
  }

  // Curly braces: {C} (exclude directives)
  const braceMatches = text.matchAll(/\{([^\}\n]+)\}/g);
  for (const m of braceMatches) {
    const inner = m[1].trim();
    if (isChord(inner) && !inner.includes(":")) {
      kytarioBraceChordsCount++;
    }
  }

  const totalInlineChordsCount = standardBracketsCount + unicodeBracketsCount + angleBracketsCount + parenthesesChordsCount + inlineMarkerChordsCount;

  // 3. Compute weighted scores
  const chordproScore = 
    (chordProDirectives * 6.0) +
    (standardBracketsCount * 2.5) +
    (unicodeBracketsCount * 2.5) +
    (angleBracketsCount * 2.2) +
    (parenthesesChordsCount * 1.8) +
    (inlineMarkerChordsCount * 1.5);

  const kytarioScore = 
    (kytarioBraceChordsCount * 2.5) +
    (kytarioHeadersCount * 5.0) +
    (kytarioRepeatsCount * 3.0) +
    (kytarioCrossRefs * 2.5);

  const ultimateguitarScore = 
    (chordLinesCount * 3.5) +
    (pairedChordLinesCount * 2.5) +
    (ugHeadersCount * 1.5);

  const totalScore = chordproScore + kytarioScore + ultimateguitarScore;

  // Determine top format
  let format: "kytario" | "chordpro" | "ultimateguitar" = "ultimateguitar";
  let topScore = ultimateguitarScore;

  if (kytarioScore > chordproScore && kytarioScore > ultimateguitarScore) {
    format = "kytario";
    topScore = kytarioScore;
  } else if (chordproScore >= ultimateguitarScore && chordproScore > 0) {
    format = "chordpro";
    topScore = chordproScore;
  } else {
    format = "ultimateguitar";
    topScore = ultimateguitarScore;
  }

  // 4. Determine ChordPro Variant
  let variant: FormatDetectionDetails["variant"] = "plain_ug";
  let variantDescription = "Chords Over Lyrics (Ultimate-Guitar)";
  let variantDescriptionCs = "Akordy nad textem (Ultimate-Guitar)";

  if (format === "kytario") {
    variant = "kytario_standard";
    variantDescription = "Kytario standard ({C} with section headers)";
    variantDescriptionCs = "Standardní Kytario ({C} se záhlavími sekcí)";
  } else if (format === "chordpro") {
    const bracketTypesActive = [
      standardBracketsCount > 0,
      unicodeBracketsCount > 0,
      angleBracketsCount > 0,
      parenthesesChordsCount > 0,
      inlineMarkerChordsCount > 0
    ].filter(Boolean).length;

    if (chordProDirectives > 0 && totalInlineChordsCount === 0) {
      variant = "directives_only";
      variantDescription = "ChordPro Directives ({title:...}, {soc})";
      variantDescriptionCs = "ChordPro direktivy ({title:...}, {soc})";
    } else if (bracketTypesActive >= 2) {
      variant = "mixed";
      variantDescription = "Mixed ChordPro markup";
      variantDescriptionCs = "Kombinované značení ChordPro";
    } else if (unicodeBracketsCount > 0 && unicodeBracketsCount >= standardBracketsCount) {
      variant = "unicode_brackets";
      variantDescription = "Unicode brackets 【C】 / ［C］";
      variantDescriptionCs = "Unicode závorky 【C】 / ［C］";
    } else if (angleBracketsCount > 0 && angleBracketsCount >= standardBracketsCount) {
      variant = "angle_brackets";
      variantDescription = "Angle brackets <C> / «C»";
      variantDescriptionCs = "Špičaté závorky <C> / «C»";
    } else if (parenthesesChordsCount > 0 && parenthesesChordsCount >= standardBracketsCount) {
      variant = "parentheses";
      variantDescription = "Parentheses chords (C)";
      variantDescriptionCs = "Akordy v kulatých závorkách (C)";
    } else if (inlineMarkerChordsCount > 0 && inlineMarkerChordsCount >= standardBracketsCount) {
      variant = "inline_markers";
      variantDescription = "Inline markers /C/ |C| %C%";
      variantDescriptionCs = "Oddělovače /C/ |C| %C%";
    } else {
      variant = "standard";
      variantDescription = "Standard ChordPro [C]";
      variantDescriptionCs = "Standardní ChordPro [C]";
    }
  }

  // 5. Confidence and Ambiguity Analysis
  const confidence = totalScore > 0 
    ? Math.min(0.99, Math.max(0.40, topScore / (totalScore + 0.001)))
    : 0.50;

  let isAmbiguous = false;
  let ambiguityReason: string | undefined = undefined;
  let ambiguityReasonCs: string | undefined = undefined;
  let suggestedAlternative: "kytario" | "chordpro" | "ultimateguitar" | undefined = undefined;

  // Condition 1: Mixed ChordPro and Chords-Over-Lyrics lines (only when format is ChordPro or UltimateGuitar)
  if (format !== "kytario" && chordproScore > 0 && ultimateguitarScore > 0 && (Math.min(chordproScore, ultimateguitarScore) / Math.max(chordproScore, ultimateguitarScore)) >= 0.35) {
    isAmbiguous = true;
    ambiguityReason = "The song contains both chord lines above lyrics and inline bracketed chords. Auto-selected the dominant style.";
    ambiguityReasonCs = "Píseň obsahuje jak řádky akordů nad textem, tak vložené akordy v závorkách. Zvolen převažující styl.";
    suggestedAlternative = format === "chordpro" ? "ultimateguitar" : "chordpro";
  }
  // Condition 2: Chords only in parentheses (could be singing instructions or notes)
  else if (format === "chordpro" && parenthesesChordsCount > 0 && standardBracketsCount === 0 && unicodeBracketsCount === 0 && angleBracketsCount === 0 && chordProDirectives === 0) {
    isAmbiguous = true;
    ambiguityReason = "Chords were detected inside parentheses (e.g. (C)). These may be ChordPro chords or vocal notes/annotations.";
    ambiguityReasonCs = "Akordy byly nalezeny v kulatých závorkách (např. (C)). Může jít o akordy i o pěvecké poznámky.";
    suggestedAlternative = "ultimateguitar";
  }
  // Condition 3: Isolated single bracket chord with section headers
  else if (format === "chordpro" && totalInlineChordsCount === 1 && ugHeadersCount > 0 && chordLinesCount === 0 && chordProDirectives === 0) {
    isAmbiguous = true;
    ambiguityReason = "Only a single bracketed chord was found alongside section headers. Verify if this is ChordPro or Chords Over Lyrics.";
    ambiguityReasonCs = "Nalezen pouze jeden akord v závorce spolu se záhlavími sekcí. Zkontrolujte, zda jde o ChordPro nebo akordy nad textem.";
    suggestedAlternative = "ultimateguitar";
  }
  // Condition 4: Curly brace chords without Kytario section headers
  else if (format === "kytario" && kytarioBraceChordsCount > 0 && kytarioHeadersCount === 0 && chordProDirectives === 0 && totalInlineChordsCount === 0) {
    isAmbiguous = true;
    ambiguityReason = "Contains curly-brace chords {C} without Kytario section prefixes (- 1., - REF1). Handled as Kytario.";
    ambiguityReasonCs = "Obsahuje akordy ve složených závorkách {C} bez kytariovských předpon sekcí (- 1., - REF1). Zpracováno jako Kytario.";
    suggestedAlternative = "chordpro";
  }
  // Condition 5: Low confidence margin (only if neither is a dominant winner)
  else if (totalScore > 3 && confidence < 0.60) {
    isAmbiguous = true;
    ambiguityReason = "Multiple formatting characteristics detected with similar weights.";
    ambiguityReasonCs = "Detekováno více různých stylů formátování s podobnou mírou.";
    suggestedAlternative = format === "chordpro" ? "ultimateguitar" : (format === "ultimateguitar" ? "chordpro" : "ultimateguitar");
  }

  return {
    format,
    confidence: Math.round(confidence * 100) / 100,
    isAmbiguous,
    ambiguityReason,
    ambiguityReasonCs,
    variant,
    variantDescription,
    variantDescriptionCs,
    scores: {
      kytario: Math.round(kytarioScore * 10) / 10,
      chordpro: Math.round(chordproScore * 10) / 10,
      ultimateguitar: Math.round(ultimateguitarScore * 10) / 10
    },
    stats: {
      chordProDirectives,
      standardBracketsCount,
      unicodeBracketsCount,
      angleBracketsCount,
      parenthesesChordsCount,
      inlineMarkerChordsCount,
      totalInlineChordsCount,
      kytarioBraceChordsCount,
      chordLinesCount,
      lyricLinesCount,
      sectionHeadersCount: ugHeadersCount + kytarioHeadersCount,
      kytarioHeadersCount
    },
    suggestedAlternative
  };
}

// Detect format from input text (fast helper returning target format string)
export function detectFormat(text: string): "kytario" | "chordpro" | "ultimateguitar" {
  return detectFormatDetailed(text).format;
}

// Map Ultimate-Guitar section headers to Kytario equivalents
export function mapSectionHeader(headerText: string, verseIndex: number): { header: string; nextVerseIndex: number } {
  const clean = headerText.replace(/[\[\]\:\-]/g, "").trim().toLowerCase();
  
  if (clean.includes("chorus") || clean.includes("refrén") || clean.includes("ref")) {
    return { header: "- Ref.", nextVerseIndex: verseIndex };
  }
  if (clean.includes("bridge") || clean.includes("přechod")) {
    return { header: "- Brid.", nextVerseIndex: verseIndex };
  }
  if (clean.includes("intro") || clean.includes("předehra") || clean.includes("úvod")) {
    return { header: "- Int.", nextVerseIndex: verseIndex };
  }
  if (clean.includes("outro") || clean.includes("dohra")) {
    return { header: "- Out.", nextVerseIndex: verseIndex };
  }
  if (clean.includes("pre-chorus") || clean.includes("prechorus")) {
    return { header: "- Pre.", nextVerseIndex: verseIndex };
  }
  if (clean.includes("solo") || clean.includes("sólo") || clean.includes("interlude") || clean.includes("mezihra")) {
    return { header: "", nextVerseIndex: verseIndex };
  }
  if (clean.includes("verse") || clean.includes("sloka") || /^[0-9]+/.test(clean)) {
    const numMatch = clean.match(/[0-9]+/);
    const num = numMatch ? parseInt(numMatch[0]) : verseIndex;
    return { header: `- ${num}.`, nextVerseIndex: num + 1 };
  }

  // Default fallback if we detect a general section header
  return { header: `- ${verseIndex}.`, nextVerseIndex: verseIndex + 1 };
}

// Custom advanced section mapper carried on conversion counts
function mapHeaderOnCounts(headerText: string, counts: { verse: number; ref: number }): string {
  const clean = headerText.replace(/[\[\]\(\)\:\-]/g, "").trim().toLowerCase();
  
  const numMatch = clean.match(/[0-9]+/);
  const explicitNumber = numMatch ? parseInt(numMatch[0]) : null;

  if (clean.includes("chorus") || clean.includes("refrén") || clean.includes("ref")) {
    const num = explicitNumber !== null ? explicitNumber : counts.ref;
    if (explicitNumber === null) {
      counts.ref++;
    } else {
      counts.ref = Math.max(counts.ref, explicitNumber + 1);
    }
    return `- REF${num}`;
  }

  if (clean.includes("bridge") || clean.includes("přechod") || clean === "brd") {
    return "- Brid.";
  }

  if (clean.includes("pre-chorus") || clean.includes("prechorus") || clean.includes("předrefrén")) {
    return "- Pre.";
  }

  if (clean.includes("intro") || clean.includes("předehra") || clean.includes("úvod")) {
    return "- Int.";
  }

  if (clean.includes("outro") || clean.includes("dohra")) {
    return "- Out.";
  }

  if (clean.includes("solo") || clean.includes("sólo") || clean.includes("interlude") || clean.includes("mezihra")) {
    return "";
  }

  if (clean.includes("verse") || clean.includes("sloka") || explicitNumber !== null) {
    const num = explicitNumber !== null ? explicitNumber : counts.verse;
    if (explicitNumber === null) {
      counts.verse++;
    } else {
      counts.verse = Math.max(counts.verse, explicitNumber + 1);
    }
    return `- ${num}.`;
  }

  const num = counts.verse;
  counts.verse++;
  return `- ${num}.`;
}

interface SongBlock {
  startIndex: number;
  endIndex: number;
  lines: string[];
  contentLines: string[];
  hasHeader: boolean;
  headerType: 'verse' | 'ref' | 'other';
  headerText: string;
  lyricsFingerprint: string;
  chordFingerprint: string;
  isInstrumental: boolean;
}

function getWordTokens(text: string): string[] {
  return text.split(/\s+/).filter(w => w.length > 0);
}

function getOverlapSimilarity(fp1: string, fp2: string): number {
  if (!fp1 || !fp2) return 0;
  const tokens1 = getWordTokens(fp1);
  const tokens2 = getWordTokens(fp2);
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  let intersection = 0;
  set1.forEach(t => {
    if (set2.has(t)) intersection++;
  });
  
  const union = set1.size + set2.size - intersection;
  return intersection / union;
}

function autoDetectSectionHeaders(resultLines: string[]): string[] {
  const blocks: SongBlock[] = [];
  let currentBlockLines: string[] = [];
  let startIdx = -1;
  
  for (let i = 0; i < resultLines.length; i++) {
    const line = resultLines[i];
    if (line.trim() !== "") {
      // If the line is a Kytario header, start a new block immediately
      if (line.trim().startsWith("- ") && currentBlockLines.length > 0) {
        blocks.push(parseBlock(startIdx, i - 1, currentBlockLines));
        currentBlockLines = [];
        startIdx = i;
      }
      
      if (startIdx === -1) {
        startIdx = i;
      }
      currentBlockLines.push(line);
    } else {
      if (currentBlockLines.length > 0) {
        blocks.push(parseBlock(startIdx, i - 1, currentBlockLines));
        currentBlockLines = [];
        startIdx = -1;
      }
    }
  }
  if (currentBlockLines.length > 0) {
    blocks.push(parseBlock(startIdx, resultLines.length - 1, currentBlockLines));
  }

  if (blocks.length === 0) return resultLines;

  function parseBlock(startIndex: number, endIndex: number, lines: string[]): SongBlock {
    const firstLine = lines[0].trim();
    const kytarioHeaderRegex = /^-\s*(.+)$/;
    const headerMatch = firstLine.match(kytarioHeaderRegex);
    const hasHeader = !!headerMatch;
    
    let headerType: 'verse' | 'ref' | 'other' = 'other';
    let headerText = "";
    
    if (hasHeader && headerMatch) {
      headerText = headerMatch[1].trim().toUpperCase();
      if (headerText.startsWith("REF")) {
        headerType = 'ref';
      } else if (/^[0-9]+\.$/.test(headerText) || headerText.startsWith("VERSE") || headerText.startsWith("SLOKA")) {
        headerType = 'verse';
      } else {
        headerType = 'other';
      }
    }
    
    const contentLines = hasHeader ? lines.slice(1) : lines;
    
    const lyricsLines = contentLines.map(line => {
      const clean = line.replace(/\{[^\}]+\}/g, "");
      return clean.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }).filter(line => line.length > 0);
    
    const lyricsFingerprint = lyricsLines.join(" ");
    
    const chords: string[] = [];
    contentLines.forEach(line => {
      const matches = line.match(/\{([^\}]+)\}/g);
      if (matches) {
        matches.forEach(m => {
          const inner = m.slice(1, -1).trim().split(/\s+/);
          inner.forEach(c => {
            if (c && c.toUpperCase() !== "X") {
              chords.push(c);
            }
          });
        });
      }
    });
    const chordFingerprint = chords.join(",");
    const isInstrumental = chords.length > 0 && lyricsFingerprint.length < 5;
    
    return {
      startIndex,
      endIndex,
      lines,
      contentLines,
      hasHeader,
      headerType,
      headerText,
      lyricsFingerprint,
      chordFingerprint,
      isInstrumental,
    };
  }

  const blockClass = blocks.map(b => {
    return {
      block: b,
      assignedType: b.hasHeader ? b.headerType : undefined,
      assignedText: b.hasHeader ? b.lines[0] : undefined,
    };
  });

  // Group similar blocks
  const similarGroups: number[][] = [];
  const processed = new Set<number>();
  
  for (let i = 0; i < blocks.length; i++) {
    if (processed.has(i)) continue;
    const bI = blocks[i];
    if (bI.isInstrumental || bI.lyricsFingerprint.length < 15) continue;
    
    const group = [i];
    for (let j = i + 1; j < blocks.length; j++) {
      const bJ = blocks[j];
      if (bJ.isInstrumental || bJ.lyricsFingerprint.length < 15) continue;
      
      const sim = getOverlapSimilarity(bI.lyricsFingerprint, bJ.lyricsFingerprint);
      if (sim >= 0.65) {
        group.push(j);
      }
    }
    if (group.length > 1) {
      similarGroups.push(group);
      group.forEach(idx => processed.add(idx));
    }
  }

  // Detect which similarity groups should be labelled as REF
  similarGroups.forEach(group => {
    let hasRefLabel = false;
    for (const idx of group) {
      if (blockClass[idx].assignedType === 'ref') {
        hasRefLabel = true;
        break;
      }
    }
    
    if (hasRefLabel) {
      group.forEach(idx => {
        blockClass[idx].assignedType = 'ref';
      });
    } else {
      const allUnlabeled = group.every(idx => blockClass[idx].assignedType === undefined);
      if (allUnlabeled) {
        group.forEach(idx => {
          blockClass[idx].assignedType = 'ref';
        });
      }
    }
  });

  // Assign sequential, strictly unique numbers for "verse" and "ref", and strip instrumental headers
  let refCounter = 1;
  let verseCounter = 1;

  blockClass.forEach(bc => {
    if (bc.block.isInstrumental) {
      if (bc.block.hasHeader) {
        bc.assignedText = bc.block.lines[0];
      } else {
        bc.assignedType = undefined;
        bc.assignedText = undefined;
      }
      return;
    }

    if (bc.assignedType === 'ref') {
      bc.assignedText = `- REF${refCounter++}`;
    } else if (bc.assignedType === 'other') {
      if (bc.assignedText) {
        bc.assignedText = bc.assignedText.trim();
      }
    } else {
      bc.assignedType = 'verse';
      bc.assignedText = `- ${verseCounter++}.`;
    }
  });

  // Reconstruct the array of lines
  const finalLines: string[] = [];
  for (let i = 0; i < blockClass.length; i++) {
    const bc = blockClass[i];
    if (i > 0) {
      finalLines.push("");
    }
    
    if (bc.assignedText) {
      finalLines.push(bc.assignedText);
    }
    bc.block.contentLines.forEach(l => finalLines.push(l.trim()));
  }

  return finalLines;
}

// Deeply robust helper to check if a trimmed line is a section header in any input format
function isInputSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // ChordPro directives are NEVER section headers
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return false;
  if (/^\{[a-z0-9_]+.*\}$/i.test(trimmed)) return false;

  // 1. Kytario headers starting with "- "
  if (trimmed.startsWith("- ")) return true;

  // 2. ChordPro start directives
  const l = trimmed.toLowerCase();
  if (l.startsWith("{start_of_")) return true;
  if (l === "{soc}" || l === "{sov}" || l === "{sob}" || l === "{sot}") return true;
  if (/^\{start_of_[a-z0-9_]+(\s*:\s*[^\}]+)?\}$/i.test(l)) return true;
  if (/^\{(soc|sov|sob|sot)(\s*:\s*[^\}]+)?\}$/i.test(l)) return true;

  // 3. General section bracketed/labeled headers
  const sectionMatch = trimmed.match(/^\[([^\]]+)\]$|^([A-Za-z0-9\súSlokarefrén]+):$|^\-?\s*(Verse|Chorus|Ref|Refren|Bridge|Brd|Pre\-Chorus|Pre|Intro|Outro|Solo|Sloka)\s*([0-9]*)\.?$/i);
  if (sectionMatch) {
    const headerText = sectionMatch[1] || sectionMatch[2] || trimmed;
    if (!isChord(headerText)) {
      return true;
    }
  }

  return false;
}

// Preprocess ChordPro text that might be crammed on a single line or missing newlines around directives
function preprocessChordProText(text: string): string {
  if (!text) return text;
  const directiveNames = [
    "title", "t", "subtitle", "st", "sub", "artist", "a", "define", "chord", "diagrams",
    "start_of_chorus", "soc", "end_of_chorus", "eoc",
    "start_of_verse", "sov", "end_of_verse", "eov",
    "start_of_bridge", "sob", "end_of_bridge", "eob",
    "start_of_tab", "sot", "end_of_tab", "eot",
    "start_of_grid", "sog", "end_of_grid", "eog",
    "start_of_part", "end_of_part", "start_of_intro", "end_of_intro", "start_of_outro", "end_of_outro", "start_of_solo", "end_of_solo",
    "comment", "c", "comment_italic", "ci", "comment_bold", "cb", "highlight",
    "capo", "key", "k", "tempo", "time", "duration", "album", "composer", "lyricist", "arranger", "meta"
  ];
  let processed = text.replace(/\r\n/g, "\n");
  const pattern = new RegExp(`\\s*(\\{(?:${directiveNames.join("|")})[^\\}]*\\})\\s*`, "gi");
  processed = processed.replace(pattern, "\n$1\n");
  processed = processed.replace(/\n{3,}/g, "\n\n");
  return processed.trim();
}

// Heuristic-based parser to identify and separate song title and artist from initial lines of the source input
export function parseTitleAndArtistHeuristic(text: string): { title?: string; artist?: string; remainingText: string } {
  const lines = text.split(/\r?\n/);
  let title: string | undefined = undefined;
  let artist: string | undefined = undefined;
  
  const consumedIndices = new Set<number>();
  
  // Inspect first 6 non-empty lines for metadata headers
  const nonColLines: { index: number; text: string; trimmed: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed) {
      nonColLines.push({ index: i, text: lines[i], trimmed });
      if (nonColLines.length >= 6) break;
    }
  }

  for (const item of nonColLines) {
    const { index, trimmed } = item;
    
    // Title/song tags: Title:, T:, Song:, Název:, Skladba:, [title: ...], #title: ..., %title: ...
    const titleRegex = /^(?:[#%]\s*|\[\s*)?(?:title|t|song|název|skladba)\s*[:\s]\s*([^\]]+)\]?$/i;
    const titleMatch = trimmed.match(titleRegex);
    if (titleMatch && !trimmed.startsWith("{")) {
      title = titleMatch[1].trim();
      consumedIndices.add(index);
      continue;
    }

    // Artist tags: Artist:, A:, Interpret:, Autor:, Skupina:, Author:, Performer:
    const artistRegex = /^(?:[#%]\s*|\[\s*)?(?:artist|a|interpret|autor|skupina|interpretace|author|composer|performer)\s*[:\s]\s*([^\]]+)\]?$/i;
    const artistMatch = trimmed.match(artistRegex);
    if (artistMatch && !trimmed.startsWith("{")) {
      artist = artistMatch[1].trim();
      consumedIndices.add(index);
      continue;
    }

    // ChordPro braces format {title: ...} or {title ...} or {artist: ...}
    const cpTitleMatch = trimmed.match(/^\{\s*(?:title|t)\s*[:\s]\s*([^\}]+)\}/i);
    if (cpTitleMatch) {
      title = cpTitleMatch[1].trim();
      consumedIndices.add(index);
      continue;
    }

    const cpArtistMatch = trimmed.match(/^\{\s*(?:artist|a)\s*[:\s]\s*([^\}]+)\}/i);
    if (cpArtistMatch) {
      artist = cpArtistMatch[1].trim();
      consumedIndices.add(index);
      continue;
    }
  }

  // If we haven't found title and artist from key-value tags, check for "Artist - Title" format in the first non-empty line
  if (!title && !artist && nonColLines.length > 0) {
    const firstItem = nonColLines[0];
    const { index, trimmed } = firstItem;
    
    if (!isChordLine(trimmed) && !isInputSectionHeader(trimmed)) {
      const dashRegex = /\s*(?:-|–|—)\s*/;
      const parts = trimmed.split(dashRegex);
      
      if (parts.length === 2) {
        const left = parts[0].trim();
        const right = parts[1].trim();
        
        if (
          left && right && 
          !isChord(left) && !isChord(right) && 
          !left.startsWith("[") && !left.startsWith("-") && !left.startsWith("{")
        ) {
          artist = left;
          title = right;
          consumedIndices.add(index);
        }
      }
    }
  }

  const remainingLines = lines.filter((_, idx) => !consumedIndices.has(idx));
  
  return {
    title,
    artist,
    remainingText: remainingLines.join("\n")
  };
}

// Helper to clean input text (tabs, line ends, trailing spaces, excessive blank lines)
export function cleanInputText(text: string): string {
  if (!text) return "";
  let cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  cleaned = cleaned.replace(/\t/g, " ");
  const lines = cleaned.split("\n");
  const processed = lines.map(line => line.trimEnd());
  return processed.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Intelligently collapses redundant whitespace in a line:
 * - Collapses 2+ consecutive spaces in lyric/text portions to 1 space.
 * - Preserves spacing in chord-only lines (e.g. "{C#m}     {C#m/E}" or "|: {Am}   {F} :|").
 * - Preserves brace/bracket chord contents (e.g. "{C#m/E}").
 * - Collapses spaces around section headers cleanly.
 */
export function collapseLyricSpaces(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return "";

  // 1. Check if line is a section header (e.g. "- REF 1", "[Verse 1]")
  if (trimmed.startsWith("- ") || trimmed.startsWith("+ ")) {
    return trimmed.replace(/[ \t]{2,}/g, " ");
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]") && !isChord(trimmed.slice(1, -1))) {
    return trimmed.replace(/[ \t]{2,}/g, " ");
  }

  // 2. Check if the line is purely chords, repeat marks, or bar lines (no lyrics)
  // e.g. "{C#m}     {C#m/E}", "|: {Am}   {F} :| 2x", "C#m     A"
  const strippedOfChords = trimmed
    .replace(/\{[^\}]+\}/g, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\|:|\:|\||\(|\)|\d+x|\d+X/g, "")
    .trim();

  if (strippedOfChords === "") {
    // Pure chord line: preserve the spaces between chords/markers
    return trimmed;
  }

  // 3. Line with mixed chords and lyrics (e.g. "{C}   When   the   {G}   night")
  // Replace multiple spaces in the non-chord text segments with single space
  let result = "";
  let inBrace = false;
  let inBracket = false;
  let tempSpaceCount = 0;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === "{" && !inBracket) {
      if (tempSpaceCount > 0) {
        result += " ";
        tempSpaceCount = 0;
      }
      inBrace = true;
      result += char;
      continue;
    }

    if (char === "}" && inBrace) {
      inBrace = false;
      result += char;
      continue;
    }

    if (char === "[" && !inBrace) {
      if (tempSpaceCount > 0) {
        result += " ";
        tempSpaceCount = 0;
      }
      inBracket = true;
      result += char;
      continue;
    }

    if (char === "]" && inBracket) {
      inBracket = false;
      result += char;
      continue;
    }

    if (inBrace || inBracket) {
      result += char;
      continue;
    }

    // Outside chords: handle spaces
    if (char === " " || char === "\t") {
      tempSpaceCount++;
    } else {
      if (tempSpaceCount > 0) {
        if (result.length > 0) {
          result += " ";
        }
        tempSpaceCount = 0;
      }
      result += char;
    }
  }

  return result.trim();
}

// Main programmatic converter
export function convertToKytario(
  text: string, 
  format: "auto" | "chordpro" | "ultimateguitar" | "kytario" = "auto",
  options?: NormalizeOptions
): { result: string; metadata: { title?: string; artist?: string } } {
  const sanitizedInput = cleanInputText(text);
  const detected = format === "auto" ? detectFormat(sanitizedInput) : format;
  const processedText = detected === "chordpro" ? preprocessChordProText(sanitizedInput) : sanitizedInput;
  
  // Parse title and artist heuristically from standard headers / initial lines
  const { title: heuristicTitle, artist: heuristicArtist, remainingText } = parseTitleAndArtistHeuristic(processedText);
  
  if (detected === "kytario") {
    const titleMatch = remainingText.match(/\{title:\s*([^\}]+)\}/i);
    const artistMatch = remainingText.match(/\{artist:\s*([^\}]+)\}/i);
    const metadata: { title?: string; artist?: string } = {
      title: heuristicTitle || (titleMatch ? titleMatch[1].trim() : undefined),
      artist: heuristicArtist || (artistMatch ? artistMatch[1].trim() : undefined)
    };
    
    let cleanText = remainingText;
    if (titleMatch) cleanText = cleanText.replace(/\{title:[^\}]+\}\r?\n?/gi, "");
    if (artistMatch) cleanText = cleanText.replace(/\{artist:[^\}]+\}\r?\n?/gi, "");
    
    if (options?.convertAngloToEuropean || options?.minorFormat) {
      cleanText = cleanText.replace(/\{([^\}]+)\}/g, (match, p1) => {
        if (p1.toUpperCase() === "X") return match;
        if (p1.includes(" ")) {
          const parts = p1.split(/\s+/);
          const convertedParts = parts.map(p => {
            if (isChord(p)) return normalizeChordName(p, options);
            return p;
          });
          return `{${convertedParts.join(" ")}}`;
        }
        return `{${normalizeChordName(p1, options)}}`;
      });
    }

    const rawLines = cleanText.split(/\r?\n/);
    const cleanLines: string[] = [];
    for (let i = 0; i < rawLines.length; i++) {
      let line = collapseLyricSpaces(rawLines[i]);
      cleanLines.push(line);
      if (isInputSectionHeader(line)) {
        while (i + 1 < rawLines.length && rawLines[i + 1].trim() === "") {
          i++;
        }
      }
    }
    return { result: cleanLines.join("\n").replace(/\n{3,}/g, "\n\n").trim(), metadata };
  }

  const rawLines = remainingText.split(/\r?\n/);
  const lines: string[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    lines.push(line);
    if (isInputSectionHeader(line)) {
      while (i + 1 < rawLines.length && rawLines[i + 1].trim() === "") {
        i++;
      }
    }
  }

  const resultLines: string[] = [];
  
  let metadata: { title?: string; artist?: string } = {
    title: heuristicTitle,
    artist: heuristicArtist
  };
  
  const counts = {
    verse: 1,
    ref: 1
  };

  if (detected === "chordpro") {
    // Process ChordPro format with broad variant support (brackets, unicode, angle brackets, parentheses, directives)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed) {
        resultLines.push("");
        continue;
      }

      // 1. Directives parsing: {...}, [...], #..., %...
      let directiveKey: string | null = null;
      let directiveValue = "";

      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const body = trimmed.slice(1, -1).trim();
        const colonIndex = body.indexOf(":");
        if (colonIndex !== -1) {
          directiveKey = body.slice(0, colonIndex).trim().toLowerCase();
          directiveValue = body.slice(colonIndex + 1).trim();
        } else {
          // Directives without colon e.g. {title Song Name} or single keywords like {soc}
          const spaceIndex = body.indexOf(" ");
          if (spaceIndex !== -1) {
            const firstWord = body.slice(0, spaceIndex).trim().toLowerCase();
            const rest = body.slice(spaceIndex + 1).trim();
            if ([
              "title", "t", "subtitle", "st", "sub", "artist", "a", "album", "composer",
              "lyricist", "arranger", "capo", "key", "k", "tempo", "time", "duration",
              "comment", "c", "comment_italic", "ci", "comment_bold", "cb", "highlight",
              "start_of_part", "meta", "define", "chord"
            ].includes(firstWord)) {
              directiveKey = firstWord;
              directiveValue = rest;
            } else {
              directiveKey = body.toLowerCase();
            }
          } else {
            directiveKey = body.toLowerCase();
          }
        }
      } else if (trimmed.startsWith("[") && trimmed.endsWith("]") && trimmed.includes(":")) {
        const body = trimmed.slice(1, -1).trim();
        const colonIndex = body.indexOf(":");
        const potentialKey = body.slice(0, colonIndex).trim().toLowerCase();
        if (["title", "t", "artist", "a", "subtitle", "st", "comment", "c", "capo", "key", "tempo", "time", "album"].includes(potentialKey)) {
          directiveKey = potentialKey;
          directiveValue = body.slice(colonIndex + 1).trim();
        }
      } else if (/^[#%](?:title|t|artist|a|comment|c|capo|key|tempo)[:\s]/i.test(trimmed)) {
        const match = trimmed.match(/^[#%]([a-z_]+)[:\s]\s*(.*)$/i);
        if (match) {
          directiveKey = match[1].toLowerCase();
          directiveValue = match[2].trim();
        }
      }

      if (directiveKey) {
        const key = directiveKey;
        const value = directiveValue;

        if (key === "title" || key === "t") {
          metadata.title = value;
          continue;
        }
        if (key === "artist" || key === "a") {
          metadata.artist = value;
          continue;
        }
        if (key === "start_of_chorus" || key === "soc") {
          const num = counts.ref;
          counts.ref++;
          resultLines.push(`- REF${num}`);
          continue;
        }
        if (key === "end_of_chorus" || key === "eoc") {
          resultLines.push("");
          continue;
        }
        if (key === "start_of_verse" || key === "sov") {
          const num = counts.verse;
          counts.verse++;
          resultLines.push(`- ${num}.`);
          continue;
        }
        if (key === "end_of_verse" || key === "eov") {
          resultLines.push("");
          continue;
        }
        if (key === "start_of_bridge" || key === "sob") {
          resultLines.push("- BRD");
          continue;
        }
        if (key === "end_of_bridge" || key === "eob") {
          resultLines.push("");
          continue;
        }
        if (key === "start_of_tab" || key === "sot") {
          resultLines.push("(Tab:)");
          continue;
        }
        if (key === "end_of_tab" || key === "eot") {
          resultLines.push("");
          continue;
        }
        if (key === "comment" || key === "c" || key === "comment_italic" || key === "ci" || key === "comment_bold" || key === "cb") {
          const lowerVal = value.toLowerCase();
          if (lowerVal.includes("chorus") || lowerVal.includes("refrén") || lowerVal.includes("ref") || lowerVal.includes("verse") || lowerVal.includes("sloka") || lowerVal.includes("bridge") || lowerVal.includes("intro") || lowerVal.includes("outro") || lowerVal.includes("solo")) {
            const heading = mapHeaderOnCounts(value, counts);
            if (heading) {
              resultLines.push(heading);
              continue;
            }
          }
          if (value) {
            resultLines.push(`(${value})`);
          }
          continue;
        }
        if (key === "capo") {
          resultLines.push(`(Capo: ${value})`);
          continue;
        }
        if (key === "key" || key === "k") {
          resultLines.push(`(Tónina: ${value})`);
          continue;
        }
        if (key === "tempo") {
          resultLines.push(`(Tempo: ${value})`);
          continue;
        }
        if (key === "time") {
          resultLines.push(`(Takt: ${value})`);
          continue;
        }
        if (key === "duration") {
          resultLines.push(`(Délka: ${value})`);
          continue;
        }
        if (key === "album") {
          resultLines.push(`(Album: ${value})`);
          continue;
        }
        if (key === "composer") {
          resultLines.push(`(Skladatel: ${value})`);
          continue;
        }
        if (key === "lyricist") {
          resultLines.push(`(Textař: ${value})`);
          continue;
        }
        if (key === "subtitle" || key === "st" || key === "sub") {
          resultLines.push(`(${value})`);
          continue;
        }
        if (key === "meta") {
          const eqIdx = value.indexOf("=");
          const spIdx = value.indexOf(" ");
          let metaKey = value;
          let metaVal = "";
          if (eqIdx !== -1) {
            metaKey = value.substring(0, eqIdx).trim();
            metaVal = value.substring(eqIdx + 1).trim();
          } else if (spIdx !== -1) {
            metaKey = value.substring(0, spIdx).trim();
            metaVal = value.substring(spIdx + 1).trim();
          }
          if (metaVal) {
            resultLines.push(`(${metaKey}: ${metaVal})`);
          } else {
            resultLines.push(`(${metaKey})`);
          }
          continue;
        }
        if (key === "chorus" || key === "col") {
          resultLines.push("(Refren)");
          continue;
        }

        if (value && !["textsize", "textfont", "chordsize", "chordfont", "columns"].includes(key)) {
          resultLines.push(`(${key}: ${value})`);
          continue;
        }
        continue;
      }

      // 2. Detect section headers e.g. [Chorus], 【Chorus】, <Verse 1>, Verse 1:, [Verse], Intro: or [Verse 2]
      const sectionMatch = trimmed.match(/^\[([^\]]+)\]$|^[［【〔〖「『❲⟦⦋]([^］】〕〗」』❳⟧⦌]+)[］】〕〗」』❳⟧⦌]$|^[<«‹⟨]([^>»›⟩]+)[>»›⟩]$|^([A-Za-z0-9\súSlokarefrén]+):$|^\-?\s*(Verse|Chorus|Ref|Refren|Bridge|Brd|Pre\-Chorus|Pre|Intro|Outro|Solo|Sloka)\s*([0-9]*)\.?$/i);
      if (sectionMatch) {
        const headerText = sectionMatch[1] || sectionMatch[2] || sectionMatch[3] || sectionMatch[4] || trimmed;
        if (!isChord(headerText)) {
          const heading = mapHeaderOnCounts(headerText, counts);
          if (heading) {
            resultLines.push(heading);
            continue;
          }
        }
      }

      // 3. For standard lines or lines with chords, replace all bracketed chords (and variants) with brace chords
      // Supports: [C], [[C]], ［C］, 【C】, 〔C〕, <C>, «C», (C) (chords only), /C/, |C|, %C%
      let converted = line;

      // Double brackets [[C]]
      converted = converted.replace(/\[\[([^\]]+)\]\]/g, (match, p1) => {
        if (isChord(p1)) {
          return `{${normalizeChordName(p1, options)}}`;
        }
        return match;
      });

      // Standard square brackets [C]
      converted = converted.replace(/\[([^\]]+)\]/g, (match, p1) => {
        if (isChord(p1)) {
          return `{${normalizeChordName(p1, options)}}`;
        }
        return match;
      });

      // Unicode / CJK brackets: ［C］, 【C】, 〔C〕, 〖C〗, 「C」, 『C』, ❲C❳, ⟦C⟧, ⦋C⦌
      converted = converted.replace(/[［【〔〖「『❲⟦⦋]([^］】〕〗」』❳⟧⦌]+)[］】〕〗」』❳⟧⦌]/g, (match, p1) => {
        if (isChord(p1)) {
          return `{${normalizeChordName(p1, options)}}`;
        }
        return match;
      });

      // Angle brackets / Guillemets: <C>, «C», ‹C›, ⟨C⟩
      converted = converted.replace(/[<«‹⟨]([^>»›⟩]+)[>»›⟩]/g, (match, p1) => {
        if (!["br", "p", "div", "span", "b", "i", "u", "hr", "h1", "h2", "h3"].includes(p1.toLowerCase()) && isChord(p1)) {
          return `{${normalizeChordName(p1, options)}}`;
        }
        return match;
      });

      // Parentheses: (C), (Am7) - only when containing valid chord and not general text
      converted = converted.replace(/\(([A-H][b#♭♯]?[^)]*)\)/g, (match, p1) => {
        const p1Lower = p1.trim().toLowerCase();
        if (!NON_CHORD_PARENS.has(p1Lower) && isChord(p1)) {
          return `{${normalizeChordName(p1, options)}}`;
        }
        return match;
      });

      // Inline marker chords: /C/, |C|, %C%, _C_, *C*
      converted = converted.replace(/(^|[\s,.:;])[\/\|\%_\*]([A-H][b#♭♯]?[^\/\|\%_\*\s]{0,12})[\/\|\%_\*](?=[\s,.:;]|$)/g, (match, prefix, p1) => {
        if (isChord(p1)) {
          return `${prefix}{${normalizeChordName(p1, options)}}`;
        }
        return match;
      });

      resultLines.push(converted.trim());
    }
  } else {
    // Process Ultimate-Guitar format with multi-line repeat block support
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        resultLines.push("");
        i++;
        continue;
      }

      // 1. Detect section headers e.g. [Chorus], Verse 1:, [Verse], Intro: or [Verse 2]
      const sectionMatch = trimmed.match(/^\[([^\]]+)\]$|^([A-Za-z0-9\súSlokarefrén]+):$|^\-?\s*(Verse|Chorus|Ref|Refren|Bridge|Brd|Pre\-Chorus|Pre|Intro|Outro|Solo|Sloka)\s*([0-9]*)\.?$/i);
      if (sectionMatch) {
        const headerText = sectionMatch[1] || sectionMatch[2] || trimmed;
        const heading = mapHeaderOnCounts(headerText, counts);
        if (heading) {
          resultLines.push(heading);
        }
        i++;
        continue;
      }

      // Detect section headers with trailing chords on the same line e.g. "Intro: Am6 Bm7 ..."
      const sectionColonMatch = trimmed.match(/^([A-Za-z0-9\súSlokarefrén\-]+?):\s*(.+)$/i);
      if (sectionColonMatch) {
        const headerCandidate = sectionColonMatch[1].trim();
        const remainder = sectionColonMatch[2].trim();
        const lowerHeader = headerCandidate.toLowerCase();
        if (!["title", "t", "song", "artist", "a", "interpret", "autor", "capo", "key", "tempo", "album"].includes(lowerHeader) && !isChord(headerCandidate)) {
          const heading = mapHeaderOnCounts(headerCandidate, counts);
          if (heading) {
            resultLines.push(heading);
            if (remainder) {
              lines.splice(i + 1, 0, remainder);
            }
            i++;
            continue;
          }
        }
      }

      // Collect a stanza (contiguous non-empty lines until blank line or section header)
      const stanzaLines: string[] = [];
      const startIdx = i;
      while (i < lines.length) {
        const currLine = lines[i];
        const currTrimmed = currLine.trim();
        if (!currTrimmed) break;
        const isHeader = /^\[([^\]]+)\]$|^([A-Za-z0-9\súSlokarefrén]+):$|^\-?\s*(Verse|Chorus|Ref|Refren|Bridge|Brd|Pre\-Chorus|Pre|Intro|Outro|Solo|Sloka)\s*([0-9]*)\.?$/i.test(currTrimmed) ||
                         /^([A-Za-z0-9\súSlokarefrén\-]+?):\s*(.+)$/i.test(currTrimmed);
        if (isHeader && i > startIdx) {
          break;
        }
        stanzaLines.push(currLine);
        i++;
      }

      // Check if stanza has a repeat indicator at the beginning or end
      let repeatTimes = 1;
      let hasRepeat = false;

      if (stanzaLines.length > 0) {
        const firstTrimmed = stanzaLines[0].trim();
        const lastTrimmed = stanzaLines[stanzaLines.length - 1].trim();

        const repeatIndicatorRegex = /^(?:\(|\[)?\s*(?:([0-9]+)\s*[xX]|[xX]\s*([0-9]+))\s*(?:\)|\])?$/i;

        const firstMatch = firstTrimmed.match(repeatIndicatorRegex);
        const lastMatch = lastTrimmed.match(repeatIndicatorRegex);

        if (lastMatch && stanzaLines.length > 1) {
          repeatTimes = parseInt(lastMatch[1] || lastMatch[2] || "2", 10);
          hasRepeat = true;
          stanzaLines.pop(); // remove repeat indicator line
        } else if (firstMatch && stanzaLines.length > 1) {
          repeatTimes = parseInt(firstMatch[1] || firstMatch[2] || "2", 10);
          hasRepeat = true;
          stanzaLines.shift(); // remove repeat indicator line
        } else if (stanzaLines.length === 1) {
          // Single line check for repeat suffix (e.g. "Am6 Bm7 X2")
          const matchRepeat = lastTrimmed.match(/\s*(?:\(|\[|\|:)?\s*(?:([0-9]+)\s*[xX]|[xX]\s*([0-9]+))\s*(?:\)|\]|:|:\|)?\s*$/i);
          if (matchRepeat) {
            repeatTimes = parseInt(matchRepeat[1] || matchRepeat[2] || "2", 10);
            const cleanLine = lastTrimmed.replace(matchRepeat[0], "").replace(/\|:/g, "").replace(/:\|/g, "").trim();
            stanzaLines[0] = cleanLine;
            hasRepeat = true;
          }
        }
      }

      // Format stanzaLines
      const formattedStanzaLines: string[] = [];
      for (let sIdx = 0; sIdx < stanzaLines.length; sIdx++) {
        const sLine = stanzaLines[sIdx];

        if (isChordLine(sLine)) {
          const nextSIdx = sIdx + 1;
          if (nextSIdx < stanzaLines.length && stanzaLines[nextSIdx].trim() && !isChordLine(stanzaLines[nextSIdx]) && !stanzaLines[nextSIdx].trim().startsWith("[")) {
            const chords = parseChordLine(sLine, options);
            const lyrics = stanzaLines[nextSIdx];
            const merged = mergeChordsAndLyrics(chords, lyrics);
            formattedStanzaLines.push(merged);
            sIdx++; // skip lyrics line
          } else {
            const parts = sLine.split(/(\s+)/);
            let formattedLine = "";
            for (const part of parts) {
              const trimmedPart = part.trim();
              if (trimmedPart) {
                if (isChord(trimmedPart)) {
                  formattedLine += `{${normalizeChordName(trimmedPart, options)}}`;
                } else {
                  formattedLine += trimmedPart;
                }
              } else {
                formattedLine += part;
              }
            }
            formattedStanzaLines.push(formattedLine);
          }
        } else {
          const convertedChords = sLine.replace(/\[([^\]]+)\]/g, (match, p1) => {
            if (isChord(p1)) {
              return `{${normalizeChordName(p1, options)}}`;
            }
            return match;
          });
          formattedStanzaLines.push(convertedChords.trim());
        }
      }

      // If hasRepeat, wrap formattedStanzaLines in |: and :|
      if (hasRepeat && formattedStanzaLines.length > 0) {
        if (formattedStanzaLines.length === 1) {
          const formatted = formattedStanzaLines[0].replace(/^\|\:\s*/, "").replace(/\s*\:\|.*$/, "").trim();
          if (repeatTimes <= 2) {
            formattedStanzaLines[0] = `|: ${formatted} :|`;
          } else {
            formattedStanzaLines[0] = `|: ${formatted} :| ${repeatTimes}x`;
          }
        } else {
          formattedStanzaLines[0] = `|: ${formattedStanzaLines[0].replace(/^\|\:\s*/, "")}`;
          const lastLineIdx = formattedStanzaLines.length - 1;
          const cleanLast = formattedStanzaLines[lastLineIdx].replace(/\s*\:\|.*$/, "").trim();
          if (repeatTimes <= 2) {
            formattedStanzaLines[lastLineIdx] = `${cleanLast} :|`;
          } else {
            formattedStanzaLines[lastLineIdx] = `${cleanLast} :| ${repeatTimes}x`;
          }
        }
      }

      resultLines.push(...formattedStanzaLines);
    }
  }

  const processedLines = autoDetectSectionHeaders(resultLines).map(line => {
    return collapseLyricSpaces(line);
  });
  let cleanResult = processedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return { result: cleanResult, metadata };
}

export interface TransposeOptions {
  notation: "czech" | "english";
  accidentals: "original" | "sharps" | "flats";
}

export function noteToIndex(note: string, notation: "czech" | "english" = "english"): number {
  const norm = note.trim();
  const upper = norm.toUpperCase();
  
  if (notation === "czech") {
    if (upper === "H") return 11;
    if (upper === "B") return 10; // Czech B is Bb (English Bb)
  } else {
    if (upper === "B") return 11;
  }
  
  if (upper === "C") return 0;
  if (upper === "C#" || upper === "DB" || upper === "C♯" || upper === "D♭") return 1;
  if (upper === "D") return 2;
  if (upper === "D#" || upper === "EB" || upper === "D♯" || upper === "E♭") return 3;
  if (upper === "E") return 4;
  if (upper === "F") return 5;
  if (upper === "F#" || upper === "GB" || upper === "F♯" || upper === "G♭") return 6;
  if (upper === "G") return 7;
  if (upper === "G#" || upper === "AB" || upper === "G♯" || upper === "A♭") return 8;
  if (upper === "A") return 9;
  if (upper === "A#" || upper === "BB" || upper === "A♯" || upper === "B♭") return 10;
  
  if (upper === "H") return 11; // Fallback
  
  return -1;
}

export function indexToNote(index: number, notation: "czech" | "english" = "english", accidentals: "original" | "sharps" | "flats" = "sharps"): string {
  const normalizedIndex = ((index % 12) + 12) % 12;
  const actualAccidental = accidentals === "original" ? "sharps" : accidentals;
  
  if (notation === "czech") {
    if (normalizedIndex === 11) return "H";
    if (normalizedIndex === 10) return actualAccidental === "sharps" ? "A#" : "B"; // Czech B is Bb (English Bb)
    
    if (actualAccidental === "sharps") {
      const sharps = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "H"];
      return sharps[normalizedIndex];
    } else {
      const flats = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "B", "H"];
      return flats[normalizedIndex];
    }
  } else {
    if (normalizedIndex === 11) return "B";
    
    if (actualAccidental === "sharps") {
      const sharps = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      return sharps[normalizedIndex];
    } else {
      const flats = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
      return flats[normalizedIndex];
    }
  }
}

export function getNoteAccidental(note: string): "sharps" | "flats" | "natural" {
  if (note.includes("#") || note.includes("♯")) return "sharps";
  // Check if note has 'b' or '♭' as an accidental (not as the note name 'B')
  if (note.includes("♭") || (note.length > 1 && note.slice(1).toLowerCase().includes("b"))) {
    return "flats";
  }
  return "natural";
}

export function transposeChord(chord: string, semitones: number, options: TransposeOptions = { notation: "english", accidentals: "sharps" }): string {
  // Extract root note (e.g. F#, Bb, C, H) + optional suffix (m7, maj9) + optional bass modifier (e.g. /C#)
  const chordRegex = /^([A-H](?:b|#|♭|♯)?)([^/]*)(?:\/([A-H](?:b|#|♭|♯)?))?$/i;
  const match = chord.match(chordRegex);
  if (!match) return chord;

  const root = match[1];
  const suffix = match[2];
  const bass = match[3];

  const rootAccType = getNoteAccidental(root);
  const bassAccType = bass ? getNoteAccidental(bass) : "natural";

  let rootAccidental: "sharps" | "flats" = "sharps";
  let bassAccidental: "sharps" | "flats" = "sharps";

  if (options.accidentals === "original") {
    if (rootAccType === "flats") {
      rootAccidental = "flats";
    } else if (rootAccType === "sharps") {
      rootAccidental = "sharps";
    } else {
      // Root is natural. If bass has an accidental, adopt bass accidental, else default to sharps
      rootAccidental = bassAccType === "flats" ? "flats" : "sharps";
    }

    if (bassAccType === "flats") {
      bassAccidental = "flats";
    } else if (bassAccType === "sharps") {
      bassAccidental = "sharps";
    } else {
      // Bass is natural. Adopt root accidental
      bassAccidental = rootAccType === "flats" ? "flats" : "sharps";
    }
  } else {
    rootAccidental = options.accidentals;
    bassAccidental = options.accidentals;
  }

  const rootIndex = noteToIndex(root, options.notation);
  if (rootIndex === -1) return chord;

  let newRoot = root;
  if (semitones !== 0 || options.accidentals !== "original") {
    const newRootIndex = (rootIndex + semitones + 12) % 12;
    newRoot = indexToNote(newRootIndex, options.notation, rootAccidental);
  } else {
    // semitones === 0 and keep original accidentals
    if (options.notation === "english" && root.toUpperCase() === "H") {
      newRoot = "B";
    }
  }

  let newBass = "";
  if (bass) {
    const bassIndex = noteToIndex(bass, options.notation);
    if (bassIndex !== -1) {
      if (semitones !== 0 || options.accidentals !== "original") {
        const newBassIndex = (bassIndex + semitones + 12) % 12;
        newBass = "/" + indexToNote(newBassIndex, options.notation, bassAccidental);
      } else {
        // semitones === 0 and keep original accidentals
        let b = bass;
        if (options.notation === "english" && bass.toUpperCase() === "H") {
          b = "B";
        }
        newBass = "/" + b;
      }
    } else {
      newBass = "/" + bass;
    }
  }

  return `${newRoot}${suffix}${newBass}`;
}

// Convert song text to transposed version
export function transposeSongContent(kytarioText: string, semitones: number, options: TransposeOptions = { notation: "english", accidentals: "sharps" }): string {
  // Replace chords in curly braces {...}
  return kytarioText.replace(/\{([^\}]+)\}/g, (match, chordContents) => {
    if (chordContents.toUpperCase() === "X") return match; // Keep pause
    
    // Split chord contents by spaces if they contain multiple chords or spacers
    if (chordContents.includes(" ")) {
      const parts = chordContents.split(/\s+/);
      const transposedParts = parts.map(p => {
        if (isChord(p)) return transposeChord(p, semitones, options);
        return p;
      });
      return `{${transposedParts.join(" ")}}`;
    }
    
    return `{${transposeChord(chordContents, semitones, options)}}`;
  });
}

/**
 * Converts a Kytario brace-formatted text to ChordPro (brackets) or Chords over Lyrics (ultimate.ftes.de style).
 */
export function convertTargetFormat(
  kytarioText: string,
  targetFormat: "kytario" | "chordpro" | "chords_over_lyrics",
  songTitle?: string,
  songArtist?: string
): string {
  if (targetFormat === "kytario") {
    return kytarioText;
  }

  const lines = kytarioText.split(/\r?\n/);
  const outputLines: string[] = [];

  if (targetFormat === "chordpro") {
    // 1. Add metadata at top if available
    let hasTitle = false;
    let hasArtist = false;
    if (songTitle && songTitle.trim()) {
      outputLines.push(`{title: ${songTitle.trim()}}`);
      hasTitle = true;
    }
    if (songArtist && songArtist.trim()) {
      outputLines.push(`{artist: ${songArtist.trim()}}`);
      hasArtist = true;
    }
    if (hasTitle || hasArtist) {
      outputLines.push("");
    }

    let inChorus = false;
    let inVerse = false;
    let inBridge = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        outputLines.push("");
        continue;
      }

      // Check if it's a section header starting with "- "
      if (trimmed.startsWith("- ")) {
        // Close previous environment
        if (inChorus) {
          outputLines.push("{end_of_chorus}");
          outputLines.push("");
          inChorus = false;
        }
        if (inVerse) {
          outputLines.push("{end_of_verse}");
          outputLines.push("");
          inVerse = false;
        }
        if (inBridge) {
          outputLines.push("{end_of_bridge}");
          outputLines.push("");
          inBridge = false;
        }

        const headerVal = trimmed.substring(2).trim();
        if (headerVal.toUpperCase().startsWith("REF")) {
          const num = headerVal.match(/[0-9]+/);
          outputLines.push(num ? `{start_of_chorus: Chorus ${num[0]}}` : "{start_of_chorus}");
          inChorus = true;
        } else if (/^[0-9]+\.$/.test(headerVal) || headerVal.toLowerCase().startsWith("slok") || headerVal.toLowerCase().startsWith("vers")) {
          const num = headerVal.match(/[0-9]+/);
          outputLines.push(num ? `{start_of_verse: Verse ${num[0]}}` : "{start_of_verse}");
          inVerse = true;
        } else if (headerVal.toUpperCase() === "BRD" || headerVal.toUpperCase() === "BRIDGE") {
          outputLines.push("{start_of_bridge}");
          outputLines.push(`{comment: Bridge}`);
          inBridge = true;
        } else {
          outputLines.push(`{comment: ${headerVal}}`);
        }
        continue;
      }

      // Convert curly braces to square brackets and normalize chord names
      const converted = line.replace(/\{([^\}]+)\}/g, (match, p1) => {
        const parts = p1.split(/\s+/);
        const normalized = parts.map(p => {
          if (isChord(p)) return normalizeChordName(p);
          return p;
        });
        return `[${normalized.join(" ")}]`;
      });
      outputLines.push(collapseLyricSpaces(converted));
    }

    // Close any outstanding environments
    if (inChorus) {
      outputLines.push("{end_of_chorus}");
    }
    if (inVerse) {
      outputLines.push("{end_of_verse}");
    }
    if (inBridge) {
      outputLines.push("{end_of_bridge}");
    }

    const isStartDirective = (lineStr: string): boolean => {
      const l = lineStr.trim().toLowerCase();
      if (l.startsWith("{start_of_")) return true;
      if (l.startsWith("{comment:") || l.startsWith("{c:")) return true;
      if (l.startsWith("{comment_italic:") || l.startsWith("{ci:")) return true;
      if (l.startsWith("{comment_bold:") || l.startsWith("{cb:")) return true;
      if (l === "{soc}" || l === "{sov}" || l === "{sob}" || l === "{sot}") return true;
      if (/^\{start_of_[a-z0-9_]+(\s*:\s*[^\}]+)?\}$/i.test(l)) return true;
      if (/^\{(soc|sov|sob|sot)(\s*:\s*[^\}]+)?\}$/i.test(l)) return true;
      return false;
    };

    const isEndDirective = (lineStr: string): boolean => {
      const l = lineStr.trim().toLowerCase();
      if (l.startsWith("{end_of_")) return true;
      if (l === "{eoc}" || l === "{eov}" || l === "{eob}" || l === "{eot}") return true;
      if (/^\{end_of_[a-z0-9_]+\}$/i.test(l)) return true;
      if (/^\{(eoc|eov|eob|eot)\}$/i.test(l)) return true;
      return false;
    };

    const finalOutputLines: string[] = [];
    for (let i = 0; i < outputLines.length; i++) {
      const current = outputLines[i];
      const trimmedCurrent = current.trim();

      if (trimmedCurrent === "") {
        // Look at previous pushed line
        const prev = finalOutputLines.length > 0 ? finalOutputLines[finalOutputLines.length - 1] : "";
        if (isStartDirective(prev)) {
          continue;
        }

        // Look ahead for next non-empty line
        let isBeforeEnd = false;
        for (let j = i + 1; j < outputLines.length; j++) {
          const nextTrimmed = outputLines[j].trim();
          if (nextTrimmed !== "") {
            if (isEndDirective(nextTrimmed)) {
              isBeforeEnd = true;
            }
            break;
          }
        }
        if (isBeforeEnd) {
          continue;
        }
      }

      finalOutputLines.push(current);
    }

    return finalOutputLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  if (targetFormat === "chords_over_lyrics") {
    // Convert Kytario to Chords Over Lyrics (separate lines)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        outputLines.push("");
        continue;
      }

      // Check for section header
      if (trimmed.startsWith("- ")) {
        const headerVal = trimmed.substring(2).trim();
        let mappedHeader = headerVal;
        if (headerVal.toUpperCase().startsWith("REF")) {
          const num = headerVal.match(/[0-9]+/);
          mappedHeader = num ? `Chorus ${num[0]}` : "Chorus";
        } else if (/^[0-9]+\.$/.test(headerVal)) {
          mappedHeader = `Verse ${headerVal.replace(/\./g, "")}`;
        } else if (headerVal.toUpperCase() === "BRD") {
          mappedHeader = "Bridge";
        } else if (headerVal.toUpperCase() === "PRE") {
          mappedHeader = "Pre-Chorus";
        } else if (headerVal.toUpperCase() === "INT") {
          mappedHeader = "Intro";
        } else if (headerVal.toUpperCase() === "OUT") {
          mappedHeader = "Outro";
        }
        outputLines.push(`[${mappedHeader}]`);
        continue;
      }

      // Check if line is a Kytario section link like [REF1], [1.], etc.
      if (trimmed.startsWith("[") && trimmed.endsWith("]") && !isChord(trimmed.slice(1, -1))) {
        outputLines.push(trimmed);
        continue;
      }

      // Check if line is purely chords, repeat marks, or bar lines (no lyrics)
      // E.g. "{C#m}     {C#m/E}", "|: {Am}   {F} :| 2x", "C#m     A"
      const strippedOfChords = trimmed
        .replace(/\{[^\}]+\}/g, "")
        .replace(/\[[^\]]+\]/g, "")
        .replace(/\|:|\:|\||\(|\)|\d+x|\d+X/g, "")
        .trim();

      if (strippedOfChords === "") {
        // Pure chord/repeat line: replace {chord} with chord and keep exact spacing
        const chordOnlyLine = line.replace(/\{([^\}]+)\}/g, (_, p1) => {
          const parts = p1.split(/\s+/);
          const converted = parts.map((p: string) => isChord(p) ? normalizeChordName(p) : p);
          return converted.join(" ");
        }).replace(/\[([^\]]+)\]/g, (_, p1) => {
          const parts = p1.split(/\s+/);
          const converted = parts.map((p: string) => isChord(p) ? normalizeChordName(p) : p);
          return converted.join(" ");
        });
        outputLines.push(chordOnlyLine.trimEnd());
        continue;
      }

      // Line with lyrics and inline chords
      let lyricLine = "";
      interface ChordMarker {
        chord: string;
        colIndex: number;
      }
      const chordsList: ChordMarker[] = [];
      let charIdx = 0;

      while (charIdx < line.length) {
        if (line[charIdx] === "{" || line[charIdx] === "[") {
          const closeChar = line[charIdx] === "{" ? "}" : "]";
          const closeIdx = line.indexOf(closeChar, charIdx);
          if (closeIdx !== -1) {
            const chordContent = line.substring(charIdx + 1, closeIdx).trim();
            if (isChord(chordContent)) {
              chordsList.push({ chord: normalizeChordName(chordContent), colIndex: lyricLine.length });
              charIdx = closeIdx + 1;
              continue;
            }
          }
        }
        lyricLine += line[charIdx];
        charIdx++;
      }

      // If we found chords, construct structural chord line
      if (chordsList.length > 0) {
        let chordLine = "";
        let currentPos = 0;
        for (const item of chordsList) {
          if (item.colIndex > currentPos) {
            chordLine += " ".repeat(item.colIndex - currentPos);
            currentPos = item.colIndex;
          } else if (item.colIndex <= currentPos) {
            // Avoid collision/merging by ensuring separating space if currentPos > 0
            if (currentPos > 0 && !chordLine.endsWith(" ")) {
              chordLine += " ";
              currentPos += 1;
            }
          }
          chordLine += item.chord;
          currentPos += item.chord.length;
        }

        outputLines.push(chordLine);
        if (lyricLine.trim().length > 0) {
          outputLines.push(lyricLine);
        }
      } else {
        outputLines.push(lyricLine);
      }
    }

    const isSectionHeader = (lineStr: string): boolean => {
      const l = lineStr.trim().toLowerCase();
      return l.startsWith("[") && l.endsWith("]") && !isChord(l.slice(1, -1));
    };

    const finalOutputLines: string[] = [];
    for (let i = 0; i < outputLines.length; i++) {
      const current = outputLines[i];
      const trimmedCurrent = current.trim();

      if (trimmedCurrent === "") {
        const prev = finalOutputLines.length > 0 ? finalOutputLines[finalOutputLines.length - 1] : "";
        if (isSectionHeader(prev)) {
          continue;
        }
      }
      finalOutputLines.push(current);
    }

    return finalOutputLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  return kytarioText;
}


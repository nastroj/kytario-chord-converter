# 🎸 Kytario Chord Converter

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0+-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0+-38bdf8.svg)](https://tailwindcss.com/)

> **Universal chord format converter, parser, and transposer for guitarists, musicians, and songbook editors.**  
> Seamlessly convert chords and lyrics between **Kytario.com**, **Ultimate-Guitar**, **ChordPro**, and **Chords-over-Lyrics** formats with real-time conversion, chromatic transposition, interactive section reordering, and chord notation preferences.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Supported Formats](#-supported-formats)
- [Kytario Syntax Specification](#-kytario-syntax-specification)
- [How to Use](#-how-to-use)
- [Developer & Installation Guide](#-developer--installation-guide)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Available Scripts](#available-scripts)
  - [Project Structure](#project-structure)
- [Architecture & Conversion Engine](#-architecture--conversion-engine)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Kytario Chord Converter** is a web-based utility designed to bridge the gap between different song notation standards. Whether you are migrating guitar tabs from Ultimate-Guitar, importing ChordPro lead sheets, or preparing songs for **[Kytario.com](https://kytario.com)**, this tool provides instant bi-directional conversion with high parsing accuracy.

The application runs entirely client-side for ultra-fast conversion, guaranteed privacy, and offline reliability, backed by a lightweight Express/Vite server configuration ready for containerized or static deployment.

---

## ✨ Key Features

### 🔄 Multi-Format Bi-Directional Conversion
- **Smart Format Auto-Detection**: Analyzes text patterns, brackets, section prefixes, and chord alignment heuristics to instantly identify the source format.
- **Auto-Formatting**: Automatically cleans up OCR artifacts, corrects misspellings, and normalizes capitalization of chords (e.g., auto-formats `[a]` or `{hmi}` into `[A]` or `{Hmi}`) dynamically when you paste or finish typing.
- **Bi-Directional Output**: Convert between:
  - **Kytario.com** (`{C}Lyrics`)
  - **Ultimate-Guitar** (Chord lines over lyrics lines)
  - **ChordPro** (`[C]Lyrics`)
  - **Chords-over-Lyrics** (Plain text formatted chord charts)

### 🎵 Intelligent Key Transposition
- Chromatic transposition from **-12 to +12 semitones** with a single click.
- Full support for complex chords, including:
  - **Slash chords / Alternate bass**: `G/B`, `D/F#`, `A/C#`, `C/E`
  - **Extensions & Alterations**: `Cmaj7#11`, `F#m7b5`, `Dsus4`, `Gadd9`, `A7sus2`
  - **Diminished & Augmented**: `Cdim7`, `G#aug`, `B°`
  - **Instrumental pauses & rests**: `{X}`, `{N.C.}`

### 🎼 Regional Notation & Customization
- **Central European vs. Anglo-American**: Switch between European (`H` / `B`) and Anglo (`B` / `Bb`) notation systems with automated conversion.
- **Minor Chord Styling**: Toggle between standard `m` (`Am`, `Em`, `F#m`) and Czech/Slovak `mi` (`Ami`, `Emi`, `F#mi`).
- **Accidental Preferences**: Choose preferred sharp (`#`) or flat (`b`) enharmonic spelling, or keep original accidentals.

### 📑 Interactive Section Mapper & Reordering
- Automatic recognition of song structure: Verses (`1.`, `2.`), Refrains/Choruses (`REF1`, `REF2`), Bridges (`BRD`), Intros (`INT`), Solos, and Outros.
- **Drag-and-Drop Reordering**: Rearrange strophes and choruses visually using `@dnd-kit`.
- Synchronized section navigation and structural indicators.

### 🔍 Find & Replace with Synchronized Visual Backdrop
- Live query search across both Input and Output editors.
- Match navigation (Next / Previous with `Enter` / `Shift+Enter`) with automatic viewport centering and cursor selection.
- Synchronized backdrop highlight overlays.
- Case-sensitive and Whole-word matching toggles.

### 💾 Local Drafts & History Management
- **Auto-Save**: Automatic draft snapshots in browser local storage.
- **Manual Snapshots**: Create named bookmarks of song states.
- **Undo / Redo**: Multi-level history stack with keyboard shortcut support (`Ctrl+Z` / `Ctrl+Y`).
- **Clean State Reset**: Clear drafts and reset input in one click without accidental re-saving.

### 📂 File Handling & Ergonomics
- Drag-and-drop or file upload for `.txt`, `.chopro`, `.crd`, `.pro`, and `.tab` files.
- 1-click clipboard copy and text file download.
- Full Dark Mode and Light Mode support with high contrast WCAG-compliant styling.
- Bilingual interface (Czech / English).

---

## 📄 Supported Formats

| Format | Chord Syntax | Section Syntax | Example |
| :--- | :--- | :--- | :--- |
| **Kytario** | Curly braces: `{C}` | `- 1.`, `- REF1`, `- BRD` | `- 1.`<br>`{C}Hello {G}world` |
| **Ultimate-Guitar** | Over-lyrics lines | `[Verse 1]`, `[Chorus]` | `[Verse 1]`<br>`C     G`<br>`Hello world` |
| **ChordPro** | Square brackets: `[C]` | `{comment: Verse 1}` | `{c: Verse 1}`<br>`[C]Hello [G]world` |
| **Chords-over-Lyrics** | Over-lyrics lines | `Verse 1:`, `Chorus:` | `Verse 1:`<br>`C     G`<br>`Hello world` |

---

## 📖 Kytario Syntax Specification

Kytario markup is optimized for web and mobile songbook rendering:

```text
- 1.
{C}Tak jsem tady {G}zas a koukám {Am}do prázdna, {F}
{C}svět se točí {G}dál a noc je {F}nádherná.

- REF1
|: {C}Zpívej se mnou {G}tuhle píseň, {Am}neměj žádný {F}strach, :| 2x
{C}dokud slunce {G}nevyjde na {F}horách.

[REF1]

- OUT
{C}Noc už {G}končí... {C}
```

### Syntax Rules

1. **Inline Chords**: Placed directly inside `{}` before the corresponding syllable (e.g., `{Am}word`).
2. **Verses**: Designated by a hyphen followed by the number and a dot (e.g., `- 1.`, `- 2.`).
3. **Refrain / Chorus**: Designated by `- REF` followed by a number or identifier (e.g., `- REF1`, `- REF2`).
4. **Other Song Parts**: Standard abbreviations prefixed with hyphen (e.g., `- BRD` for Bridge, `- INT` for Intro, `- OUT` for Outro, `- SOLO`).
5. **Section References / Links**: When a chorus or verse repeats without changing words, reference it with `[REF1]` or `[1.]`.
6. **Repetitions**: Enclose repeated phrases in `|:` and `:|` followed by repeat count (e.g., `|: {C}text :| 2x`).
7. **Pauses**: Use `{X}` or `{N.C.}` for instrumental breaks or no-chord singing.

---

## 🎯 How to Use

1. **Paste or Upload**: Paste your chord sheet into the **Input** panel or drop a `.txt` / `.chopro` file onto the upload zone.
2. **Select Target Format**: Choose your desired output format (**Kytario**, **Ultimate-Guitar**, **ChordPro**, or **Chords-over-Lyrics**).
3. **Transpose Key**: Use the `+` / `-` semitone stepper to transpose the song to your vocal or instrumental range.
4. **Adjust Notation**: Configure European (`H`) vs. Anglo (`B`) notation, `mi` vs. `m` minor chord suffix, and accidental preferences.
5. **Reorder Sections** *(Optional)*: Open the **Section Map** to visually reorder verses and choruses via drag-and-drop.
6. **Copy or Export**: Click **Copy** to copy the formatted text to your clipboard, or **Download** to save as a `.txt` file.

---

## 💻 Developer & Installation Guide

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** `>= 18.0.0`
- **npm** `>= 9.0.0` (or `pnpm` / `yarn`)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/kytario-chord-converter.git
   cd kytario-chord-converter
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite dev server with TypeScript execution via `tsx`. |
| `npm run build` | Builds the client SPA into `dist/` and bundles `server.ts` via `esbuild`. |
| `npm run start` | Runs the compiled production server (`node dist/server.cjs`). |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`). |

---

## 🏗️ Project Structure

```text
kytario-chord-converter/
├── index.html                   # HTML entry point
├── package.json                 # Dependencies and build scripts
├── server.ts                    # Express backend & Vite middleware
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite & Tailwind configuration
├── src/
│   ├── main.tsx                 # React DOM mount point
│   ├── App.tsx                  # Main converter application view
│   ├── index.css                # Global Tailwind CSS stylesheet
│   ├── components/
│   │   ├── DraftsModal.tsx      # Saved drafts & history modal
│   │   ├── FindReplaceBar.tsx   # Search & replace floating toolbar
│   │   ├── ReorderList.tsx      # Drag-and-drop strophe reordering list
│   │   ├── SectionMap.tsx       # Song structure visual overview
│   │   └── SortableItem.tsx     # Draggable strophe item component
│   └── utils/
│       ├── converter.ts         # Core parsing, format conversion & transposition
│       ├── searchHighlight.tsx  # Text highlight overlay & regex utilities
│       ├── sectionParser.ts     # Strophe boundary detection & section grouping
│       ├── useDrafts.ts         # Local storage draft manager hook
│       └── useHistory.ts        # Undo / Redo state management hook
└── README.md                    # Project documentation
```

---

## ⚙️ Architecture & Conversion Engine

The core conversion engine (`src/utils/converter.ts`) is designed around a clean tokenization and parsing pipeline:

1. **Normalization**: Standardizes newlines, removes non-printable characters, and detects encoding variations.
2. **Format Recognition**: Analyzes line-by-line token distributions (chord-to-lyric character ratios, bracket delimiters, section markers).
3. **AST / Intermediate Representation**: Converts chords into abstract musical representations (root pitch class, accidental, chord quality, alteration, bass inversion).
4. **Transposition Matrix**: Modulo-12 semitone shift with scale-aware accidental spelling (enharmonic preservation).
5. **Serialization**: Emits the target markup (Kytario braces, ChordPro square brackets, or spaced character-aligned over-lyrics lines).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Made for guitarists, musicians, and songbook creators.
</p>

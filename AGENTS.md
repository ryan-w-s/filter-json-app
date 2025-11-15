## Project Purpose

Build a small desktop app to filter properties from JSON data. Support:
- **Input**: paste from clipboard and open from file.
- **Output**: copy filtered JSON to clipboard and save to file.
- **Rules**: define, name, and persist reusable filter specifications.

## Architecture

- **Frontend (Svelte + TypeScript)**: UI for loading JSON, defining filters, previewing results, and managing saved rules.
- **Backend (Tauri + Rust)**: 
  - Clipboard read/write.
  - File read/write with safe paths.
  - Persistent storage for filter rules.

## Guiding Principles

- **Safety first**: never execute or eval user JSON; treat it as data only. Prefer immutable transforms and clear error messages.
- **Transparency**: always show source JSON, filters applied, and resulting JSON. Make it easy to undo or change filters.
- **Simplicity**: optimize for small, focused workflows, not a full JSON IDE.
- **Performance**: handle large-ish JSON files without freezing the UI.

## Working Rules for Agents

- **Single source of truth**: filter semantics live in shared, well-typed utilities (no duplicated logic between front and back).
- **Explicit contracts**: define clear Rust ↔ TypeScript interfaces for commands and data structures.
- **Errors**: always return structured error info from Rust; show concise, helpful messages in the UI.
- **Persistence**: treat rule storage as append-only + editable, never destructive without explicit confirmation.
- **Testing**: keep core filter logic covered by small, focused tests (Rust or TypeScript) before adding complex UI around it.



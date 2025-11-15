# filter-json-app

A Tauri + SvelteKit + TypeScript project to filter properties from JSON data.

## Project Purpose

A minimal desktop app to filter properties from JSON data. Support:
- **Input**: paste from clipboard or open from file.
- **Output**: copy filtered JSON to clipboard or save to file.
- **Rules**: define, name, and persist reusable filter specifications.
- **Multiplatform**: Windows, macOS, Linux.

## Development

CLI dependencies:
- bun (theoretically npm, yarn, or pnpm could work)
- cargo
    - rustc
    - rustup (recommended)

Install dependencies:

```
bun install
```

Run the app:

```
bun run tauri dev
```

Run linting + tests + rust tests:
```
bun run sanity
```

## Testing

Testing is done in-source, in the `src/` and `src-tauri/` directories.
Rust tests are run with `cargo test`, SvelteKit tests are run with `vitest run`, but this is handled by bun.
Rust keeps test in the same file as the code it tests, SvelteKit tests are colocated with the code they test, as .test.ts files.

- `src/`: SvelteKit tests (unit tests for frontend logic).
- `src-tauri/`: Rust tests (unit tests for backend logic).

Run tests:
```
bun run test
bun run test:rust
```

## Architecture

- `src/`: SvelteKit frontend (UI for loading JSON, defining filters, previewing results, managing rules).
- `src-tauri/`: Tauri + Rust backend (clipboard, file I/O, rule persistence, commands).
- `static/`: Static assets (icons, images).

## Tech Stack

- Tauri
- SvelteKit
- TypeScript
- Rust
- Bun
- TailwindCSS
- ESLint
- Vitest

## Guiding Principles

- **Safety first**: never execute or eval user JSON; treat it as data only. Prefer immutable transforms and clear error messages.
- **Transparency**: always show source JSON, filters applied, and resulting JSON. Make it easy to undo or change filters.
- **Simplicity**: optimize for small, focused workflows, not a full JSON IDE.
- **Performance**: handle large-ish JSON files without freezing the UI.


## Working Rules for Agents

- **Single source of truth**: filter semantics live in shared, well-typed utilities (no duplicated logic between front and back).
- **Explicit contracts**: define clear Rust ↔ TypeScript interfaces for commands and data structures.
- **Errors**: always return structured error info from Rust; show concise, helpful messages in the UI.
- **Testing**: keep core logic covered by small, focused tests (Rust or TypeScript) before adding complex UI around it. Keep core logic factored out from the bridge between front and back so that it can be tested in isolation.
- **bun run sanity**: run linting + tests + rust tests, should always be used after changes to ensure the code still works as expected.
- **directory**: terminals usually start in the project root, so use of `cd` is probably unnecessary, especially if all you are `cd`ing to is the project root.




# PlayJSON

A visual whiteboard for building and exploring linked JSON structures. Paste in JSON, arrange blocks on a canvas, and connect them to model relationships across your data.

## Getting Started

```bash
pnpm install
pnpm dev
```

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview the production build |
| `pnpm test` | Run the test suite |

## Features

### Canvas
- [x] Create JSON blocks by pasting any valid JSON (objects or arrays)
- [x] Support JSON with comments (JSONC format: `//` and `/* */`)
- [x] Drag, resize, and arrange blocks freely on the board
- [x] Link block attributes to other blocks to model `$ref`-style references
- [x] Auto-layout powered by a weighted blend of D3-hierarchy and ELK
- [x] Duplicate blocks with all connected subgraph (Ctrl+C / Ctrl+V)
- [x] Delete blocks and associated links

### Editing
- [x] Tree editor for structured, field-by-field updates
- [x] Raw JSON editor for direct text editing
- [x] Resolved JSON preview that follows links and expands references
- [x] Generate TypeScript types from JSON
- [x] Generate JSON Schema from JSON
- [x] Rename object keys
- [x] Add/delete object attributes
- [x] Add/delete array items
- [x] Edit primitive values (string, number, boolean, null)
- [x] Collapse/expand nested objects and arrays

### Linking
- [x] Create links by dragging from attribute rows
- [x] Move attributes between blocks via drag
- [x] Automatic cycle detection and prevention
- [x] Delete links with automatic cleanup
- [x] Rename linked attribute keys

### Search & Navigation
- [x] Search blocks by title, key, value, or JSONPath-like query
- [x] Tab through blocks in alphabetical order
- [x] Keyboard shortcuts for delete, duplicate, and navigation
- [x] Select blocks and links

### Persistence
- [x] Board state auto-saved to `localStorage`
- [x] Export board as JSON and re-import it later
- [x] Copy resolved JSON to clipboard

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **TanStack Router** — file-based routing
- **React Flow** (`@xyflow/react`) — canvas and node rendering
- **Zustand** — board state management
- **Zod** — import/export schema validation
- **D3-hierarchy / Dagre / ELK** — auto-layout algorithms
- **Tailwind CSS v4** + shadcn-style primitives




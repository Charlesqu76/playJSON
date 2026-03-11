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

**Canvas**
- Create JSON blocks by pasting any valid JSON (objects or arrays)
- Drag, resize, and arrange blocks freely on the board
- Link block attributes to other blocks to model `$ref`-style references
- Auto-layout powered by a weighted blend of D3-hierarchy, Dagre, and ELK

**Editing**
- Tree editor for structured, field-by-field updates
- Raw JSON editor for direct text editing
- Resolved JSON preview that follows links and expands references

**Search & Navigation**
- Search blocks by title, key, value, or JSONPath-like query
- Tab through blocks in alphabetical order
- Keyboard shortcuts for delete, duplicate, and navigation

**Persistence**
- Board state auto-saved to `localStorage`
- Export board as JSON and re-import it later

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **TanStack Router** — file-based routing
- **React Flow** (`@xyflow/react`) — canvas and node rendering
- **Zustand** — board state management
- **Zod** — import/export schema validation
- **D3-hierarchy / Dagre / ELK** — auto-layout algorithms
- **Tailwind CSS v4** + shadcn-style primitives

## Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/workspace` | Main editor |

## Project Structure

```
src/
  components/
    ui/                   # Button, Card, Input, Textarea, Separator
    BlockNode.tsx         # React Flow custom node
    BoardCanvas.tsx       # Canvas rendering and interactions
    LeftPanel.tsx         # Create / search / import / export
    MiddlePanel.tsx       # Canvas + layout controls
    RightPanel.tsx        # Block editor panel
    TreeEditor.tsx        # Hierarchical JSON editor
    JsonEditor.tsx        # Resolved + raw JSON preview
  state/
    board.tsx             # Zustand store and actions
    storage.ts            # localStorage + import/export
  utils/
    json.ts               # JSON edit operations
    json-blocks.ts        # Block-level JSON helpers
    layout-algorithms.ts  # D3 / Dagre / ELK layout
    search.ts             # Search and JSONPath matching
    block-utils.ts        # Height estimation, sorting
  hooks/
    useKeyboardShortcuts.ts
  types/
    model.ts              # JsonBlock, BlockLink, BoardState, Zod schemas
  routes/
    __root.tsx
    index.tsx
    workspace.tsx
```

## Data Model

```ts
interface JsonBlock {
  id: string;
  title: string;
  data: JsonValue;       // any JSON value
  createdAt: string;
  updatedAt: string;
}

interface BlockLink {
  id: string;
  sourceBlockId: string;
  targetBlockId: string;
  sourceAttrKey?: string; // which attribute on the source points to target
  label?: string;
}
```

Board state (blocks + positions + links) is validated against a versioned Zod schema on import (`version: 1`).

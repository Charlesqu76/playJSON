# PlayJSON

PlayJSON is a React + Vite app for building and exploring linked JSON structures on a visual whiteboard.

It includes:
- A landing page at `/`
- A routed workspace at `/workspace` (TanStack Router)
- React Flow whiteboard for JSON blocks
- Tree + JSON preview editors for selected blocks
- Search, import/export, and local persistence

## Tech Stack

- React 18
- TypeScript
- Vite
- TanStack Router
- React Flow (`@xyflow/react`)
- Zod (schema validation)
- shadcn-style UI primitives (`Button`, `Card`, `Input`, `Textarea`, `Separator`)

## Routes

- `/` - Home page
- `/workspace` - PlayJSON editor workspace

## Getting Started

### Install

```bash
pnpm install
```

### Run dev server

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Run tests

```bash
pnpm test
```

## Workspace Features

- Create object/array blocks from JSON input
- Select, move, and format blocks on the board
- Link attributes/array items to other blocks using `$ref` style references
- Edit selected block title and data
- Tree editor for nested updates
- Resolved JSON preview + raw JSON preview
- Search blocks by title, key, value, or JSONPath-like query
- Export/import board state as JSON
- Auto-save workspace state to `localStorage`

## Project Structure

```text
src/
  components/
    ui/                # shadcn-style primitives
    BlockNode.tsx      # custom React Flow node
    BoardCanvas.tsx    # board rendering and interactions
    LeftPanel.tsx      # create/search/import/export controls
    TreeEditor.tsx     # hierarchical JSON editor
    JsonEditor.tsx     # resolved/raw JSON previews
  state/
    board.tsx          # reducer and context state management
    storage.ts         # localStorage + import/export helpers
  utils/
    json.ts            # JSON helpers/edit ops
    search.ts          # search + JSONPath-like matching
  router.tsx           # TanStack Router route tree
  App.tsx              # Home + Workspace page components
  main.tsx             # RouterProvider app entry
```

## Data Model Notes

- Each block stores:
  - `id`, `title`, `data`, timestamps
- Links store:
  - `sourceBlockId`, `targetBlockId`, optional `sourceAttrKey`
- Imported/exported board data is validated with Zod schema (`version: 1`).

## Known Caveat

`pnpm build` may fail due to existing test typing issues in `src/test/search.test.ts` (readonly tuple vs mutable `JsonArray`), which are unrelated to workspace runtime behavior.

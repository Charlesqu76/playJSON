import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { BoardStoreActions } from "../state/board";
import type { BoardState } from "../types/model";
import { isEditableTarget } from "../utils/dom-utils";
import {
  addAttributeOnRootObject,
  resolveBlockValue,
} from "../utils/json-blocks";

interface UseKeyboardShortcutsParams {
  state: BoardState;
  selectedLinkId: string | null;
  copiedBlockRef: MutableRefObject<{ rootBlockId: string } | null>;
  actions: Pick<
    BoardStoreActions,
    "deleteBlock" | "deleteLink" | "duplicateSubgraph" | "selectBlock" | "setBlockData"
  >;
  setSelectedLinkId: (id: string | null) => void;
}

const getOrderedBlockIds = (state: BoardState, blockIds: string[]) => {
  return [...blockIds].sort((a, b) => {
    const titleCompare = state.blocks[a].title.localeCompare(
      state.blocks[b].title,
    );
    if (titleCompare !== 0) return titleCompare;
    return a.localeCompare(b);
  });
};

const handleTabShortcut = ({
  event,
  state,
  blockIds,
  actions,
  setSelectedLinkId,
}: {
  event: KeyboardEvent;
  state: BoardState;
  blockIds: string[];
  actions: Pick<BoardStoreActions, "selectBlock" | "setBlockData">;
  setSelectedLinkId: (id: string | null) => void;
}) => {
  if (event.key !== "Tab" || blockIds.length === 0) return false;

  event.preventDefault();

  if (state.selectedBlockId) {
    const selected = state.blocks[state.selectedBlockId];
    if (selected) {
      actions.setBlockData(selected.id, addAttributeOnRootObject(selected.data));
    }
    return true;
  }

  const ordered = getOrderedBlockIds(state, blockIds);
  const currentIndex = state.selectedBlockId
    ? ordered.indexOf(state.selectedBlockId)
    : -1;
  const nextIndex =
    currentIndex < 0
      ? 0
      : event.shiftKey
        ? (currentIndex - 1 + ordered.length) % ordered.length
        : (currentIndex + 1) % ordered.length;

  actions.selectBlock(ordered[nextIndex] ?? null);
  setSelectedLinkId(null);
  return true;
};

const handleDeleteShortcut = ({
  event,
  state,
  selectedLinkId,
  actions,
  setSelectedLinkId,
}: {
  event: KeyboardEvent;
  state: BoardState;
  selectedLinkId: string | null;
  actions: Pick<BoardStoreActions, "deleteBlock" | "deleteLink">;
  setSelectedLinkId: (id: string | null) => void;
}) => {
  if (event.key !== "Delete" && event.key !== "Backspace") return false;

  if (selectedLinkId) {
    actions.deleteLink(selectedLinkId);
    setSelectedLinkId(null);
    return true;
  }

  if (state.selectedBlockId) {
    actions.deleteBlock(state.selectedBlockId);
    return true;
  }

  return false;
};

const handleCopyShortcut = ({
  event,
  state,
  copiedBlockRef,
}: {
  event: KeyboardEvent;
  state: BoardState;
  copiedBlockRef: MutableRefObject<{ rootBlockId: string } | null>;
}) => {
  const isCopy =
    (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c";
  if (!isCopy || !state.selectedBlockId) return false;

  const block = state.blocks[state.selectedBlockId];
  if (!block) return false;

  copiedBlockRef.current = {
    rootBlockId: state.selectedBlockId,
  };
  event.preventDefault();

  const resolvedValue = resolveBlockValue(state, block.id);
  const clipboardText = JSON.stringify(resolvedValue ?? block.data, null, 2);

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(clipboardText).catch(() => {});
  }

  return true;
};

const handlePasteShortcut = ({
  event,
  copiedBlockRef,
  actions,
}: {
  event: KeyboardEvent;
  copiedBlockRef: MutableRefObject<{ rootBlockId: string } | null>;
  actions: Pick<BoardStoreActions, "duplicateSubgraph">;
}) => {
  const isPaste =
    (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "v";
  if (!isPaste || !copiedBlockRef.current) return false;

  event.preventDefault();
  actions.duplicateSubgraph({
      rootBlockId: copiedBlockRef.current.rootBlockId,
      offset: { x: 40, y: 40 },
  });

  return true;
};

/**
 * Hook for handling keyboard shortcuts in the workspace
 */
export const useKeyboardShortcuts = ({
  state,
  selectedLinkId,
  copiedBlockRef,
  actions,
  setSelectedLinkId,
}: UseKeyboardShortcutsParams) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const blockIds = Object.keys(state.blocks);

      if (
        handleTabShortcut({
          event,
          state,
          blockIds,
          actions,
          setSelectedLinkId,
        }) ||
        handleDeleteShortcut({
          event,
          state,
          selectedLinkId,
          actions,
          setSelectedLinkId,
        }) ||
        handleCopyShortcut({ event, state, copiedBlockRef }) ||
        handlePasteShortcut({ event, copiedBlockRef, actions })
      ) {
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    actions,
    selectedLinkId,
    state.blocks,
    state.positions,
    state.selectedBlockId,
    setSelectedLinkId,
  ]);
};

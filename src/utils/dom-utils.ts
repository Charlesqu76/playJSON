/**
 * Download a file with the given content
 */
export const downloadFile = (name: string, content: string): void => {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

/**
 * Check if an element is editable (input, textarea, or contentEditable)
 */
export const isEditableTarget = (target: EventTarget | null): boolean => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable
  );
};

/**
 * Calculate the next block position in a grid layout
 */
export const nextBlockPosition = (blockCount: number) => ({
  x: 80 + (blockCount % 5) * 220,
  y: 80 + Math.floor(blockCount / 5) * 140,
});

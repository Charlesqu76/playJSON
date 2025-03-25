import { TObjectBox } from "../basic2/ObjectBox";

const HORIZONTAL_SPACING = 50;
const VERTICAL_SPACING = 30;

export const layoutTree = (root: TObjectBox) => {
  const { x, y } = root.boundary;
  const initialX = x;
  const initialY = y;
  // Group nodes by levels
  const levels: TObjectBox[][] = [];

  const groupByLevels = (node: TObjectBox | null, level: number) => {
    if (node === null) return;
    if (!levels[level]) levels[level] = [];
    levels[level].push(node);

    Array.from(node.children)
      .filter(({ child, showChild }) => child && showChild)
      .forEach(({ child }) => groupByLevels(child, level + 1));
  };

  // Calculate max width for each level
  const levelWidths: number[] = [];
  const calculateWidths = () => {
    levels.forEach((nodes, level) => {
      levelWidths[level] = Math.max(
        ...nodes.map((node) => node.boundary.width)
      );
    });
  };

  // Calculate x coordinate for a level
  const getXCoordinate = (level: number): number => {
    let x = initialX;
    for (let i = 0; i < level; i++) {
      x += levelWidths[i] + HORIZONTAL_SPACING;
    }
    return x;
  };

  // Layout nodes level by level
  const layoutLevels = () => {
    // Find the level with maximum total height first
    const levelHeights = levels.map((nodes) => {
      return (
        nodes.reduce((sum, node) => sum + node.boundary.height, 0) +
        (nodes.length - 1) * VERTICAL_SPACING
      );
    });

    const maxHeight = Math.max(...levelHeights);

    levels.forEach((nodes, level) => {
      const x = getXCoordinate(level);
      const levelHeight = levelHeights[level];

      // Start from top with offset to center this level
      let y = initialY + (maxHeight - levelHeight) / 2;

      nodes.forEach((node) => {
        node.move(x, y);
        y += node.boundary.height + VERTICAL_SPACING;

        // Array.from(node.children)
        //   .filter(({ showChild }) => showChild)
        //   .forEach(({ updateLine }) => updateLine());
      });
    });
  };

  groupByLevels(root, 0);
  calculateWidths();
  layoutLevels();
};

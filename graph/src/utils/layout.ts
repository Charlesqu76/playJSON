import { TObjectBox } from "@/component/ObjectBox";

const HORIZONTAL_SPACING = 50;
const VERTICAL_SPACING = 20;

export const layoutTree = (root: TObjectBox, x: number = 0, y: number = 0) => {
  const initialX = x || root.x;
  const initialY = y || root.y;
  const levels: TObjectBox[][] = [];

  const groupByLevels = (node: TObjectBox | null, level: number) => {
    if (node === null) return;
    if (!levels[level]) levels[level] = [];
    levels[level].push(node);

    Array.from(node.children)
      .filter(({ child, showChild }) => child && showChild)
      .forEach(({ child }) => groupByLevels(child, level + 1));
  };

  const levelWidths: number[] = [];
  const calculateWidths = () => {
    levels.forEach((nodes, level) => {
      levelWidths[level] = Math.max(...nodes.map((node) => node.width));
    });
  };

  const getXCoordinate = (level: number): number => {
    let x = initialX;
    for (let i = 0; i < level; i++) {
      x += levelWidths[i] + HORIZONTAL_SPACING;
    }
    return x;
  };

  const layoutLevels = () => {
    // const levelHeights = levels.map((nodes) => {
    //   return (
    //     nodes.reduce((sum, node) => sum + node.height, 0) +
    //     (nodes.length - 1) * VERTICAL_SPACING
    //   );
    // });

    // const maxHeight = Math.max(...levelHeights);

    levels.forEach((nodes, level) => {
      const x = getXCoordinate(level);
      // const levelHeight = levelHeights[level];
      // let y = initialY + (maxHeight - levelHeight) / 2;
      let y = initialY;

      nodes.forEach((node) => {
        node.x = x;
        node.y = y;
        y += node.height + VERTICAL_SPACING;
      });
    });
  };

  groupByLevels(root, 0);
  calculateWidths();
  layoutLevels();
};

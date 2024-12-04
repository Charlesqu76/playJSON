import ObjectBox from "./ObjectBox";

export const dfs = (node: ObjectBox) => {
  const { children } = node;
  if (children.length === 0) {
    return;
  }
  const height = node.boundary.height;
  let intialY: number = 0;
  const accHeight = children.reduce((acc, { child, showChild }) => {
    if (child && showChild) {
      child.move(node.boundary.width + node.boundary.x + 100, acc + intialY);
      dfs(child);
      if (!intialY) {
        intialY = child.boundary.y;
      }
      acc += child.boundary.height;
    }
    return acc;
  }, 0);

  if (!intialY) {
    return;
  }

  //   console.log(accHeight);

  node.move(node.boundary.x, (accHeight - height) / 2 + intialY);
};

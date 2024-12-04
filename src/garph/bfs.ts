import ObjectBox from "./ObjectBox";

export const bfs = (node: ObjectBox) => {
  const queue = [node];
  let maxWidth = queue[0].boundary.width;
  let temp = 0;

  while (queue.length) {
    const len = queue.length;
    let accY = queue[0].boundary.y;

    for (let i = 0; i < len; i++) {
      const current = queue.shift();
      if (!current) continue;
      current.children.forEach(({ child, showChild, updateLine }) => {
        if (child && showChild) {
          child.move(current.boundary.x + maxWidth + 30, accY);
          accY += child.boundary.height + 30;
          temp = Math.max(temp, child.boundary.width);
          queue.push(child);
        }
        updateLine();
      });
    }
    maxWidth = temp;
    temp = 0;
  }
};

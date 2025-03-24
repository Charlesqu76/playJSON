interface IBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function isOverlapping(box1: IBox, box2: IBox) {
  const boundary = box1;
  const boundary2 = box2;
  return !(
    boundary.x + boundary.width < boundary2.x ||
    boundary2.x + boundary2.width < boundary.x ||
    boundary.y + boundary.height < boundary2.y ||
    boundary2.y + boundary2.height < boundary.y
  );
}

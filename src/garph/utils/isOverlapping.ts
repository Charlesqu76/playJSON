import { Box } from "@/garph/basic/box";

export default function isOverlapping(box1: Box, box2: Box) {
  const { boundary } = box1;
  const { boundary: boundary2 } = box2;
  return !(
    boundary.x + boundary.width < boundary2.x ||
    boundary2.x + boundary2.width < boundary.x ||
    boundary.y + boundary.height < boundary2.y ||
    boundary2.y + boundary2.height < boundary.y
  );
}

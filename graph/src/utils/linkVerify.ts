import { TKeyvalueBox } from "@/component/keyValueBox";
import { TObjectBox } from "@/component/ObjectBox";

export default function checkCircle(
  keyValueBox: TKeyvalueBox,
  ObjectBox: TObjectBox
) {
  let noCircle = true;
  const check = (keyValueBox: TKeyvalueBox, ObjectBox: TObjectBox) => {
    if (!noCircle) return;
    if (keyValueBox.parent === ObjectBox) {
      alert("cannot link");
      noCircle = false;
      return;
    }

    ObjectBox.children.forEach((child) => {
      if (child.child) {
        check(keyValueBox, child.child);
      }
    });
  };

  check(keyValueBox, ObjectBox);
  return noCircle;
}

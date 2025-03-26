import { TKeyvalueBox } from "../basic2/KeyValueBox";
import { TObjectBox } from "../basic2/ObjectBox";

export default function linkVerify(
  keyValueBox: TKeyvalueBox,
  ObjectBox: TObjectBox
) {
  if (ObjectBox.parent) {
    alert("already linked");
    return false;
  }
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

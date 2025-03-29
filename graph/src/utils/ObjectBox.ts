import { TObjectBox } from "@/basic2/ObjectBox";

export function value(item: TObjectBox) {
  if (item.isArray) {
    const m = [] as any;
    item.children.forEach((child) => {
      m.push(child.value);
    });
    return m;
  }
  const m = {};
  item.children.forEach((child) => {
    Object.assign(m, child.entry);
  });
  return m;
}

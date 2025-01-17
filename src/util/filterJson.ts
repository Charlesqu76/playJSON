import { FlattenedItem } from "./flatJsonList";

export function filterJson(jsonList: FlattenedItem[], searchText: string) {
  return jsonList.reduce((acc, cur) => {
    const { key, value } = cur;
    if (value?.toString().includes(searchText)) {
      acc.push({
        type: "value",
        match: value.toString(),
        ...cur,
      });
    }

    if (key.includes(searchText)) {
      acc.push({
        type: "key",
        match: key,
        ...cur,
      });
    }
    return acc;
  }, [] as (FlattenedItem & { match: string; type: "key" | "value" })[]);
}

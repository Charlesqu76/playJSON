interface FlattenedItem {
  path: string;
  value: string | number | boolean | null | undefined;
}

export default function flattenJSONToList(
  obj: any,
  prefix: string = ""
): FlattenedItem[] {
  const result: FlattenedItem[] = [];

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      // Handle arrays by using index as part of the key
      value.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          const arrayFlattened = flattenJSONToList(item, `${newKey}[${index}]`);
          result.push(...arrayFlattened);
        } else {
          result.push({
            path: `${newKey}[${index}]`,
            value: item,
          });
        }
      });
    } else if (typeof value === "object" && value !== null) {
      // Recursively flatten nested objects
      const nested = flattenJSONToList(value, newKey);
      result.push(...nested);
    } else {
      // Handle primitive values
      result.push({
        path: newKey,
        value: value,
      });
    }
  }

  return result;
}

// Example usage
const data = {
  name: "charles charles charles charles charles",
  age: 18,
  hobbies: [{ name: "bed" }, { name: "basketball", level: 3 }],
  address: {
    city: "shanghai",
    street: "nanjing road",
  },
};

const flattened = flattenJSONToList(data);
console.log(flattened);

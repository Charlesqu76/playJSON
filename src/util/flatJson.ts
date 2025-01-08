type Primitive = string | number | boolean | null | undefined;

export default function flattenJSON(
  obj: any,
  prefix: string = ""
): Record<string, Primitive> {
  const result: Record<string, Primitive> = {};

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      // Handle arrays by using index as part of the key
      value.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          const arrayFlattened = flattenJSON(item, `${newKey}[${index}]`);
          Object.assign(result, arrayFlattened);
        } else {
          result[`${newKey}[${index}]`] = item;
        }
      });
    } else if (typeof value === "object" && value !== null) {
      // Recursively flatten nested objects
      const nested = flattenJSON(value, newKey);
      Object.assign(result, nested);
    } else {
      // Handle primitive values
      result[newKey] = value;
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

const flattened = flattenJSON(data);
console.log(flattened);

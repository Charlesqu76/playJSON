export default function convertStringValue(
  value: string
): number | boolean | string | null {
  if (!isNaN(Number(value))) {
    return Number(value);
  }

  const lowerValue = value.toLowerCase();
  if (lowerValue === "true") return true;
  if (lowerValue === "false") return false;
  if (lowerValue === "null") return null;

  return value;
}

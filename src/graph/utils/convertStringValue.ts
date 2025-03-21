export default function convertStringValue(
  value: string
): number | boolean | string {
  if (!isNaN(Number(value))) {
    return Number(value);
  }

  const lowerValue = value.toLowerCase();
  if (lowerValue === "true") return true;
  if (lowerValue === "false") return false;

  return value;
}

export function p(text: string) {
  const output = window.prompt("Enter text:");
  return output || text;
}

export function input({
  text,
  left,
  top,
  width,
  height,
  maxWidth,
  color,
  container,
  onChange,
}: {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  maxWidth: number;
  color: string;
  container: HTMLElement;
  onChange: ({
    value,
    width,
    height,
  }: {
    value: string;
    width: number;
    height: number;
  }) => void;
}) {
  
}

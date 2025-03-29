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
  onChange: (e: HTMLTextAreaElement) => void;
}) {
  const input = document.createElement("textarea");
  input.value = text;
  input.style.position = "absolute";
  input.style.left = `${left}px`;
  input.style.top = `${top}px`;
  input.style.resize = "none";
  input.style.zIndex = "9999";
  input.style.color = color || "black";
  input.style.width = `${width}px`;
  input.style.maxWidth = `${maxWidth}px`;
  input.style.border = "none";
  input.style.padding = "0";
  input.style.margin = "0";
  input.style.scrollbarWidth = "none";
  input.style.outline = "none";
  input.style.backgroundColor = "rgba(255, 255, 255, 1)";
  input.style.boxShadow = "0 0 0 0";
  input.style.overflow = "hidden";
  input.style.height = `${height}px`;
  input.style.fontSize = "16px";
  input.style.lineHeight = "1.25";
  (input.style.fontFamily = "Arial, Helvetica, sans-serif"),
    container.appendChild(input);
  input.focus();

  input.addEventListener("input", (e) => {
    onChange(input);
    // input.style.width = this.bbox().width + "px";
    // input.style.height = `${(e.target as HTMLTextAreaElement).scrollHeight}px`;
  });

  const removeInput = () => {
    container?.removeChild(input);
  };

  input.addEventListener("blur", () => {
    removeInput();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      removeInput();
      e.preventDefault();
    } else if (e.key === "Escape") {
      removeInput();
    }
  });
}

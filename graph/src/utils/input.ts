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
  const div = document.createElement("div");
  div.contentEditable = "plaintext-only";
  div.style.position = "absolute";
  div.style.left = `${left}px`;
  div.style.top = `${top}px`;
  div.style.resize = "none";
  div.style.zIndex = "9999";
  div.style.maxWidth = `${maxWidth}px`;
  div.style.lineHeight = "1";
  div.style.color = color;
  div.style.outline = "none";
  div.style.wordBreak = "break-word";

  div.focus();

  const input = document.createElement("span");
  div.appendChild(input);
  input.innerHTML = text;

  input.style.color = color || "black";
  input.style.scrollbarWidth = "none";
  input.style.outline = "none";
  input.style.backgroundColor = "rgba(255, 255, 255, 1)";
  input.style.boxShadow = "0 0 0 0";
  input.style.overflow = "hidden";
  input.style.fontSize = "16px";
  input.style.wordBreak = "break-word";

  input.style.lineHeight = "1";
  (input.style.fontFamily = "Arial, Helvetica, sans-serif"),
    container.appendChild(div);
  input.focus();

  const removeInput = () => {
    const { width, height } = input.getBoundingClientRect();
    onChange({
      width,
      height,
      value: input.textContent as string,
    });

    Array.from(container.childNodes).includes(div) &&
      container?.removeChild(div);
  };

  document.addEventListener("click", (e) => {
    if (e.target !== div && e.target !== input) {
      removeInput();
    }
    e.stopPropagation();
  });
  div.addEventListener("input", (e) => {
    console.log(input.textContent);
    onChange({
      value: input.textContent as string,
      width,
      height,
    });
    e.stopPropagation();
  });

  div.addEventListener("blur", () => {
    removeInput();
  });

  div.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      removeInput();
      e.preventDefault();
    } else if (e.key === "Escape") {
      removeInput();
    }
  });
}

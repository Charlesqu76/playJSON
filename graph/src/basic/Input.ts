export type TInput = Input;
const MAX_WIDTH = 300;
export default class Input {
  div: HTMLDivElement;
  span: HTMLSpanElement;
  onChange?: (text: string, width: number, height: number) => void;
  onBlur?: () => void;
  constructor() {
    const div = document.createElement("div");
    this.div = div;
    div.contentEditable = "plaintext-only";
    div.style.position = "absolute";
    div.style.left = `${0}px`;
    div.style.top = `${0}px`;
    div.style.resize = "none";
    div.style.zIndex = "9999";
    div.style.lineHeight = "normal";
    div.style.outline = "none";
    div.style.pointerEvents = "none";
    div.style.margin = "0";
    div.style.padding = "0";
    div.style.cursor = "text";
    div.style.transformOrigin = "0 0";
    div.style.textOverflow = "clip";
    div.style.whiteSpace = "break-spaces";
    div.style.overflowWrap = "break-word";
    div.style.fontFamily = "Arial, Helvetica, sans-serif";
    div.style.visibility = "hidden";
    div.style.backgroundColor = "rgba(255, 255, 255, 1)";
    div.style.fontSize = "16px";
    div.style.maxWidth = `${MAX_WIDTH}px`;

    const input = document.createElement("span");
    this.span = input;
    div.appendChild(input);

    this.div.addEventListener("input", () =>
      this.onChange?.(this.text, this.width, this.height)
    );

    document.addEventListener("click", (e) => {
      if (e.target !== div) {
        this.div.blur();
      }
    });

    div.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.div.blur();
      }
    });

    div.addEventListener("blur", () => {
      this.hide();
    });
  }

  render(container: HTMLElement) {
    container.appendChild(this.div);
  }

  testWidthAndHeight(text: string) {
    this.span.innerText = text;
    return {
      width: this.width,
      height: this.height,
    };
  }

  show({
    text,
    color,
    onChange,
    onBlur,
  }: {
    text: string;
    color: string;
    onChange: (text: string, width: number, height: number) => void;
    onBlur: () => void;
  }) {
    this.div.style.visibility = "visible";
    this.div.style.color = color;
    this.span.innerText = text;
    this.div.focus();
    this.onChange = onChange;
    this.onBlur = onBlur;
  }

  hide() {
    this.div.style.visibility = "hidden";
    this.onBlur?.();
    this.onChange = undefined;
    this.onBlur = undefined;
  }

  get width() {
    return this.div.scrollWidth;
  }

  get height() {
    return this.div.scrollHeight;
  }

  get text() {
    return this.div.innerText;
  }
}

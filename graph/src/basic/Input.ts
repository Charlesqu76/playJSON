export type TInput = Input;
const MAX_WIDTH = 300;
export default class Input {
  div: HTMLDivElement;
  span: HTMLSpanElement;
  onChange?: () => void;
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
    div.style.maxWidth = `${MAX_WIDTH}px`;

    const input = document.createElement("span");
    this.span = input;
    input.style.fontSize = "16px";
    input.style.fontFamily = "Arial, Helvetica, sans-serif";
    div.appendChild(input);

    document.addEventListener("click", (e) => {
      this.div.blur();
    });

    div.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.div.blur();
      }
    });

    div.addEventListener("blur", () => {
      console.log("blur");
      this.hide();
    });
  }

  init() {
    // const removeInput = () => {
    //   const { width, height } = input.getBoundingClientRect();
    //     onChange({
    //       width,
    //       height,
    //       value: input.textContent as string,
    //     });
    //     Array.from(container.childNodes).includes(div) &&
    //       container?.removeChild(div);
    // };
    // div.addEventListener("input", (e) => {
    //   console.log(input.textContent);
    //   onChange({
    //     value: input.textContent as string,
    //     width,
    //     height,
    //   });
    //   e.stopPropagation();
    // });
    // div.addEventListener("blur", () => {
    //   removeInput();
    // });
  }

  render(container: HTMLElement) {
    container.appendChild(this.div);
  }

  get width() {
    return this.div.offsetWidth;
  }

  get height() {
    return this.div.offsetHeight;
  }

  get text() {
    return this.div.innerText;
  }

  testWidthAndHeight(text: string) {
    this.span.innerText = text;
    return {
      width: this.width,
      height: this.height,
    };
  }

  show({
    x,
    y,
    text,
    color,
    onChange,
  }: {
    x: number;
    y: number;
    text: string;
    color: string;
    onChange: (text: string, width: number, height: number) => void;
  }) {
    this.div.style.visibility = "visible";
    this.div.style.left = `${x}px`;
    this.div.style.top = `${y}px`;
    this.div.style.color = color;
    this.span.innerText = text;
    this.div.focus();
    this.onChange = () => {
      onChange(this.text, this.width, this.height);
    };
    this.div.addEventListener("input", this.onChange);
  }

  hide() {
    this.div.style.visibility = "hidden";
    if (this.onChange) {
      this.div.removeEventListener("input", this.onChange);
    }
  }
}

import EditText from "../basic2/TextEditor";

const size = "16px";
interface Props {
  text: string;
  maxWidth?: number;
  style?: {
    color: string;
  };
}

export default class TestText {
  width: number;
  height: number;
  constructor({ text }: Props) {
    const ss = document.createElement("span");
    ss.appendChild(document.createTextNode(text));
    ss.style.fontSize = size;
    ss.style.display = "inline-block";
    ss.style.lineHeight = "1";
    ss.style.fontFamily = "Arial, Helvetica, sans-serif";
    ss.style.visibility = "hidden";
    ss.style.maxWidth = "400px";
    ss.style.wordBreak = "break-word";

    document.body.appendChild(ss);
    this.width = ss.offsetWidth;
    this.height = ss.offsetHeight;
    document.body.removeChild(ss);
  }

  get boundary() {
    return {
      width: this.width,
      height: this.height,
    };
  }
}

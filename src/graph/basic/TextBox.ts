import EditText from "./TextEditor";
import Graph from "..";
import convertStringValue from "../utils/convertStringValue";
import GroupRect from "./GroupRect";

const PADDING_X = 2;
const PADDING_Y = 2;

export const textPosition = (x: number, y: number) => {
  return {
    x: x + PADDING_X,
    y: y + PADDING_Y,
  };
};

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  style?: {
    color: string;
  };
}

const size = "16px";

const defaultStyle = {
  "font-size": size,
  "line-height": "1",
  "font-family": "Arial, Helvetica, sans-serif",
};

export type TTextBox = TextBox;

export default class TextBox extends GroupRect {
  text: EditText;
  constructor({ x, y, text, style, width, height }: Props, graph: Graph) {
    if (!graph.canvas) throw new Error("canvas not found");
    super(
      {
        x,
        y,
        width: width + PADDING_X * 2,
        height: height + PADDING_Y * 2,
        style: {
          stroke: "none",
        },
      },
      graph
    );

    this.group.draggable(false);

    this.text = new EditText({}).attr({
      ...defaultStyle,
      fill: style?.color || "black",
    });

    this.group.add(this.text);
    this.text.updateText(text);
    this.text.move(x + PADDING_X, y + PADDING_Y);
  }

  get boundary() {
    const { width, height, x, y } = this.text.boundary;
    return {
      width: width + PADDING_X * 2,
      height: height + PADDING_Y * 2,
      x,
      y,
    };
  }

  get value() {
    const value = this.text.text();
    return convertStringValue(value);
  }

  updateText(newText: string | number) {
    this.text.updateText(newText);
    this.container.setWidth(this.boundary.width);
    this.container.setHeight(this.boundary.height);
  }

  move(x: number, y: number) {
    this.container.move(x, y);
    const position = textPosition(x, y);
    this.text.move(position.x, position.y);
  }

  show() {
    this.text.show();
    this.container.show();
  }

  hide() {
    this.text.hide();
    this.container.hide();
  }

  front() {
    this.group.front();
    this.container.front();
    this.text.front();
  }
  back() {
    this.group.back();
    this.container.back();
    this.text.back();
  }

  delete() {
    this.group.remove();
  }
}

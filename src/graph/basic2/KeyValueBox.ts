import ObjectBox from "./ObjectBox";
import Graph from "..";
import {
  EVENT_CREATE,
  EVENT_LINK,
  EVENT_MOUSEOUT,
  EVENT_MOUSEOVER,
  EVENT_MOVE,
  EVENT_SELECT,
  EVENT_UNLINK,
} from "@/graph/event";
import isOverlapping from "@/graph/utils/isOverlapping";
import LinkLine from "../LinkLine";
import KeyEditor from "./KeyEditor";
import ValueEdit from "./ValueEditor";
import { highlightRect, unHighlightRect } from "../utils/rect";
import Box from ".";

const PADDING_Y = 5;
const PADDING_X = 10;

const BG_COLOR = "#fff";

interface Props {
  x?: number;
  y?: number;
  key: string;
  value: string | Object;
  isArray: boolean;
}

/**
 *
 * exact one parent - ObjectBox
 * exact one child -  ObjectBox
 *
 */

function calculateHeight(valueBox: ValueEdit) {
  return valueBox.height + PADDING_Y * 2;
}

function calculateWidth(
  keyBox: KeyEditor,
  valueBox: ValueEdit,
  isArray: boolean
) {
  const width = isArray ? valueBox.width : keyBox.width + valueBox.width;
  return width + PADDING_X * 2;
}

export default class KeyValueBox extends Box {
  defaultStyles = {
    fill: BG_COLOR,
    stroke: "black",
    "stroke-width": 1,
    rx: 5,
    ry: 5,
  };
  keyBox: KeyEditor;
  valueBox: ValueEdit;

  public origin: { x: number; y: number } | null = null;
  realWidth = 0;

  child: ObjectBox | null = null;
  showChild: boolean = true;

  line: LinkLine | null = null;

  constructor({ key, value, isArray }: Props, graph: Graph) {
    const keyBox = new KeyEditor(key, 0, 0, graph);
    const valueBox = new ValueEdit(value, 0, 0, graph);
    const height = calculateHeight(valueBox);
    const width = calculateWidth(keyBox, valueBox, isArray);
    super({ width, height, graph });
    this.keyBox = keyBox;
    this.valueBox = valueBox;
    this.keyBox = new KeyEditor(key, 0, 0, graph);
    this.valueBox = new ValueEdit(value, 0, 0, graph);
    if (this.valueBox.valueType !== "string") {
      this.child = new ObjectBox(
        {
          x: 0,
          y: 0,
          value,
        },
        graph
      );
    }
  }

  render() {
    this.keyBox.render(this.x, this.y);
    this.valueBox.render(this.x, this.y);
  }

  renderChild() {
    if (!this.child) return;
    this.child.render(this.x, this.y);
  }
}

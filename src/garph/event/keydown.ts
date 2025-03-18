import { EVENT_DELETE } from "../event";
import Graph from "../graph";
import KeyValueBox from "../keyvalueBox";
import ObjectBox from "../ObjectBox";
import { layoutTree } from "../utils/layout";

export default function keydown(e: KeyboardEvent, graph: Graph) {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === "c") {
      handleCopy(graph);
    }
    if (e.key === "v") {
      handlePaste(graph);
    }
    if (e.key === "k") {
      graph.layout();
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      graph.emit(EVENT_DELETE, { item: graph.selectedItem });
    }
  }

  if (e.key === "Tab") {
    e.preventDefault();
    addChildren(graph);
  }
}

function handleCopy(graph: Graph) {
  if (graph.selectedItem instanceof ObjectBox) {
    const jsonStr = JSON.stringify(graph.selectedItem.value);
    navigator.clipboard.writeText(jsonStr).catch((err) => {
      console.error("Failed to copy:", err);
    });
  }
}

async function handlePaste(graph: Graph) {
  if (graph.canvas === null) return;
  try {
    const svgPoint = (graph.canvas.node as SVGSVGElement).createSVGPoint();
    svgPoint.x = graph.mouseX;
    svgPoint.y = graph.mouseY;
    const cursor = svgPoint.matrixTransform(
      (graph.canvas.node as SVGSVGElement).getScreenCTM()?.inverse()
    );
    const text = await navigator.clipboard.readText();
    const value = JSON.parse(text);
    const newNode = new ObjectBox(
      {
        x: cursor.x,
        y: cursor.y,
        value: value,
      },
      graph
    );
    layoutTree(newNode);
  } catch (err) {
    console.error("Failed to paste:", err);
  }
}

function addChildren(graph: Graph) {
  if (!(graph.selectedItem instanceof ObjectBox) || !graph.canvas) return;
  let key = "key";
  let value = "value";
  if (graph.selectedItem.isArray) {
    key = graph.selectedItem.value.length;
  }
  const keyvaluebox = new KeyValueBox(
    {
      x: 0,
      y: 0,
      key,
      value,
    },
    graph,
    graph.selectedItem
  );
  graph.selectedItem.addChildren(keyvaluebox);
}

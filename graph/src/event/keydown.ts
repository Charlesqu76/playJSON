import { EVENT_DELETE } from "@/event";
import Graph from "..";
import { layoutTree } from "@/utils/layout";
import KeyValueBox from "@/basic2/keyValueBox";
import ObjectBox from "@/basic2/ObjectBox";

export default function keydown(e: KeyboardEvent, graph: Graph) {
  if (e.key === "Tab") {
    e.preventDefault();
    addKayValueBox(graph);
  }

  if (e.ctrlKey || e.metaKey) {
    if (e.key === "c") {
      handleCopy(graph);
    }
    if (e.key === "v") {
      handlePaste(graph);
    }
    if (e.key === "l") {
      e.preventDefault();

      if (graph.selectedItem instanceof ObjectBox) {
        graph.selectedItem.layout();
        return;
      }
      graph.layout();
    }

    // if (e.key === "r") {
    //   showJson(graph);
    //   e.preventDefault();
    // }
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();

      graph.emit(EVENT_DELETE, { item: graph.selectedItem });
    }
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
    layoutTree(newNode, cursor.x, cursor.y);
    newNode.render();
  } catch (err) {
    console.error("Failed to paste:", err);
  }
}

function addKayValueBox(graph: Graph) {
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
      isArray: graph.selectedItem.isArray,
    },
    graph
  );
  graph.selectedItem.addChildren(keyvaluebox);
}

function showJson(graph: Graph) {
  if (graph.selectedItem instanceof ObjectBox) {
    console.log(JSON.stringify(graph.selectedItem.value, null, 2));
  } else {
  }
}

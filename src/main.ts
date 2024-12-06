import { data } from "./data";
import Graph from "./garph/graph";

const main = () => {
  const graph = new Graph();

  graph.initCanvas("#app");
  graph.initData(data);
  graph.layout();
  document.querySelector("#zoom")!.textContent = graph.getZoom().toFixed(2);

  graph.setZoomCallback((zoom) => {
    document.querySelector("#zoom")!.textContent = zoom.toFixed(2);
  });

  if (graph.canvas === null) return;

  document.querySelector("#button")?.addEventListener("click", () => {
    // console.log(graph.objectBoxes.forEach((box) => console.log(box.value)));
    // graph.findMatchingObjects("char");
  });

  document.querySelector("#layout")?.addEventListener("click", () => {
    console.log(graph.layout());
  });
};

main();

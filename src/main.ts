import data from "../data.json";
import Graph from "./graph/index";

const main = () => {
  const graph = new Graph({});
  graph.initCanvas("#app");
  graph.initData([data]);
  graph.layout();
};

main();

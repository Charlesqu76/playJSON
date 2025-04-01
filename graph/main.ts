import Graph from "./src";
import data from "./data.json";

const main = () => {
  const graph = new Graph({});
  graph.initCanvas("#app");
  graph.initData([data]);
  graph.layout();
};

main();

import { data, data1 } from "./data";
import Graph from "./garph/graph";

const main = () => {
  const graph = new Graph();

  graph.initCanvas("#graph");
  graph.initData([data]);
  graph.layout();
};

main();

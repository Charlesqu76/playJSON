import data from "../data.json";
import Graph from "./garph/graph";

const main = () => {
  const graph = new Graph();

  graph.initCanvas("#graph");
  graph.initData([data]);
  graph.layout();
};

main();

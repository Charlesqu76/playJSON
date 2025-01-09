import { data, data1 } from "./data";
import Graph from "./garph/graph";
import KeyValueBox from "./garph/KeyValueBox";

const main = () => {
  const graph = new Graph();

  graph.initCanvas("#graph");
  graph.initData([data]);
  graph.layout();
};

main();

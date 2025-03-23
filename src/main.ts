import data from "../data.json";
import Graph from "./graph/index";

const main = () => {
  const graph = new Graph({});
  graph.initCanvas("#app");
  graph.initData([data]);
  graph.layout();

  // const a = new KeyEditor("asdfasdf", 0, 0, graph);
  // a.render(20, 20);
};

main();

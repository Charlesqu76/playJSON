import data from "../data.json";
import Graph from "./graph/index";

const main = () => {
  const graph = new Graph({});
  graph.initCanvas("#app");
  graph.initData([data]);
  graph.layout();
  setTimeout(() => {
    graph.keyValueBoxes.forEach((keyValueBox) => {
      console.log(keyValueBox.keyChain);
    });
  }, 100);
};

main();

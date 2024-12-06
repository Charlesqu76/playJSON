import React, { useEffect } from "react";
import Graph from "./garph/graph";
import { data, data1 } from "./data";
import JsonViewer from "./showJson";
const App = () => {
  const graph = React.useRef(new Graph());
  const [json, setJson] = React.useState([]);
  useEffect(() => {
    graph.current.initCanvas("#gggggggg");
    graph.current.initData(data1);
    graph.current.layout();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <h2 className="h-16 bg-red-400 w-full">Graph</h2>
      <div>
        <button
          className="border"
          onClick={() => {
            const boxes = graph.current.getAllIsolateBox();
            setJson(boxes.map((v) => v.value));
          }}
        >
          get data
        </button>
        <button
          className="border"
          onClick={() => {
            const boxes = graph.current.findMatchingObjects("enhance");
          }}
        >
          asdfasasdfasdf sdf
        </button>
      </div>

      <div className="flex flex-1">
        <div className="flex-1 min-w-80 w-80">
          {json.map((v, i) => (
            <JsonViewer data={v} key={i} />
          ))}
        </div>
        <div id="gggggggg" className=" flex flex-grow border w-full"></div>
      </div>
    </div>
  );
};

export default App;

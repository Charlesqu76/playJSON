import React, { useEffect } from "react";
import Graph, { graph1 } from "./garph/graph";
import { data, data1 } from "./data";
import JsonViewer from "./showJson";
import { Button } from "./components/ui/button";
import SearchInput from "./components/searchInput";
const App = () => {
  const [json, setJson] = React.useState([] as any);

  useEffect(() => {
    graph1.initCanvas("#graph");
    graph1.initData(data);
    graph1.layout();
    const values = graph1.getAllIsolateObjectBox().map((item) => item.value);
    setJson(values);
    document.querySelector("#zoom")!.textContent = graph1.getZoom().toFixed(2);
    graph1.setZoomCallback((zoom) => {
      document.querySelector("#zoom")!.textContent = zoom.toFixed(2);
    });
    graph1.setUpdateCallback(() => {
      const values = graph1.getAllIsolateObjectBox().map((item) => item.value);
      setJson(values);
    });
  }, []);

  return (
    <>
      <header className="p-2">
        <h2 className="text-2xl font-bold">Play JSON</h2>
      </header>
      <div>
        <div className="w-32">
          {/* <SearchInput></SearchInput> */}
        </div>
      </div>
      <main className="grid grid-cols-2 grid-rows-1 w-full h-full gap-2">
        {/* <div className="col-span-1 row-span-1 overflow-scroll px-2">
          <div className="space-y-4">
            {json.length &&
              json.map((v, k) => (
                <div className="border">
                  <JsonViewer data={v} key={k} />
                </div>
              ))}
          </div>
        </div> */}

        <div className="col-span-2 row-span-1 w-full border relative flex-3">
          <div id="graph" className="h-full"></div>
          <span id="zoom" className="absolute top-1 left-1"></span>
        </div>
      </main>
    </>
  );
};

export default App;

import React, { useEffect } from "react";
import { graph1 } from "./garph/graph";
import { Input, Select, Card, Button } from "antd";
import data from "../data1.json";
import JsonViewer from "./json";
const App = () => {
  const [json, setJson] = React.useState([] as any);

  useEffect(() => {
    // graph1.initCanvas("#graph");
    // graph1.initData(data);
    // graph1.layout();
    // const values = graph1.getAllIsolateObjectBox().map((item) => item.value);
    // setJson(values);
    // document.querySelector("#zoom")!.textContent = graph1.getZoom().toFixed(2);
    // graph1.setZoomCallback((zoom) => {
    //   document.querySelector("#zoom")!.textContent = zoom.toFixed(2);
    // });
    // graph1.setUpdateCallback(() => {
    //   const values = graph1.getAllIsolateObjectBox().map((item) => item.value);
    //   setJson(values);
    // });
  }, []);

  return (
    <>
      <header className="p-2">
        <h2 className="text-2xl font-bold">Play JSON</h2>
      </header>
      <div className="flex mb-2">
        <div className="max-w-60 min-w-32">
          <Input
            placeholder="search in JSON"
            onChange={(e) => graph1.findMatchingObjects(e.target.value)}
          />
        </div>
      </div>
      <main className="grid grid-cols-2 grid-rows-1 w-full h-full gap-2">
        <div className="col-span-2 row-span-1 overflow-scroll px-2">
          <div className="space-y-4">
            <JsonViewer jsondata={JSON.stringify(data)} />

            {/* {json.length &&
              json.map((v: any, k: number) => (
                <div className="border">
                  <JsonViewer jsondata={JSON.stringify(v)} key={k} />
                </div>
              ))} */}
          </div>
        </div>

        <div className="col-span-1 row-span-1 w-full border relative flex-3">
          <div id="graph" className="h-full"></div>
          <span id="zoom" className="absolute top-1 left-1"></span>
          <Button
            className=" absolute top-1 left-20"
            size="small"
            onClick={() => {
              graph1.layout();
            }}
          >
            Layout
          </Button>
        </div>
      </main>
    </>
  );
};

export default App;

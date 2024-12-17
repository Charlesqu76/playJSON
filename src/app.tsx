import React, { useEffect } from "react";
import { graph1 } from "./garph/graph";
import { Input, Button } from "antd";
import data from "../data1.json";
import JsonViewer from "./components/json";
import Header from "./components/Header";
import Graph from "./components/Graph";
import Left from "./components/Left";

const App = () => {
  return (
    <>
      <Header />
      <main className="grid grid-cols-2 grid-rows-1 gap-2 px-4">
        <Left />
        <Graph />
      </main>
      {/* <div className="flex mb-2">
        <div className="max-w-60 min-w-32">
          <Input
            placeholder="search in JSON"
            onChange={(e) => graph1.findMatchingObjects(e.target.value)}
          />
        </div>
      </div> */}
      {/* <main className="grid grid-cols-2 grid-rows-1 w-full h-full gap-2">
        <div className="col-span-1 row-span-1 overflow-scroll px-2">
          <div className="space-y-4">
            {json.length &&
              json.map((v: any, k: number) => (
                <div className="border">
                  <JsonViewer jsondata={JSON.stringify(v)} key={k} />
                </div>
              ))}
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
      </main> */}
    </>
  );
};

export default App;

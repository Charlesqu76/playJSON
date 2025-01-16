import React, { useEffect } from "react";
import { Input, Button } from "antd";
import JsonViewer from "./components/json";
import Header from "./components/Header";
import Graph from "./components/Graph";
import Left from "./components/Left";

const App = () => {
  return (
    <>
      <Header />
      <main className="flex-1 overflow-hidden flex space-x-2 px-2">
        <Left />
        {/* <Graph /> */}
      </main>
    </>
  );
};

export default App;

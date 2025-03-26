import React from "react";
import Header from "./components/Header";
import Graph from "./components/Graph";
import Left from "./components/Left";
import { useStore } from "./store";

const App = () => {
  const isFull = useStore((state) => state.isFull);

  return (
    <>
      <Header />
      <main className="flex-1 overflow-hidden flex space-x-2 p-2">
        {!isFull && <Left />}
        <Graph />
      </main>
    </>
  );
};

export default App;

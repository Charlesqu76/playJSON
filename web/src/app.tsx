import React from "react";
import Graph from "./components/Graph";
import Header from "./components/Header";
import "./styles/index.css";

const App = () => {
  return (
    <>
      {/* <Header /> */}
      <main className="flex-1 relative h-full p-2 border-2 rounded-md shadow-md">
        <Header />
        <Graph />
      </main>
    </>
  );
};

export default App;

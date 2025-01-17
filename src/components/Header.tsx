import React from "react";
import { useStore } from "@/store";
import { Button } from "./ui/button";
import Zoom from "./Zoom";
import JsonSearch from "./JsonSearch";
export default function Header() {
  const graph = useStore((store) => store.graph);

  return (
    <header className="h-10 flex items-center px-2 justify-between">
      <h2 className="text-xl font-bold">Play JSON</h2>
      <div className="flex items-center space-x-4">
        <JsonSearch />
        <Zoom />
        <Button
          size="sm"
          className="h-8"
          onClick={() => {
            graph.layout();
          }}
        >
          Layout
        </Button>
      </div>
    </header>
  );
}

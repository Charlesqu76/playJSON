import React, { useState } from "react";
import InputSearch from "./InputSearch";
import { useStore } from "@/store";
import { Button } from "./ui/button";
import Zoom from "./Zoom";
import flattenJSONToList from "@/util/flatJsonList";
export default function Header() {
  const jsons = useStore((store) => store.jsons);
  const graph = useStore((store) => store.graph);
  const [options, setOptions] = useState([]);
  const s = flattenJSONToList(jsons[0]);
  console.log;
  return (
    <header className="h-16 flex items-center px-2 justify-between">
      <h2 className="text-xl font-bold">Play JSON</h2>
      <div className="flex items-center space-x-4">
        <InputSearch
          options={s.map(({ path, value }) => `${path}: ${value}`)}
          onChange={(text) => {
            console.log(text);
          }}
        />
        <Zoom />
        <Button
          size="sm"
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

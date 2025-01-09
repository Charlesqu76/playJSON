import React, { useState } from "react";
import InputSearch from "./InputSearch";
import { useStore } from "@/store";
import { Button } from "./ui/button";
import Zoom from "./Zoom";
import flattenJSONToList from "@/util/flatJsonList";
export default function Header() {
  const jsons = useStore((store) => store.jsons);
  const graph = useStore((store) => store.graph);
  const searchText = useStore((store) => store.searchText);
  const setSearchText = useStore((store) => store.setSearchText);
  const s = flattenJSONToList(jsons[0]);
  return (
    <header className="h-16 flex items-center px-2 justify-between">
      <h2 className="text-xl font-bold">Play JSON</h2>
      <div className="flex items-center space-x-4">
        <InputSearch
          value={searchText}
          options={s
            .map(({ path, value }) => `${path}: ${value}`)
            .filter((v) => v.includes(searchText))}
          onChange={setSearchText}
          OptionComponent={({ data }) => (
            <div
              className="line-clamp-1"
              onClick={() => {
                
                console.log(data);
              }}
            >
              {data}
            </div>
          )}
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

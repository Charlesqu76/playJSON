import React, { useState } from "react";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import clsx from "clsx";
import { useStore } from "@/store";

export default function InputSearch<T>() {
  const setSearchText = useStore((state) => state.setSearchText);
  const searchText = useStore((state) => state.searchText);
  const graph = useStore((state) => state.graph);
  const [keyMap, setKeyMap] = useState<Record<string, any>>({});
  const [show, setShow] = useState(false);
  return (
    <div className="relative h-8">
      <Input
        placeholder="Search Keyword"
        className={clsx("h-full max-w-80", show && "w-80")}
        value={searchText}
        onFocus={() => {
          const m = {} as any;
          graph?.keyValueBoxes.forEach((v) => {
            m[v.keyChain.join(" ") as string] = v;
          });
          setKeyMap(m);
          setShow(true);
        }}
        onBlur={() => {
          setTimeout(() => {
            setShow(false);
          }, 50);
        }}
        onChange={(e) => setSearchText?.(e.target.value)}
      />
      <ScrollArea
        className={clsx(
          "absolute top-2 h-40 hidden z-10 max-w-80 bg-white p-1 shadow rounded",
          show && "block"
        )}
      >
        <div className=" space-y-2   [&>*:hover]:bg-gray-100">
          {Object.entries(keyMap).map(([key, value]) => {
            if (key.includes(searchText)) {
              return (
                <div
                  key={key}
                  className="flex items-center space-x-2 cursor-pointer p-2"
                  onClick={() => {
                    graph.centerViewOn(value);
                  }}
                >
                  <span>{key}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

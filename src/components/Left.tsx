import { useStore } from "@/store";
import React from "react";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";

export default function Left() {
  const { jsons } = useStore((state) => state);
  return (
    <div className="flex-1 space-y-4 overflow-y-scroll">
      {jsons.map((json, i) => (
        <JsonView src={json} key={i} className="p-2 bg-slate-100" />
      ))}
    </div>
  );
}

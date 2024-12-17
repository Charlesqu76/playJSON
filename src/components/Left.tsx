import { useStore } from "@/store";
import React from "react";
import MonacoJsonEditor from "./json";

export default function Left() {
  const { jsons } = useStore((state) => state);
  return (
    <div className="  space-y-4 overflow-y-scroll">
      {jsons.map((json, i) => (
        <div key={i} className="bg-slate-100">
          <MonacoJsonEditor jsondata={JSON.stringify(json)} />
        </div>
      ))}
    </div>
  );
}

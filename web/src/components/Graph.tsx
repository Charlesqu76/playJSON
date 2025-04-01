import { useStore } from "@/store";
import React, { useEffect } from "react";
import data from "@/data.json";
export default function Graph() {
  const ref = React.useRef<HTMLDivElement>(null);
  const { graph } = useStore((state) => state);
  useEffect(() => {
    if (ref.current) {
      graph.initCanvas(ref.current);
      const json = localStorage.getItem("json");
      if (json) {
        graph.recover(JSON.parse(json));
      } else {
        graph.initData(data);
      }
      document.addEventListener("keydown", (e) => {
        if (e.metaKey && e.key === "s") {
          e.preventDefault();
          const a = graph.getInfo();
          const json = JSON.stringify(a);
          localStorage.setItem("json", json);
        }
      });
    }
  }, []);

  return (
    <div className="flex-1 relative h-full">
      <div ref={ref} className="h-full"></div>
    </div>
  );
}

import { useStore } from "@/store";
import React, { useEffect } from "react";
export default function Graph() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const { jsons, graph } = useStore((state) => state);
  useEffect(() => {
    if (ref.current) {
      graph.initCanvas(ref.current);
      graph.initData(jsons);
      graph.layout();
    }
  }, []);

  return (
    <div
      className="flex-1 relative h-full p-2 border-2 rounded-md shadow-md"
      ref={containerRef}
    >
      <div ref={ref} className="h-full"></div>
      {/* <div
        className="absolute top-4 right-4"
        onClick={() => {
          setFull(!isFull);
        }}
      >
        {isFull ? <Shrink /> : <Expand />}
      </div> */}
    </div>
  );
}

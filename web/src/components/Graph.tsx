import { useStore } from "@/store";
import React, { useEffect } from "react";
export default function Graph() {
  const ref = React.useRef<HTMLDivElement>(null);
  const initGraph = useStore((state) => state.initGraph);
  useEffect(() => {
    if (ref.current) {
      initGraph(ref.current);
    }
  }, []);

  return (
    <div className="flex-1 relative h-full">
      <div ref={ref} className="h-full"></div>
    </div>
  );
}

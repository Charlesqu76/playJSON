import { useStore } from "@/store";
import React, { useEffect } from "react";
export default function Graph() {
  const ref = React.useRef<HTMLDivElement>(null);
  const { graph } = useStore((state) => state);
  useEffect(() => {
    if (ref.current) {
      graph.initCanvas(ref.current);
    }
  }, []);

  return (
    <div className="flex-1 relative h-full">
      <div ref={ref} className="h-full"></div>
    </div>
  );
}

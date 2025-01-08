import { data } from "@/data";
import { useStore } from "@/store";
import React, { useEffect } from "react";
export default function Graph() {
  const ref = React.useRef(null);
  const { jsons, setJsons, graph, setZoom } = useStore((state) => state);
  useEffect(() => {
    if (ref.current) {
      graph.initCanvas(ref.current);
      graph.initData(jsons);
      graph.layout();
      setZoom(graph.getZoom());
      graph.setZoomCallback((zoom) => {
        setZoom(zoom);
      });
      graph.setUpdateCallback(() => {
        setJsons(graph.getValues());
      });
    }
  }, []);

  return (
    <div className="flex-1 relative h-full bg-slate-200">
      <div ref={ref} className="h-full"></div>
    </div>
  );
}

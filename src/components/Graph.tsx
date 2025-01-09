import { useStore } from "@/store";
import { Expand, Shrink } from "lucide-react";
import React, { useEffect } from "react";
export default function Graph() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const { jsons, setJsons, graph, setZoom } = useStore((state) => state);
  useEffect(() => {
    if (ref.current) {
      graph.initCanvas(ref.current);
      graph.initData(jsons);
      graph.layout();
      setZoom(graph.zoom);
      graph.setZoomCallback((zoom) => {
        setZoom(zoom);
      });
      graph.setUpdateCallback(() => {
        setJsons(graph.values);
      });
    }
  }, []);

  return (
    <div className="flex-1 relative h-full bg-slate-200" ref={containerRef}>
      <div ref={ref} className="h-full"></div>
      <div
        className="absolute top-4 right-4"
        onClick={() => {
          if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
          } else if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }}
      >
        {document.fullscreenElement ? <Shrink></Shrink> : <Expand></Expand>}
      </div>
    </div>
  );
}

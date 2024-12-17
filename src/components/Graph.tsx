import { data } from "@/data";
import { graph1 } from "@/garph/graph";
import { useStore } from "@/store";
import React, { useEffect } from "react";
export default function Graph() {
  const ref = React.useRef(null);
  const { jsons, setJsons } = useStore((state) => state);
  useEffect(() => {
    if (ref.current) {
      graph1.initCanvas(ref.current);
      graph1.initData(jsons);
      graph1.layout();
      document.querySelector("#zoom")!.textContent = graph1
        .getZoom()
        .toFixed(2);
      graph1.setZoomCallback((zoom) => {
        document.querySelector("#zoom")!.textContent = zoom.toFixed(2);
      });
      graph1.setUpdateCallback(() => {
        const values = graph1.getAllIsolateObjectBox().map((item) => item.value);
        setJsons(values);
      });
    }
  }, []);

  return (
    <div className=" relative h-full bg-slate-200">
      <div ref={ref} className="h-full"></div>
      <span id="zoom" className="absolute top-1 left-1"></span>
    </div>
  );
}

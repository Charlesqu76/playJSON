import { useStore } from "@/store";
import React, { useEffect } from "react";
import { useParams } from "react-router";
export default function Graph() {
  const { id } = useParams();
  const ref = React.useRef<HTMLDivElement>(null);
  const loadGraph = useStore((state) => state.loadGraph);
  const initGraph = useStore((state) => state.initGraph);
  useEffect(() => {
    if (ref.current) {
      initGraph(ref.current);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    loadGraph(id);
  }, [id]);

  return (
    <div className="flex-1 relative h-full">
      <div ref={ref} className="h-full"></div>
    </div>
  );
}

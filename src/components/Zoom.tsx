import React from "react";
import { useStore } from "@/store";

export default function Zoom() {
  const zoom = useStore((store) => store.zoom);
  if (!zoom) return;
  return <span className="w-10">{zoom?.toFixed()}%</span>;
}

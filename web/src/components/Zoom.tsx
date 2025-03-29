import { useStore } from "@/store";

export default function Zoom() {
  const zoom = useStore((store) => store.zoom);
  return <span className="w-10">{zoom?.toFixed() || 100}%</span>;
}

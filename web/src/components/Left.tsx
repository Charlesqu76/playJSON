import { useStore } from "@/store";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";

export default function Left() {
  const { jsons } = useStore((state) => state);
  return (
    <div className="flex-1 relative h-full p-2 border-2 rounded-md shadow-md">
      {jsons.map((json, i) => (
        <JsonView src={json} key={i} className="p-2 " />
      ))}
    </div>
  );
}

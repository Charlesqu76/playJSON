import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "./ui/button";
const COMMAND_LIST = [
  {
    name: "Copy",
    description: "Copy the selected node",
    shortcut: "Command + C",
  },
  {
    name: "Paste",
    description: "Paste the copied node",
    shortcut: "Command + V",
  },
  {
    name: "Delete",
    description: "Delete the selected node",
    shortcut: "Command + Del",
  },
  {
    name: "Layout",
    description: "Layout the graph",
    shortcut: "Command + L",
  },
  {
    name: "Add Node",
    description: "Add a new node",
    shortcut: "Tab",
  },
];
export function Help() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Help</Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        {COMMAND_LIST.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between py-1 px-2 text-sm"
          >
            <div className="flex items-center space-x-2">
              <span className=" font-bold">{item.shortcut}</span>
              <span className="text-gray-400">{item.description}</span>
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

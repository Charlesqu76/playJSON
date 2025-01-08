import React, { useState } from "react";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import clsx from "clsx";

interface IProps {
  options: string[];
  onChange: (value: string) => void;
}

export default function InputSearch({ options = [], onChange }: IProps) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="relative h-10">
      <Input
        placeholder="Search Keyword"
        className="h-full mb-2 max-w-80"
        onFocus={() => {
          setFocus(true);
        }}
        onBlur={() => {
          setFocus(false);
        }}
        onChange={(e) => onChange?.(e.target.value)}
      ></Input>
      <ScrollArea
        className={clsx(
          "absolute h-40 hidden max-w-80 z-10 bg-white p-2",
          focus && "block"
        )}
      >
        <div className=" space-y-2">
          {options.map((v) => (
            <div key={v} className=" line-clamp-1">
              {v}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

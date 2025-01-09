import React, { ReactElement, useState } from "react";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import clsx from "clsx";

interface IProps<T> {
  value: string;
  options: T[];
  onChange: (value: string) => void;
  OptionComponent: (data: { data: T }) => ReactElement;
}

export default function InputSearch<T>({
  options = [],
  value = "",
  onChange,
  OptionComponent,
}: IProps<T>) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="relative h-10">
      <Input
        placeholder="Search Keyword"
        className={clsx("h-full mb-2 max-w-80", focus && "w-80")}
        value={value}
        onFocus={() => {
          setFocus(true);
        }}
        // onBlur={() => {
        //   setFocus(false);
        // }}
        onChange={(e) => onChange?.(e.target.value)}
      ></Input>
      <ScrollArea
        className={clsx(
          "absolute h-40 hidden z-10 max-w-80 bg-white p-2 shadow rounded",
          focus && "block"
        )}
      >
        <div className=" space-y-2">
          {options.map((v, i) => (
            <OptionComponent data={v} key={i} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

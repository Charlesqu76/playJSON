import React, { ReactElement, useRef, useState } from "react";
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
  const [show, setShow] = useState(false);
  return (
    <div className="relative h-8">
      <Input
        placeholder="Search Keyword"
        className={clsx("h-full max-w-80", show && "w-80")}
        value={value}
        onFocus={() => setShow(true)}
        onBlur={() => {
          setTimeout(() => {
            setShow(false);
          }, 50);
        }}
        onChange={(e) => onChange?.(e.target.value)}
      ></Input>
      <ScrollArea
        className={clsx(
          "absolute top-2 h-40 hidden z-10 max-w-80 bg-white p-1 shadow rounded",
          show && "block"
        )}
      >
        <div className=" space-y-2   [&>*:hover]:bg-gray-100">
          {options.map((v, i) => (
            <OptionComponent data={v} key={i} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

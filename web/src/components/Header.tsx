import React from "react";
import Zoom from "./Zoom";
import { Help } from "./Help";
import InputSearch from "./InputSearch";
export default function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-2 justify w-full">
      <h2 className=" top-5 text-xl font-bold left-5 ">Play JSON</h2>
      <div className="flex items-end space-x-4">
        <Zoom />
        <InputSearch />
        <Help />
      </div>
    </header>
  );
}

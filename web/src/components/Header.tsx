import React from "react";
import Zoom from "./Zoom";
import { Help } from "./Help";
import InputSearch from "./InputSearch";
export default function Header() {
  return (
    <header className="h-16 flex items-center px-2 justify-between mb-2 border-2">
      <h2 className="text-xl font-bold">Play JSON</h2>
      <div className="flex items-center space-x-4">
        <Zoom />
        <InputSearch />
        <Help />
      </div>
    </header>
  );
}

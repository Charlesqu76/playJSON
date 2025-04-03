import React from "react";
import Zoom from "./Zoom";
import { Help } from "./Help";
import InputSearch from "./InputSearch";
export default function Util() {
  return (
    <div className="flex items-center space-x-4">
      <Zoom />
      <InputSearch />
      <Help />
    </div>
  );
}

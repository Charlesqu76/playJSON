import React from "react";
import { Help } from "./Help";
import InputSearch from "./InputSearch";
export default function Util() {
  return (
    <div className="flex items-center space-x-4">
      <InputSearch />
      <Help />
    </div>
  );
}

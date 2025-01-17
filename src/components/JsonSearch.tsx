import React from "react";
import { useStore } from "@/store";
import InputSearch from "./InputSearch";
import flattenJSONToList from "@/util/flatJsonList";
import { filterJson } from "@/util/filterJson";
import clsx from "clsx";

export default function JsonSearch() {
  const jsons = useStore((store) => store.jsons);
  const searchText = useStore((store) => store.searchText);
  const setSearchText = useStore((store) => store.setSearchText);
  const jsonList = flattenJSONToList(jsons[0]);

  return (
    <InputSearch
      value={searchText}
      options={filterJson(jsonList, searchText)}
      onChange={setSearchText}
      OptionComponent={({ data }) => (
        <div
          className="flex flex-col p-1"
          onClick={() => {
            console.log(data);
          }}
        >
          <span
            className={clsx(
              "line-clamp-1",
              data.type === "key" ? "text-blue-400" : "text-green-400"
            )}
          >
            {data.match}
          </span>
          <span className="text-sm text-gray-400">{data.path}</span>
        </div>
      )}
    />
  );
}

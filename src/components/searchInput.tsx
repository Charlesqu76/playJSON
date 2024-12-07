import React from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const SearchInput = () => {
  return (
    <Command className="relative border">
      <CommandInput placeholder="JSON" />
      <CommandList className="">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandItem>Calendar</CommandItem>
        <CommandItem>Search Emoji</CommandItem>
        <CommandItem>Calculator</CommandItem>
      </CommandList>
    </Command>
  );
};

export default SearchInput;

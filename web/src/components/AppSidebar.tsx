import React, { ComponentProps, useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { uid } from "@/util";
import { useStore } from "@/store";
import clsx from "clsx";

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const navItems = useStore((store) => store.navItems);
  const selected = useStore((store) => store.selected);
  const setNavItems = useStore((store) => store.setNavItems);
  const setSelected = useStore((store) => store.setSelected);

  const handleDoubleClick = (index: number, title: string) => {
    setEditingItemIndex(index);
    setEditedTitle(title);
  };

  useEffect(() => {
    const storedNavItems = localStorage.getItem("navItems");
    if (storedNavItems) {
      setNavItems(JSON.parse(storedNavItems));
    }
  }, []);

  const handleSave = (index: number) => {
    if (editedTitle.trim()) {
      const updatedItems = [...navItems];
      updatedItems[index].title = editedTitle;
      setNavItems(updatedItems);
    }
    setEditingItemIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      handleSave(index);
    }
  };

  const handleAddNav = () => {
    const newItemTitle = "New Item";
    const id = uid();
    const newItem = {
      id: uid(),
      title: newItemTitle,
      url: "#" + id,
    };
    setNavItems([...navItems, newItem]);
    setEditingItemIndex(navItems.length);
    setEditedTitle(newItemTitle);
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <h3 className=" font-bold">Play JSON</h3>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="space-y-2 p-2">
          {navItems.map((item, index) => (
            <SidebarMenuItem
              key={item.id}
              className={clsx(
                selected === item ? "bg-gray-200" : "",
                "rounded"
              )}
            >
              <SidebarMenuButton
                asChild
                onClick={() => {
                  setSelected(item);
                }}
              >
                {editingItemIndex === index ? (
                  <input
                    autoFocus
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={() => handleSave(index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-full p-1 outline-none border border-gray-300 rounded"
                  />
                ) : (
                  <a
                    onDoubleClick={() => handleDoubleClick(index, item.title)}
                    className="cursor-text"
                  >
                    {item.title}
                  </a>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Button onClick={handleAddNav}>Add</Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

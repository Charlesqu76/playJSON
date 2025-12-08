import React, { ComponentProps, useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { uid } from "@/util";
import { useStore } from "@/store";
import clsx from "clsx";
import { Link, useParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/util/db";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { id } = useParams();
  const [open, setOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const init = useStore((store) => store.init);
  const sidebar = useLiveQuery(() => db.sidebar.toArray(), [], []);

  useEffect(() => {
    init();
  }, []);

  const handleAddNav = async () => {
    const newItemTitle = "New Item";
    const id = uid();
    const newItem = {
      id,
      title: newItemTitle,
    };
    await db.sidebar.add(newItem);
  };

  return (
    <>
      <Sidebar {...props}>
        <SidebarHeader>
          <h3 className=" font-bold">Play JSON</h3>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="space-y-2 p-2">
            {sidebar.map((item, index) => (
              <SidebarMenuItem
                key={item.id}
                className={clsx(id === item.id ? "bg-gray-200" : "", "rounded")}
              >
                <div className="p-2 flex items-center justify-between">
                  <Link
                    to={{
                      pathname: "/" + item.id,
                    }}
                  >
                    {item.title}
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditedTitle(item.title);
                          setOpen(true);
                        }}
                      >
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async () => {
                          await db.sidebar.delete(item.id);
                          await db.graph.delete(item.id);
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Button onClick={handleAddNav}>Add</Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Title</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="col-span-4"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={async () => {
                if (!id) return;
                await db.sidebar.update(id, {
                  title: editedTitle,
                });
                setOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

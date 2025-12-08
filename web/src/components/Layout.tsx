import React, { useEffect } from "react";
import { Toaster } from "./ui/sonner";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import Util from "./Util";
import { useStore } from "../store";
import Graph from "./Graph";
import { useParams } from "react-router";

export default function Layout() {
  const saveGraph = useStore((state) => state.saveGraph);
  const { id } = useParams();

  const keybordEvent = (e: KeyboardEvent) => {
    if (e.metaKey && e.key === "s") {
      e.preventDefault();

      if (!id) {
        return;
      }
      saveGraph(id);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", keybordEvent);
    return () => {
      document.removeEventListener("keydown", keybordEvent);
    };
  }, []);

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12  shrink-0 items-center justify-between  gap-2 border-b px-4">
            <SidebarTrigger className="ml-1" />
            <Util />
          </header>
          <main className="flex-1 relative h-full p-2 m-2 border-2 rounded-md shadow-md">
            <Graph />
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </>
  );
}

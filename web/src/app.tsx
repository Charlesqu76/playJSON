import React, { useEffect } from "react";
import Graph from "./components/Graph";
import "./styles/index.css";
import { Toaster } from "./components/ui/sonner";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import Util from "./components/Util";
import { useStore } from "./store";

export default function App() {
  const saveGraph = useStore((state) => state.saveGraph);

  useEffect(() => {
    document.addEventListener("keydown", saveGraph);
    return () => {
      document.removeEventListener("keydown", saveGraph);
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

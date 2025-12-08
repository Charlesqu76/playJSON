import { create } from "zustand";
import Graph from "@charles/graph";
import { toast } from "sonner";
import { db } from "./util/db";

type Nav = {
  id: string;
  title: string;
};

type State = {
  graph: Graph;
  searchText: string;
};

type Actions = {
  setSearchText: (text: string) => void;
  saveGraph: (id: string) => void;
  loadGraph: (id: string) => void;
  init: () => void;
  initGraph: (element: HTMLDivElement) => void;
};

export const useStore = create<State & Actions>((set, get) => ({
  searchText: "",
  init: () => {
    const storedNavItems = localStorage.getItem("navItems");
    try {
      if (storedNavItems) {
        const data = JSON.parse(storedNavItems);
        get().loadGraph(data[0]);
      }
    } catch (e) {
      console.error("Error parsing navItems from localStorage", e);
    }
  },

  graph: new Graph({}),

  setSearchText: (text) => set(() => ({ searchText: text })),
  saveGraph: async (id: string) => {
    if (!id) return;
    const { graph } = get();
    const json = graph.value;
    if (await db.graph.get(id)) {
      await db.graph.update(id, { json });
    } else {
      await db.graph.add({
        id,
        json,
      });
    }

    toast.success("Saved successfully");
  },

  loadGraph: async (id: string) => {
    const { graph } = get();
    if (!graph.canvas) {
      toast.error("Graph not initialized");
      return;
    }
    graph.clear();
    const data = await db.graph.get(id);
    if (!data) {
      return;
    }
    graph.load(data.json);
  },
  initGraph: (ele) => {
    const { graph } = get();
    graph.initCanvas(ele);
  },
}));

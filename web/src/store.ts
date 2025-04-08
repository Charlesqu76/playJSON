import { create } from "zustand";
import data from "./data.json";
import Graph from "@charles/graph";
import { toast } from "sonner";

type Nav = {
  id: string;
  title: string;
};

type State = {
  graph: Graph;
  searchText: string;
  navItems: Nav[];
  selected: Nav | null;
};

type Actions = {
  setSearchText: (text: string) => void;
  setNavItems: (sidebar: Nav[]) => void;
  setSelected: (selected: Nav) => void;
  saveGraph: (e: KeyboardEvent) => void;
  loadGraph: (selected: Nav) => void;
  init: () => void;
  initGraph: (element: HTMLDivElement) => void;
};

export const useStore = create<State & Actions>((set, get) => ({
  navItems: [],
  searchText: "",
  selected: null,
  init: () => {
    const storedNavItems = localStorage.getItem("navItems");
    try {
      if (storedNavItems) {
        const data = JSON.parse(storedNavItems);
        get().setNavItems(data);
        get().setSelected(data[0]);
        get().loadGraph(data[0]);
      }
    } catch (e) {
      console.error("Error parsing navItems from localStorage", e);
    }
  },

  setSelected: (selected) => {
    if (selected) {
      get().loadGraph(selected);
    }
    set(() => ({ selected: selected }));
  },
  graph: new Graph({}),
  setNavItems: (navItems) => {
    localStorage.setItem("navItems", JSON.stringify(navItems));
    set(() => ({ navItems: navItems }));
  },
  setSearchText: (text) => set(() => ({ searchText: text })),
  saveGraph: (e: KeyboardEvent) => {
    const { graph, selected } = get();
    if (e.metaKey && e.key === "s") {
      e.preventDefault();
      const a = graph.getInfo();
      const { id } = selected || {};
      if (!id) {
        toast.error("No selected item");
        return;
      }

      let s = { [id]: a };
      const j = localStorage.getItem("json");
      if (j) {
        s = { ...JSON.parse(j), [id]: a };
      }
      localStorage.setItem("json", JSON.stringify(s));
      toast.success("Saved successfully");
    }
  },

  loadGraph: (selected: Nav) => {
    const { graph } = get();
    if (!graph.canvas) {
      toast.error("Graph not initialized");
      return;
    }
    graph.clear();
    const json = localStorage.getItem("json");
    if (json) {
      const { id } = selected;
      const data = JSON.parse(json)[id];
      if (!data || Object.keys(data).length === 0) {
        toast.error("No data found");
        return;
      }
      graph.load(data);
    } else {
      graph.initData(data);
    }
  },
  initGraph: (ele) => {
    const { graph } = get();
    graph.initCanvas(ele);
    const { loadGraph, selected } = get();
    if (selected) {
      loadGraph(selected);
    }
  },
}));

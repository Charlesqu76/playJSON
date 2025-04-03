import { create } from "zustand";
import data from "./data.json";
import Graph from "@charles/graph";
import { toast } from "sonner";

type Nav = {
  id: string;
  title: string;
  url: string;
};

type State = {
  graph: Graph;
  zoom?: number;
  searchText: string;
  navItems: Nav[];
  selected: Nav | null;
};

type Actions = {
  setZoom: (zoom: number) => void;
  setSearchText: (text: string) => void;
  setNavItems: (sidebar: Nav[]) => void;
  setSelected: (selected: Nav) => void;
  saveGraph: (e: KeyboardEvent) => void;
  loadGraph: (selected: Nav) => void;
};

export const useStore = create<State & Actions>((set, get) => ({
  navItems: [],
  searchText: "",
  zoom: 100,
  selected: null,
  setSelected: (selected) => {
    if (selected) {
      get().loadGraph(selected);
    }
    set(() => ({ selected: selected }));
  },
  graph: new Graph({
    zoomCallback: (zoom) => {
      set(() => ({ zoom: zoom * 100 }));
    },
  }),
  setNavItems: (navItems) => {
    localStorage.setItem("navItems", JSON.stringify(navItems));
    set(() => ({ navItems: navItems }));
  },
  setZoom: (zoom) => set(() => ({ zoom: zoom * 100 })),
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
      if (!data) {
        toast.error("No data found");
        return;
      }
      graph.load(data);
    } else {
      graph.initData(data);
    }
  },
}));

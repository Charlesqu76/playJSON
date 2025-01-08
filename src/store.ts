import { create } from "zustand";
import data from "../data1.json";
import { data1 } from "./data";
import Graph from "./garph/graph";

type State = {
  jsons: any[];
  graph: Graph;
  zoom?: number;
};

type Actions = {
  setJsons: (jsons: string[]) => void;
  setZoom: (zoom: number) => void;
};

export const useStore = create<State & Actions>((set, get) => ({
  jsons: [data],
  graph: new Graph(),
  zoom: undefined,
  setJsons: (jsons) => set(() => ({ jsons: jsons })),
  setZoom: (zoom) => set(() => ({ zoom: zoom * 100 })),
}));

import { create } from "zustand";
import data from "../data1.json";
import { data1 } from "./data";

type State = {
  jsons: any[];
};

type Action = {
  setJsons: (jsons: string[]) => void;
};

export const useStore = create<State & Action>((set) => ({
  jsons: [data, data1],
  setJsons: (jsons) => set(() => ({ jsons: jsons })),
}));

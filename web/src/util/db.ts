import Dexie from "dexie";

interface SidebarItem {
  id: string;
  title: string;
}

interface GraphItem {
  id: string;
  json: any;
}

export const db = new Dexie("playJSON") as Dexie & {
  sidebar: Dexie.Table<SidebarItem, string>;
  graph: Dexie.Table<GraphItem, string>;
};

db.version(1).stores({
  sidebar: "id,title",
  graph: "id,json",
});

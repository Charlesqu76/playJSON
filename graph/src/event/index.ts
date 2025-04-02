import Graph from "..";
import {
  EVENT_ACTION,
  EVENT_CREATE,
  EVENT_DELETE,
  EVENT_SELECT,
  EVENT_UPDATE,
} from "../event";
import create from "./create";
import deleteItem from "./delete";
import select from "./select";

export function graphEvent(graph: Graph) {
  graph.on(EVENT_UPDATE, (data) => {});

  graph.on(EVENT_CREATE, ({ item }) => {
    create(graph, item);
  });

  graph.on(EVENT_DELETE, ({ item }) => {
    deleteItem(graph, item);
  });

  graph.on(EVENT_SELECT, ({ item }) => {
    select(graph, item);
  });

  graph.on(
    EVENT_ACTION,
    ({ action, params }: { action: string; params: any }) => {
      console.log("action", action, params);
    }
  );

  graph.canvas?.click((event: Event) => {
    if (event.target === graph.canvas?.node) {
      if (graph.selectedItem) {
        graph.selectedItem.unHighlight();
        graph.selectedItem = null;
      }
    }
  });

  graph.canvas?.on("zoom", (event: any) => {
    graph.recordAction("zoom", {
      level: event.detail.level,
    });
    graph.zoomCallback?.(event.detail.level);
    graph.updateInputPosition();
  });

  graph.canvas?.on("panning", (e) => {
    graph.recordAction("panning", {});
    graph.updateInputPosition();
  });
}

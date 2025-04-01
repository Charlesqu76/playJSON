import Graph from "..";
import {
  EVENT_CREATE,
  EVENT_DELETE,
  EVENT_MOUSEOUT,
  EVENT_MOUSEOVER,
  EVENT_SELECT,
  EVENT_UPDATE,
} from "../event";
import create from "./create";
import deleteItem from "./delete";
import mouseout from "./mouseout";
import mouseover from "./mouseover";
import select from "./select";

export function graphEvent(graph: Graph) {
  graph.on(EVENT_UPDATE, (data) => {});

  graph.on(EVENT_DELETE, ({ item }) => {
    deleteItem(graph, item);
  });

  graph.on(EVENT_SELECT, ({ item }) => {
    select(graph, item);
  });

  graph.on(EVENT_MOUSEOUT, ({ item }) => {
    mouseout(graph, item);
  });

  graph.on(EVENT_MOUSEOVER, ({ item }) => {
    mouseover(graph, item);
  });

  graph.on(EVENT_CREATE, ({ item }) => {
    create(graph, item);
  });

  graph.canvas?.click((event: Event) => {
    if (event.target === graph.canvas?.node) {
      if (graph.selectedItem) {
        graph.selectedItem.unHighlight();
        graph.selectedItem = null;
      }
    }
  });

  graph.canvas?.on("zoom", (event: any) => {
    graph.zoomCallback?.(event.detail.level);
    graph.updateInputPosition();
  });

  graph.canvas?.on("panning", (e) => {
    graph.updateInputPosition();
  });
}

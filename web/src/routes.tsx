import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import GraphPage from "./pages/graph";

export const router = createBrowserRouter([
  {
    Component: Layout,
    children: [{ index: true }, { path: ":id", Component: GraphPage }],
  },
]);

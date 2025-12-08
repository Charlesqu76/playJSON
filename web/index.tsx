import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "@/routes";
import "./src/styles/index.css";

const container = document.getElementById("app");

const root = createRoot(container!);
root.render(<RouterProvider router={router} />);

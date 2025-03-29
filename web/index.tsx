import React, { StrictMode } from "react";
import App from "./src/app";

import { createRoot } from "react-dom/client";
const container = document.getElementById("app");
const root = createRoot(container!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

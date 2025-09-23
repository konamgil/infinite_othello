import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./ui/theme/globals.css";
import "./ui/effects/animations.css";

// PWA 개발 모드에서는 VitePWA가 자동으로 처리

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


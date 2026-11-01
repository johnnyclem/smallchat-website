import { createRoot } from "react-dom/client";
import { MotionProvider } from "@workspace/site-kit";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <MotionProvider>
    <App />
  </MotionProvider>
);

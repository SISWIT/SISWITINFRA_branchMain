import { createRoot } from "react-dom/client";
import { validateEnv } from "@/core/utils/env";
import App from "./app/App.tsx";
import "@/styles/index.css";

// Security & QA: Validate environment before initializing the app
validateEnv();

createRoot(document.getElementById("root")!).render(<App />);

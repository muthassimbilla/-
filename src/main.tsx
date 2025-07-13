import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import {
  SecurityProvider,
  ThemeProvider,
} from "./contexts/SecurityContext.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SecurityProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </SecurityProvider>
    </BrowserRouter>
  </React.StrictMode>
);

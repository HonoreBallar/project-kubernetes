// Point d'entrée Vite/React : on installe l'application dans la div #root.
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  // StrictMode alerte sur les patterns React à éviter pendant le développement.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

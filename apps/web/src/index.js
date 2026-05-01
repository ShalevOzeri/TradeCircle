import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { configure, configureSocket } from "./services/api";
import "./styles/main.css";

configure({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});
configureSocket({
  serverURL: process.env.REACT_APP_SERVER_URL || "http://localhost:5000",
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
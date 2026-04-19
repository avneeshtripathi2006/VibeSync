window.global = window;

import axios from "axios";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { getApiBase, API_TIMEOUT_MS } from "./config/env.js";

const sanitizeToken = () => {
  const token = localStorage.getItem("token");
  if (!token || token === "null" || token === "undefined") {
    localStorage.removeItem("token");
    return null;
  }
  return token;
};

axios.defaults.timeout = API_TIMEOUT_MS;
axios.interceptors.request.use((config) => {
  const token = sanitizeToken();
  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("vibesync-token"));
      const baseUrl = window.location.origin + window.location.pathname;
      window.location.replace(baseUrl);
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

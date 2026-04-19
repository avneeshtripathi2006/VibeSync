import React, { useState, useEffect } from "react";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import MainLayout from "./components/MainLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./context/ToastContext";

const basename = import.meta.env.BASE_URL || "/";
const useHashRouter = typeof window !== "undefined" && (window.location.hostname === "github.io" || window.location.hostname.endsWith(".github.io"));
const RouterComponent = useHashRouter ? HashRouter : BrowserRouter;

if (typeof window !== "undefined" && useHashRouter && !window.location.hash) {
  const siteBase = basename.endsWith("/") ? basename.slice(0, -1) : basename;
  const currentPath = window.location.pathname;
  const pathWithoutBase = siteBase && currentPath.startsWith(siteBase)
    ? currentPath.slice(siteBase.length)
    : currentPath;
  const normalizedPath = pathWithoutBase || "/";
  const redirectUrl = `${window.location.origin}${siteBase}/#${normalizedPath}${window.location.search}`;
  window.location.replace(redirectUrl);
}

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("token"));

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem("token"));
    };
    window.addEventListener("storage", checkAuth);
    window.addEventListener("vibesync-token", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("vibesync-token", checkAuth);
    };
  }, []);

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <RouterComponent {...(!useHashRouter ? { basename } : {})}>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/auth/oauth2/success" element={<Auth />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Home />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Messages />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Explore />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Profile />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </RouterComponent>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;

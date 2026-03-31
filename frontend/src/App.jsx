import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Matches from './pages/Matches'; 
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import MainLayout from './components/MainLayout';

// ProtectedRoute wrapper to ensure auth before accessing routes
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem("token"));
    };
    
    // Listen for storage changes (for logout in other tabs)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  return isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check auth status on mount
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setIsLoading(false);

    // Listen for storage changes
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center text-slate-200">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public Route - Always show Auth, let it handle redirects */}
        <Route 
          path="/" 
          element={<Auth />} 
        />

        {/* OAuth success route */}
        <Route 
          path="/auth/oauth2/success" 
          element={<Auth />} 
        />

        {/* Protected Routes wrapped in MainLayout */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <Matches />
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

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Matches from './pages/Matches'; 
import Profile from './pages/Profile';
import MainLayout from './components/MainLayout';

function App() {
  // A simple check to see if the user is logged in
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/home" /> : <Auth />} 
        />

        {/* Protected Routes wrapped in MainLayout */}
        <Route 
          path="/home" 
          element={
            <MainLayout>
              <Matches /> {/* This is your new 3-column feed! */}
            </MainLayout>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <MainLayout>
              <Profile />
            </MainLayout>
          } 
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
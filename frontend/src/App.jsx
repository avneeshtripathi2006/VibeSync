import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Matches from "./pages/Home";
import MainLayout from "./components/MainLayout"; // 👈 Import the new Sidebar Layout

function App() {
  return (
    <Router>
      <Routes>
        {/* 🔐 Public Route: No Navbar here (Clean Login Screen) */}
        <Route path="/" element={<Auth />} />

        {/* 📱 Protected Routes: Everything inside MainLayout gets the Sidebar */}
        <Route 
          path="/matches" 
          element={
            <MainLayout>
              <Matches />
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

        {/* 💬 Future Chat Page (We'll build this properly soon) */}
        <Route 
          path="/chat" 
          element={
            <MainLayout>
              <div className="text-center py-20 text-slate-500">Messages Coming Soon...</div>
            </MainLayout>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
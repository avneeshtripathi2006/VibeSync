import { Home, MessageSquare, User, Compass, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // 👈 Added useNavigate

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate(); // 👈 For the logout redirect

  const handleLogout = () => {
    localStorage.removeItem("token"); // 👈 Clear the session
    localStorage.clear(); // 👈 Clear all local storage
    window.location.href = "/"; // 👈 Full page redirect to reset app state
  };

  return (
    <div className="flex h-screen bg-[#050505] text-slate-200 font-sans selection:bg-purple-500/30 overflow-hidden">
      {/* 🚀 SIDEBAR */}
      <aside className="w-20 lg:w-64 border-r border-white/5 flex flex-col justify-between py-8 px-4 bg-black/20 backdrop-blur-xl">
        <div className="space-y-8">
          {/* Logo is now a Link */}
          <Link to="/home" className="text-2xl font-black bg-gradient-to-br from-purple-400 to-pink-600 bg-clip-text text-transparent px-4 hidden lg:block tracking-tighter">
            VibeSync
          </Link>
          
          <nav className="space-y-2">
            {/* 🏠 Changed from /matches to /home */}
            <NavItem icon={<Home size={22}/>} label="Home" to="/home" active={location.pathname === "/home"} />
            <NavItem icon={<Compass size={22}/>} label="Explore" to="/explore" />
            <NavItem icon={<MessageSquare size={22}/>} label="Messages" to="/chat" />
            <NavItem icon={<User size={22}/>} label="Profile" to="/profile" />
          </nav>
        </div>

        {/* 🚪 Functional Logout Button */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 p-4 text-slate-500 hover:text-red-400 transition-colors group"
        >
          <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
          <span className="hidden lg:block font-medium">Logout</span>
        </button>
      </aside>

      {/* 🎞️ SCROLLABLE MAIN STAGE */}
      <main className="flex-1 overflow-y-auto relative bg-[#050505]">
        <div className="max-w-6xl mx-auto py-10 px-6">
          {children}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, to, active }) => (
  <Link to={to} className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${active ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(147,51,234,0.1)]' : 'hover:bg-white/5 text-slate-400'}`}>
    <span className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{icon}</span>
    <span className={`hidden lg:block font-semibold ${active ? 'text-white' : ''}`}>{label}</span>
  </Link>
);

export default MainLayout;
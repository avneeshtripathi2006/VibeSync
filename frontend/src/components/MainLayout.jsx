import { Home, MessageSquare, User, Compass, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      localStorage.clear();
    } catch (_) {
      /* ignore */
    }
    window.dispatchEvent(new Event("vibesync-token"));
    navigate("/");
  };

  const path = location.pathname;

  return (
    <div className="flex flex-col md:flex-row min-h-dvh h-dvh max-h-dvh bg-[#050505] text-slate-200 font-sans selection:bg-purple-500/30 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-20 lg:w-64 shrink-0 border-r border-white/5 flex-col justify-between py-6 lg:py-8 px-2 lg:px-4 bg-black/25 backdrop-blur-xl">
        <div className="space-y-6 lg:space-y-8">
          <Link
            to="/home"
            className="text-xl lg:text-2xl font-black bg-gradient-to-br from-purple-400 to-pink-600 bg-clip-text text-transparent px-2 lg:px-4 tracking-tighter block text-center lg:text-left"
          >
            <span className="lg:hidden">VS</span>
            <span className="hidden lg:inline">VibeSync</span>
          </Link>

          <nav className="space-y-1 lg:space-y-2">
            <NavItem icon={<Home size={22} />} label="Home" to="/home" active={path === "/home"} />
            <NavItem icon={<Compass size={22} />} label="Explore" to="/explore" active={path === "/explore"} />
            <NavItem
              icon={<MessageSquare size={22} />}
              label="Messages"
              to="/chat"
              active={path === "/chat"}
            />
            <NavItem icon={<User size={22} />} label="Profile" to="/profile" active={path === "/profile"} />
          </nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors touch-manipulation"
        >
          <LogOut size={22} className="shrink-0" />
          <span className="hidden lg:block font-medium">Logout</span>
        </button>
      </aside>

      {/* Main scroll area — extra bottom padding on mobile for tab bar */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-[#050505] overscroll-y-contain">
        <div className="max-w-6xl mx-auto py-4 px-4 sm:py-8 sm:px-6 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        className="md:hidden shrink-0 fixed bottom-0 inset-x-0 z-40 flex items-stretch justify-around gap-1 border-t border-white/10 bg-[#050505]/95 backdrop-blur-xl pt-1 px-1"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
        aria-label="Main navigation"
      >
        <MobileTab to="/home" label="Home" active={path === "/home"} icon={<Home size={22} />} />
        <MobileTab to="/explore" label="Explore" active={path === "/explore"} icon={<Compass size={22} />} />
        <MobileTab
          to="/chat"
          label="Chats"
          active={path === "/chat"}
          icon={<MessageSquare size={22} />}
        />
        <MobileTab to="/profile" label="Profile" active={path === "/profile"} icon={<User size={22} />} />
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-0.5 py-2 px-2 rounded-xl min-w-[3.25rem] text-slate-500 touch-manipulation active:scale-95 transition-transform"
          aria-label="Log out"
        >
          <LogOut size={22} />
          <span className="text-[10px] font-semibold">Out</span>
        </button>
      </nav>
    </div>
  );
};

const NavItem = ({ icon, label, to, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-2xl transition-all duration-300 group touch-manipulation ${
      active
        ? "bg-purple-600/10 text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(147,51,234,0.1)]"
        : "hover:bg-white/5 text-slate-400 border border-transparent"
    }`}
  >
    <span className={`${active ? "scale-110" : "group-hover:scale-110"} transition-transform shrink-0`}>
      {icon}
    </span>
    <span className={`hidden lg:block font-semibold ${active ? "text-white" : ""}`}>{label}</span>
  </Link>
);

const MobileTab = ({ to, label, active, icon }) => (
  <Link
    to={to}
    className={`flex flex-col items-center justify-center gap-0.5 py-2 px-2 rounded-xl min-w-[3.25rem] touch-manipulation active:scale-95 transition-transform ${
      active ? "text-purple-400" : "text-slate-500"
    }`}
  >
    {icon}
    <span className="text-[10px] font-semibold leading-none">{label}</span>
  </Link>
);

export default MainLayout;

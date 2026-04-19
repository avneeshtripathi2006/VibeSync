import { motion, AnimatePresence } from "framer-motion";
import { Home, MessageSquare, User, Compass, LogOut, Palette, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { getApiBase } from "../config/env.js";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("vibesync-theme");
    const validThemes = new Set(["system", "dark", "light", "love", "depressed", "rainy", "summer", "winter", "spring", "railway", "aquarium"]);
    return saved && validThemes.has(saved) ? saved : "dark";
  });
  const [themeOpen, setThemeOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("vibesync-sidebar-collapsed") === "true");
  const [unreadChats, setUnreadChats] = useState(0);

  const themeOptions = [
    { id: "system", label: "System", subtitle: "Follow OS preference" },
    { id: "dark", label: "Midnight", subtitle: "Deep mode" },
    { id: "light", label: "Daylight", subtitle: "Bright and clean" },
    { id: "love", label: "Love", subtitle: "Warm rose glow" },
    { id: "depressed", label: "Depressed", subtitle: "Moody grayscale" },
    { id: "rainy", label: "Rainy", subtitle: "Stormy blue" },
    { id: "summer", label: "Summer", subtitle: "Warm sunset" },
    { id: "winter", label: "Winter", subtitle: "Frosted chill" },
    { id: "spring", label: "Spring", subtitle: "Fresh blooms" },
    { id: "railway", label: "Railway", subtitle: "Moody industrial" },
    { id: "aquarium", label: "Aquarium", subtitle: "Ocean teal" },
  ];

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    try {
      localStorage.setItem("vibesync-theme", theme);
    } catch (_error) {
      // ignore storage failures
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem("vibesync-sidebar-collapsed", String(sidebarCollapsed));
    } catch (_error) {
      // ignore storage failures
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        if (!token) {
          setUnreadChats(0);
          return;
        }
        const cleaned = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
        if (!cleaned) {
          setUnreadChats(0);
          return;
        }
        const res = await axios.get(`${getApiBase()}/api/chat/conversations-meta`, {
          headers: { Authorization: `Bearer ${cleaned}` },
        });
        const rows = Array.isArray(res.data) ? res.data : [];
        const unreadUsers = rows.filter((row) => Number(row?.unreadCount || 0) > 0).length;
        setUnreadChats(unreadUsers);
      } catch {
        // ignore sidebar badge fetch issues
      }
    };

    fetchUnread();
    const intervalId = window.setInterval(fetchUnread, 15000);
    const onTokenSync = () => fetchUnread();
    const onUnreadChanged = (event) => {
      const value = Number(event?.detail?.unreadUsers ?? event?.detail?.unreadCount);
      if (Number.isFinite(value)) {
        setUnreadChats(Math.max(0, value));
        return;
      }
      fetchUnread();
    };

    window.addEventListener("vibesync-token", onTokenSync);
    window.addEventListener("vibesync-unread-chats-updated", onUnreadChanged);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("vibesync-token", onTokenSync);
      window.removeEventListener("vibesync-unread-chats-updated", onUnreadChanged);
    };
  }, [location.pathname]);

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
    <div className="relative flex flex-col md:flex-row min-h-dvh h-dvh max-h-dvh bg-(--surface) text-(--text-primary) font-sans selection:bg-(--accent-bg) overflow-hidden transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden>
        <div className="absolute -top-28 -left-28 h-80 w-80 rounded-full blur-3xl" style={{ background: "var(--ambient-1)" }} />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full blur-3xl" style={{ background: "var(--ambient-2)" }} />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full blur-3xl" style={{ background: "var(--ambient-3)" }} />
      </div>
      {/* Desktop sidebar */}
      <aside className={`relative z-10 hidden md:flex shrink-0 border-r border-(--border) flex-col justify-between py-6 lg:py-8 px-2 lg:px-4 bg-(--surface-soft) backdrop-blur-xl transition-all duration-300 overflow-y-auto max-h-screen scrollbar-thin scrollbar-thumb-slate-600/30 ${sidebarCollapsed ? "w-20" : "w-64"}`}>
        <div className="space-y-6 lg:space-y-8">
          <div className="flex items-center justify-between px-2">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="rounded-xl border border-(--border) bg-(--surface-alt) p-2 text-(--text-secondary) hover:text-(--text-primary) hover:border-(--accent) transition-colors"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
          <Link
            to="/home"
            className="text-xl lg:text-2xl font-black bg-linear-to-br from-purple-400 to-pink-600 bg-clip-text text-transparent px-2 lg:px-4 tracking-tighter block text-center lg:text-left"
          >
            {sidebarCollapsed ? "VS" : "VibeSync"}
          </Link>

          <nav className="space-y-1 lg:space-y-2">
            <NavItem icon={<Home size={22} />} label="Home" to="/home" active={path === "/home"} collapsed={sidebarCollapsed} />
            <NavItem icon={<Compass size={22} />} label="Explore" to="/explore" active={path === "/explore"} collapsed={sidebarCollapsed} />
            <NavItem
              icon={<MessageSquare size={22} />}
              label="Messages"
              to="/chat"
              active={path === "/chat"}
              badgeCount={unreadChats}
              collapsed={sidebarCollapsed}
            />
            <NavItem icon={<User size={22} />} label="Profile" to="/profile" active={path === "/profile"} collapsed={sidebarCollapsed} />
          </nav>

          <div className={`mt-6 rounded-3xl border border-(--border) bg-(--surface-alt) p-4 text-(--text-primary) transition-colors duration-300 ${sidebarCollapsed ? "hidden" : ""}`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-(--text-secondary)">Theme</p>
                <p className="text-[11px] text-(--text-secondary)">Pick the vibe that matches you.</p>
              </div>
              <button
                type="button"
                onClick={() => setThemeOpen((prev) => !prev)}
                className="rounded-full border border-(--border) bg-(--surface-soft) px-3 py-2 text-xs font-semibold text-(--text-primary) hover:bg-(--surface) transition-colors duration-200"
              >
                {themeOpen ? "Hide" : "Choose"}
              </button>
            </div>
            <div className={`grid grid-cols-2 gap-2 ${themeOpen ? "max-h-250 opacity-100" : "max-h-0 opacity-60 overflow-hidden"} transition-all duration-300`}>
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setTheme(option.id);
                    setThemeOpen(true);
                  }}
                  className={`rounded-3xl border px-3 py-3 text-left transition-all duration-200 ${
                    theme === option.id
                      ? "border-(--accent) bg-(--accent-bg) text-(--text-primary) shadow-[0_10px_30px_rgba(99,102,241,0.18)]"
                      : "border-(--border) bg-(--surface-soft) text-(--text-secondary) hover:border-(--accent) hover:bg-(--surface-alt) hover:text-(--text-primary)"
                  }`}
                >
                  <div className="font-semibold text-sm">{option.label}</div>
                  <div className="text-[10px] text-(--text-secondary) mt-1">{option.subtitle}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-2xl text-(--text-secondary) hover:text-red-400 hover:bg-(--surface-alt) transition-colors touch-manipulation"
        >
          <LogOut size={22} className="shrink-0" />
          <span className={`${sidebarCollapsed ? "hidden" : "block"} font-medium`}>Logout</span>
        </button>
      </aside>

      {/* Main scroll area — extra bottom padding on mobile for tab bar */}
      <main className="relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-transparent overscroll-y-contain transition-colors duration-300">
        <div className="max-w-6xl mx-auto py-4 px-4 sm:py-8 sm:px-6 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-10">
          {children}
        </div>
      </main>

      <AnimatePresence>
        {themeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm px-4 py-5"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="mx-auto max-w-md rounded-4xl border border-(--border) bg-(--surface-soft) p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-(--text-primary)">Pick a theme</h2>
                  <p className="text-[10px] text-(--text-secondary)">Tap any mood to apply it instantly.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setThemeOpen(false)}
                  className="text-(--text-secondary) hover:text-(--text-primary)"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {themeOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setTheme(option.id);
                      setThemeOpen(false);
                    }}
                    className={`rounded-3xl border px-3 py-3 text-left transition-all duration-200 ${
                      theme === option.id
                        ? "border-(--accent) bg-(--accent-bg) text-(--text-primary)"
                        : "border-(--border) bg-(--surface) text-(--text-secondary) hover:border-(--accent) hover:bg-(--surface-alt) hover:text-(--text-primary)"
                    }`}
                  >
                    <div className="font-semibold text-sm">{option.label}</div>
                    <div className="text-[10px] text-(--text-secondary) mt-1">{option.subtitle}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom navigation */}
      <nav
        className="md:hidden shrink-0 fixed bottom-0 inset-x-0 z-40 flex items-stretch justify-around gap-1 border-t border-(--border) bg-(--surface-soft)/95 backdrop-blur-xl pt-1 px-1 transition-colors duration-300"
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
          badgeCount={unreadChats}
        />
        <MobileTab to="/profile" label="Profile" active={path === "/profile"} icon={<User size={22} />} />
        <button
          type="button"
          onClick={() => setThemeOpen((prev) => !prev)}
          className="flex flex-col items-center justify-center gap-0.5 py-2 px-2 rounded-xl min-w-13 text-(--text-secondary) hover:text-(--text-primary) touch-manipulation active:scale-95 transition-transform"
          aria-label="Open theme picker"
        >
          <Palette size={22} />
          <span className="text-[10px] font-semibold">Theme</span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-0.5 py-2 px-2 rounded-xl min-w-13 text-slate-500 touch-manipulation active:scale-95 transition-transform"
          aria-label="Log out"
        >
          <LogOut size={22} />
          <span className="text-[10px] font-semibold">Out</span>
        </button>
      </nav>
    </div>
  );
};

const NavItem = ({ icon, label, to, active, badgeCount = 0, collapsed = false }) => (
  <Link
    to={to}
    className={`flex items-center ${collapsed ? "justify-center gap-0 px-2 py-3" : "gap-3 lg:gap-4 p-3 lg:p-4"} rounded-2xl transition-all duration-300 group touch-manipulation ${
      active
        ? "bg-purple-600/10 text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(147,51,234,0.1)]"
        : "hover:bg-white/5 text-slate-400 border border-transparent"
    }`}
    aria-label={label}
  >
    <span className={`relative ${active ? "scale-110" : "group-hover:scale-110"} transition-transform shrink-0`}>
      {icon}
      {badgeCount > 0 && (
        <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
          {Math.min(badgeCount, 99)}
        </span>
      )}
    </span>
    <span className={`${collapsed ? "hidden" : "hidden lg:block"} font-semibold ${active ? "text-white" : ""}`}>{label}</span>
    {!collapsed && badgeCount > 0 && (
      <span className="hidden lg:inline-flex ml-auto rounded-full bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold text-rose-300">
        {Math.min(badgeCount, 99)}
      </span>
    )}
  </Link>
);

const MobileTab = ({ to, label, active, icon, badgeCount = 0 }) => (
  <Link
    to={to}
    className={`flex flex-col items-center justify-center gap-0.5 py-2 px-2 rounded-xl min-w-13 touch-manipulation active:scale-95 transition-transform ${
      active ? "text-purple-400" : "text-slate-500"
    }`}
  >
    <span className="relative">
      {icon}
      {badgeCount > 0 && (
        <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
          {Math.min(badgeCount, 99)}
        </span>
      )}
    </span>
    <span className="text-[10px] font-semibold leading-none">{label}</span>
  </Link>
);

export default MainLayout;

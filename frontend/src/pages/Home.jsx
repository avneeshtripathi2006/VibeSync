import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, MessageCircle, X } from "lucide-react";
import { getApiBase } from "../config/env.js";
import { getMyUserIdFromToken } from "../utils/jwt.js";
import { formatMatchPercent } from "../utils/matchPercent.js";
import { sendChatViaRest } from "../api/chatSend.js";
import { useStompConnection } from "../hooks/useStompConnection.js";
import { useToast } from "../context/ToastContext.jsx";

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const chatEndRef = useRef(null);
  const showToast = useToast();

  const token = localStorage.getItem("token");
  const myId = getMyUserIdFromToken(token);

  const { status: wsStatus, sendChat } = useStompConnection(myId, (body) => {
    setChatHistory((prev) => [...prev, body]);
  });

  const blurAmount = Math.max(0, 20 - chatHistory.length * 0.4);
  const progress = Math.min(100, (chatHistory.length / 50) * 100);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, selectedUser]);

  const findMatches = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${getApiBase()}/api/profile/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatches(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Match fetch failed", err);
      showToast("Could not load matches. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    findMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  const openChat = async (user) => {
    setSelectedUser(user);
    try {
      const res = await axios.get(`${getApiBase()}/api/chat/history/${user.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load chat", err);
      showToast("Could not load this conversation.");
    }
  };

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !myId || !selectedUser) return;
    const payload = {
      senderId: myId,
      receiverId: selectedUser.userId,
      content: text,
    };
    if (sendChat(payload)) {
      setMessage("");
      return;
    }
    try {
      const saved = await sendChatViaRest(getApiBase, token, selectedUser.userId, text);
      setChatHistory((prev) => [...prev, saved]);
      setMessage("");
    } catch (e) {
      console.error(e);
      showToast("Could not send message. Check your connection and try again.");
    }
  };

  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${getApiBase()}/api/posts/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Posts fetch failed", err);
      showToast("Could not load the feed.");
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  const [postContent, setPostContent] = useState("");

  const handlePostVibe = async () => {
    if (!postContent.trim()) return;
    try {
      const t = localStorage.getItem("token");
      await axios.post(`${getApiBase()}/api/posts/create`, postContent, {
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "text/plain",
        },
      });
      setPostContent("");
      fetchPosts();
      showToast("Posted!", "success");
    } catch (err) {
      console.error("Vibe post failed", err);
      showToast("Could not post your vibe. Sign in again if this keeps happening.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {myId == null && token && (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Your session token could not be read. Try logging out and signing in again so chat works.
        </div>
      )}

      {loading && (
        <div className="fixed top-[max(1rem,env(safe-area-inset-top))] right-3 z-50 bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-lg">
          Loading matches…
        </div>
      )}

      {wsStatus === "connecting" && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300">
          Connecting live updates… You can still <strong className="text-slate-200">send messages</strong> — they
          are delivered through the server.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111827]/50 border border-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-3xl sm:rounded-[2.5rem] shadow-xl"
          >
            <div className="flex gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
              <div className="flex-1 min-w-0">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share your current frequency…"
                  className="w-full bg-transparent border-none outline-none text-base sm:text-lg text-slate-200 placeholder:text-slate-600 resize-none min-h-[5rem] sm:h-20"
                  rows={3}
                />
                <div className="flex flex-wrap justify-between items-center gap-3 pt-3 sm:pt-4 border-t border-white/5">
                  <Sparkles size={20} className="text-slate-500 shrink-0" aria-hidden />
                  <button
                    type="button"
                    onClick={handlePostVibe}
                    className="touch-manipulation bg-indigo-600 hover:bg-indigo-500 text-white px-5 sm:px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2"
                  >
                    Post Vibe <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {posts.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p>No posts yet.</p>
              <p className="text-sm">Share your first vibe!</p>
            </div>
          )}
          {posts.map((post, idx) => {
            const authorName = post.user?.fullName?.trim() || "Member";
            const initial = authorName.charAt(0) || "?";
            const created = post.createdAt ? new Date(post.createdAt) : null;
            const timeLabel =
              created && !Number.isNaN(created.getTime())
                ? created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";
            return (
              <motion.div
                key={post.id != null ? post.id : `post-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/5 p-4 sm:p-6 rounded-3xl sm:rounded-[2rem] backdrop-blur-sm hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">{authorName}</p>
                    {timeLabel && (
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{timeLabel}</p>
                    )}
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed break-words">{post.content ?? ""}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="lg:col-span-4 space-y-4 sm:space-y-6 lg:sticky lg:top-4 lg:self-start">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Vibe Tribe</h3>
            <button
              type="button"
              onClick={findMatches}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold touch-manipulation py-1 px-2"
            >
              {loading ? "…" : "Refresh"}
            </button>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {matches.length === 0 && !loading && (
              <div className="text-center py-8 text-slate-500">
                <p>No matches found yet.</p>
                <p className="text-sm">Complete your profile to get better matches!</p>
              </div>
            )}
            {matches.map((m, i) => (
              <motion.div
                key={m.userId ?? i}
                whileHover={{ x: 4 }}
                onClick={() => openChat(m)}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group touch-manipulation"
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.fullName || "u")}`}
                  alt=""
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-800 border border-indigo-500/20 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">{m.fullName}</p>
                  <p
                    className="text-[10px] text-slate-500 font-bold uppercase tracking-tight"
                    title={formatMatchPercent(m.distance).title}
                  >
                    {formatMatchPercent(m.distance).label} match
                  </p>
                </div>
                <MessageCircle size={18} className="text-slate-500 group-hover:text-indigo-400 shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="bg-[#0f172a] border border-white/10 w-full sm:max-w-lg rounded-t-3xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[min(92dvh,640px)] sm:max-h-[85vh] flex flex-col"
            >
              <div className="p-4 sm:p-6 border-b border-white/5 bg-white/5 shrink-0">
                <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
                  <h2
                    className="text-lg sm:text-xl font-bold tracking-tight transition-all duration-700 min-w-0 truncate"
                    style={{ filter: `blur(${blurAmount}px)` }}
                  >
                    {chatHistory.length >= 50 ? selectedUser.fullName : "Mysterious Vibe"}
                  </h2>
                  <button
                    type="button"
                    className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 touch-manipulation shrink-0"
                    onClick={() => setSelectedUser(null)}
                    aria-label="Close chat"
                  >
                    <X size={22} />
                  </button>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 text-right italic">
                  {chatHistory.length}/50 messages to reveal
                </p>
              </div>

              <div className="p-4 sm:p-6 bg-slate-900/20 overflow-y-auto flex-1 min-h-0 space-y-3">
                {chatHistory.length === 0 ? (
                  <p className="text-slate-400 text-sm">No messages yet. Say hi!</p>
                ) : (
                  chatHistory.map((msg, idx) => {
                    const sid = msg.senderId;
                    const isMe = sid != null && myId != null && Number(sid) === Number(myId);
                    return (
                      <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 rounded-2xl break-words ${
                            isMe ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-100"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className="text-[10px] text-white/70 mt-1 text-right">
                            {new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <div
                className="p-4 sm:p-6 bg-white/5 flex gap-2 sm:gap-3 shrink-0 border-t border-white/5"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
              >
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your message…"
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 p-3 sm:p-4 rounded-2xl outline-none focus:border-indigo-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  className="bg-indigo-600 p-3 sm:p-4 rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 touch-manipulation shrink-0"
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Matches;

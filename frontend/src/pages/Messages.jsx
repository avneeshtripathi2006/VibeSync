import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Send, X, ChevronLeft } from "lucide-react";
import { getApiBase } from "../config/env.js";
import { getMyUserIdFromToken } from "../utils/jwt.js";
import { formatMatchPercent } from "../utils/matchPercent.js";
import { sendChatViaRest } from "../api/chatSend.js";
import { useStompConnection } from "../hooks/useStompConnection.js";
import { useToast } from "../context/ToastContext.jsx";

const Messages = () => {
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
      showToast("Could not load conversations.");
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
      showToast("Could not load this chat.");
    }
  };

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !myId || !selectedUser) return;
    const payload = { senderId: myId, receiverId: selectedUser.userId, content: text };
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

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Messages</h1>
        <p className="text-slate-400 text-sm sm:text-base">Your conversations</p>
      </motion.div>

      {myId == null && token && (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Sign out and sign in again if sending messages does not work.
        </div>
      )}

      {wsStatus === "connecting" && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300">
          Connecting live updates… <strong className="text-slate-200">Sending still works</strong> via the server.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 min-h-0">
        <div className={`lg:col-span-1 min-h-0 ${selectedUser ? "hidden lg:block" : "block"}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chats</h3>
            <button
              type="button"
              onClick={findMatches}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold touch-manipulation py-1 px-2"
            >
              {loading ? "…" : "Refresh"}
            </button>
          </div>

          <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 max-h-[40vh] lg:max-h-[600px] overflow-y-auto overscroll-contain">
            {matches.length === 0 ? (
              <p className="text-slate-500 text-sm p-4 text-center">No matches yet</p>
            ) : (
              matches.map((m, i) => (
                <motion.div
                  key={m.userId ?? i}
                  whileHover={{ x: 3 }}
                  onClick={() => openChat(m)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all touch-manipulation ${
                    selectedUser?.userId === m.userId
                      ? "bg-indigo-600/20 border border-indigo-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.fullName || "u")}`}
                    alt=""
                    className="w-10 h-10 rounded-full border border-indigo-500/20 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{m.fullName}</p>
                    <p className="text-[10px] text-slate-500" title={formatMatchPercent(m.distance).title}>
                      {formatMatchPercent(m.distance).label} match
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div
          className={`lg:col-span-2 min-h-0 flex flex-col ${
            selectedUser ? "flex" : "hidden lg:flex"
          }`}
        >
          {selectedUser ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col flex-1 min-h-[min(70dvh,600px)] lg:h-[600px] lg:min-h-0"
            >
              <div className="p-3 sm:p-4 border-b border-white/5 bg-white/5 shrink-0">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      className="lg:hidden p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 touch-manipulation shrink-0"
                      onClick={() => setSelectedUser(null)}
                      aria-label="Back to list"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-white truncate">{selectedUser.fullName}</h2>
                      <p className="text-xs text-slate-500" title={formatMatchPercent(selectedUser.distance).title}>
                        {formatMatchPercent(selectedUser.distance).label} vibe match
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="hidden lg:block p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 touch-manipulation shrink-0"
                    onClick={() => setSelectedUser(null)}
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 overscroll-contain min-h-0">
                {chatHistory.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center mt-4">Start a conversation</p>
                ) : (
                  chatHistory.map((msg, idx) => {
                    const isMe = msg.senderId != null && myId != null && Number(msg.senderId) === Number(myId);
                    return (
                      <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] px-3 sm:px-4 py-2 rounded-2xl break-words ${
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
                className="p-3 sm:p-4 bg-white/5 border-t border-white/5 flex gap-2 sm:gap-3 shrink-0"
                style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
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
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 p-3 rounded-xl outline-none focus:border-indigo-500 transition-all text-base sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  className="bg-indigo-600 p-3 rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 touch-manipulation shrink-0"
                  aria-label="Send"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl min-h-[280px] lg:h-[600px] flex items-center justify-center px-4">
              <p className="text-slate-500 text-center text-sm">Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;

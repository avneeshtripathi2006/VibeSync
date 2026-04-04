import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X } from "lucide-react";
import { getApiBase, getSockJsUrl } from "../config/env.js";

const Messages = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const chatEndRef = useRef(null);
  const stompRef = useRef(null);

  const token = localStorage.getItem("token");
  let myData = null;
  try {
    myData = token ? JSON.parse(atob(token.split(".")[1])) : null;
  } catch (e) {
    myData = null;
  }
  const myId = myData?.userId;

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
      setMatches(res.data);
    } catch (err) {
      console.error("Match fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    findMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  useEffect(() => {
    if (!myId) return;
    let cancelled = false;
    const timers = [];
    let attempts = 0;
    const maxAttempts = 4;

    const connectOnce = () => {
      if (cancelled || attempts >= maxAttempts) return;
      attempts += 1;
      try {
        if (stompRef.current?.connected) return;
        const url = getSockJsUrl();
        const socket = new SockJS(url);
        const client = Stomp.over(socket);
        client.debug = null;
        stompRef.current = client;
        client.connect(
          {},
          () => {
            if (cancelled || !myId) return;
            client.subscribe("/topic/messages/" + myId, (msg) => {
              try {
                const newMsg = JSON.parse(msg.body);
                setChatHistory((prev) => [...prev, newMsg]);
              } catch (_) {
                /* ignore */
              }
            });
          },
          () => {
            stompRef.current = null;
            if (!cancelled && attempts < maxAttempts) {
              const t = window.setTimeout(connectOnce, 700 * attempts);
              timers.push(t);
            }
          }
        );
      } catch {
        stompRef.current = null;
        if (!cancelled && attempts < maxAttempts) {
          const t = window.setTimeout(connectOnce, 700 * attempts);
          timers.push(t);
        }
      }
    };

    const t0 = window.setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(connectOnce));
    }, 0);
    timers.push(t0);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      try {
        stompRef.current?.disconnect?.();
      } catch (_) {
        /* ignore */
      }
      stompRef.current = null;
    };
  }, [myId]);

  const openChat = async (user) => {
    setSelectedUser(user);
    try {
      const res = await axios.get(`${getApiBase()}/api/chat/history/${user.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatHistory(res.data);
    } catch (err) {
      console.error("Failed to load chat", err);
    }
  };

  const handleSend = () => {
    const client = stompRef.current;
    if (!message.trim() || !client?.connected || !myId || !selectedUser) return;
    const msgObj = { senderId: myId, receiverId: selectedUser.userId, content: message };
    client.send("/app/chat.send", {}, JSON.stringify(msgObj));
    setMessage("");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
        <p className="text-slate-400">Your conversations</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 📋 LEFT: Conversations List */}
        <div className="lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chats</h3>
            <button
              onClick={findMatches}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
            >
              {loading ? "..." : "Refresh"}
            </button>
          </div>

          <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-4 max-h-[600px] overflow-y-auto">
            {matches.length === 0 ? (
              <p className="text-slate-500 text-sm p-4 text-center">No matches yet</p>
            ) : (
              matches.map((m, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 3 }}
                  onClick={() => openChat(m)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    selectedUser?.userId === m.userId
                      ? "bg-indigo-600/20 border border-indigo-500/30"
                      : "hover:bg-white/5"
                  }`}
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.fullName}`}
                    className="w-10 h-10 rounded-full border border-indigo-500/20"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{m.fullName}</p>
                    <p className="text-[10px] text-slate-500">{Math.round((1 - m.distance) * 100)}% Match</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* 💬 RIGHT: Chat Area */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[600px]"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/5 bg-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedUser.fullName}</h2>
                    <p className="text-xs text-slate-500">{Math.round((1 - selectedUser.distance) * 100)}% Vibe Match</p>
                  </div>
                  <X
                    className="cursor-pointer text-slate-500 hover:text-white"
                    onClick={() => setSelectedUser(null)}
                    size={20}
                  />
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full"
                  />
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatHistory.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center mt-4">Start a conversation</p>
                ) : (
                  chatHistory.map((msg, idx) => {
                    const isMe = msg.senderId === myId;
                    return (
                      <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] px-4 py-2 rounded-2xl ${
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

              {/* Input */}
              <div className="p-4 bg-white/5 border-t border-white/5 flex gap-3">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 bg-white/5 border border-white/10 p-3 rounded-xl outline-none focus:border-indigo-500 transition-all text-sm"
                />
                <button
                  onClick={handleSend}
                  className="bg-indigo-600 p-3 rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl h-[600px] flex items-center justify-center">
              <p className="text-slate-500">Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;

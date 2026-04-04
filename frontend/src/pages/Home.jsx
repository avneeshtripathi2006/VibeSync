import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, MessageCircle, X } from "lucide-react";
import { getApiBase, getSockJsUrl } from "../config/env.js";

const Matches = () => {
  // --- STATE & REFS ---
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
    console.error("Token parsing failed:", e);
    myData = null;
  }
  const myId = myData?.userId;

  console.log("Home component rendered", { token: !!token, myId, myData });

  const blurAmount = Math.max(0, 20 - chatHistory.length * 0.4);
  const progress = Math.min(100, (chatHistory.length / 50) * 100);

  // --- LOGIC ---
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => { scrollToBottom(); }, [chatHistory, selectedUser]);

  const findMatches = async () => {
    console.log("Finding matches...");
    setLoading(true);
    try {
      const res = await axios.get(`${getApiBase()}/api/profile/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Matches response:", res.data);
      setMatches(res.data);
    } catch (err) {
      console.error("Match fetch failed", err);
    }
    finally { setLoading(false); }
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

  const [posts, setPosts] = useState([]);

const fetchPosts = async () => {
    try {
      const res = await axios.get(`${getApiBase()}/api/posts/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
    } catch (err) {
      console.error("Posts fetch failed", err);
    }
};

useEffect(() => {
    fetchPosts(); // Load posts when Home opens
}, []);

const [postContent, setPostContent] = useState("");

const handlePostVibe = async () => {
  if (!postContent.trim()) return;

  try {
    const token = localStorage.getItem("token");
    await axios.post(`${getApiBase()}/api/posts/create`, postContent, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "text/plain" // Sending raw string from @RequestBody
      }
    });

    setPostContent(""); // Clear the box
    fetchPosts(); // 🔄 Refresh the feed automatically!
  } catch (err) {
    console.error("Vibe post failed", err);
    alert("Could not post your vibe. Try again!");
  }
};

  // --- UI RENDER ---
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {loading && (
        <div className="fixed top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg z-50">
          Loading matches...
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 📝 LEFT/CENTER: THE VIBE FEED (66% Width) */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111827]/50 border border-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-xl">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
              <div className="flex-1">
                <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Share your current frequency..." className="w-full bg-transparent border-none outline-none text-lg text-slate-200 placeholder:text-slate-600 resize-none h-20" />
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <Sparkles size={20} className="text-slate-500 hover:text-indigo-400 cursor-pointer" />
                  <button onClick={handlePostVibe} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2">
                    Post Vibe <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Replace dummy posts with this mapping */}
          {posts.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p>No posts yet.</p>
              <p className="text-sm">Share your first vibe!</p>
            </div>
          )}
{posts.map((post) => (
  <motion.div 
    key={post.id}
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-white/5 border border-white/5 p-6 rounded-[2rem] backdrop-blur-sm hover:border-white/10 transition-all"
  >
     <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400">
           {post.user.fullName.charAt(0)}
        </div>
        <div>
           <p className="font-bold text-sm text-white">{post.user.fullName}</p>
           <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
             {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </p>
        </div>
     </div>
     <p className="text-slate-300 leading-relaxed">{post.content}</p>
  </motion.div>
))}
        </div>

        {/* 🎯 RIGHT SIDEBAR: TRIBE SUGGESTIONS (34% Width) */}
        <div className="lg:col-span-4 space-y-6 sticky top-8 h-fit">
          <div className="flex justify-between items-center px-2">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Vibe Tribe</h3>
             <button onClick={findMatches} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">{loading ? "..." : "Refresh"}</button>
          </div>
          
          <div className="space-y-3">
            {matches.length === 0 && !loading && (
              <div className="text-center py-8 text-slate-500">
                <p>No matches found yet.</p>
                <p className="text-sm">Complete your profile to get better matches!</p>
              </div>
            )}
            {matches.map((m, i) => (
              <motion.div key={i} whileHover={{ x: 5 }} onClick={() => openChat(m)} className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.fullName}`} className="w-12 h-12 rounded-full bg-slate-800 border border-indigo-500/20" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">{m.fullName}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{Math.round((1 - m.distance) * 100)}% Match</p>
                </div>
                <MessageCircle size={18} className="text-slate-500 group-hover:text-indigo-400" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 💬 CHAT MODAL OVERLAY */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0f172a] border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-6 border-b border-white/5 bg-white/5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold tracking-tight transition-all duration-700" style={{ filter: `blur(${blurAmount}px)` }}>
                    {chatHistory.length >= 50 ? selectedUser.fullName : "Mysterious Vibe"}
                  </h2>
                  <X className="cursor-pointer text-slate-500 hover:text-white" onClick={() => setSelectedUser(null)} />
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full" />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 text-right italic">{chatHistory.length}/50 messages to reveal</p>
              </div>

              {/* 💬 Chat history */}
              <div className="p-6 bg-slate-900/20 overflow-y-auto max-h-[40vh] space-y-3">
                {chatHistory.length === 0 ? (
                  <p className="text-slate-400 text-sm">No messages yet. Say hi!</p>
                ) : (
                  chatHistory.map((msg, idx) => {
                    const isMe = msg.senderId === myId;
                    return (
                      <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${isMe ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-100"}`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className="text-[10px] text-white/70 mt-1 text-right">{new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-6 bg-white/5 flex gap-3">
                <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Type your message..." className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-all text-sm" />
                <button onClick={handleSend} className="bg-indigo-600 p-4 rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">
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
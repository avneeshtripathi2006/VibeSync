import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, ChevronLeft, UserPlus, Check, Clock, Loader2 } from "lucide-react";
import { getApiBase } from "../config/env.js";
import { getMyUserIdFromToken } from "../utils/jwt.js";
import { formatMatchPercent } from "../utils/matchPercent.js";
import { sendChatViaRest } from "../api/chatSend.js";
import { useStompConnection } from "../hooks/useStompConnection.js";
import { useToast } from "../context/ToastContext.jsx";
import UserProfileModal from "../components/UserProfileModal.jsx";

const Messages = () => {
  const CHAT_PAGE_SIZE = 30;
  const [matches, setMatches] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatOffset, setChatOffset] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [conversationMeta, setConversationMeta] = useState({}); // userId -> { unreadCount, lastMessageAt }
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [friendshipStatus, setFriendshipStatus] = useState({}); // Maps userId -> status
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [profileViewerUserId, setProfileViewerUserId] = useState(null);
  const chatScrollRef = useRef(null);
  const mainScrollTopRef = useRef(0);
  const selectedUserRef = useRef(null);
  const userInteractedWithChatScrollRef = useRef(false);
  const autoScrollAfterAppendRef = useRef(false);
  const showToast = useToast();

  const [authToken, setAuthToken] = useState(() => localStorage.getItem("token") || "");
  const cleanedToken = authToken.startsWith("Bearer ") ? authToken.slice(7).trim() : authToken.trim();
  const authHeaders = (() => {
    if (!cleanedToken) return {};
    return { Authorization: `Bearer ${cleanedToken}` };
  })();
  const myId = getMyUserIdFromToken(cleanedToken);
  useEffect(() => {
    const syncToken = () => setAuthToken(localStorage.getItem("token") || "");
    syncToken();
    window.addEventListener("storage", syncToken);
    window.addEventListener("vibesync-token", syncToken);
    return () => {
      window.removeEventListener("storage", syncToken);
      window.removeEventListener("vibesync-token", syncToken);
    };
  }, []);


  const { status: wsStatus, sendChat } = useStompConnection(myId, (body) => {
    if (!body || body.type === "READ_RECEIPT") {
      if (body?.type === "READ_RECEIPT" && Number(body.readBy) === Number(selectedUserRef.current?.userId)) {
        setChatHistory((prev) => prev.map((msg) => (
          Number(msg.senderId) === Number(myId) ? { ...msg, isRead: true } : msg
        )));
      }
      return;
    }

    const partnerId = Number(body.senderId) === Number(myId) ? Number(body.receiverId) : Number(body.senderId);
    const selectedId = Number(selectedUserRef.current?.userId);
    const incomingForOpenChat = selectedUserRef.current && selectedId === partnerId;

    setConversationMeta((prev) => {
      const current = prev[partnerId] || { unreadCount: 0, lastMessageAt: null };
      const incrementUnread = Number(body.senderId) !== Number(myId) && !incomingForOpenChat;
      return {
        ...prev,
        [partnerId]: {
          unreadCount: incrementUnread ? current.unreadCount + 1 : current.unreadCount,
          lastMessageAt: body.timestamp || body.createdAt || new Date().toISOString(),
        },
      };
    });

    if (incomingForOpenChat) {
      autoScrollAfterAppendRef.current = true;
      setChatHistory((prev) => [...prev, body]);
      if (Number(body.senderId) !== Number(myId) && authHeaders.Authorization) {
        axios.post(`${getApiBase()}/api/chat/mark-read/${partnerId}`, {}, { headers: authHeaders }).catch(() => {});
      }
    }

    // Sidebar unread badge is derived from conversationMeta (users with unread > 0).
  });

  const progress = Math.min(100, (chatHistory.length / 50) * 100);
  const canChat = selectedUser && (friendshipStatus[selectedUser.userId]?.canChat || false);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    const unreadUsers = Object.values(conversationMeta).filter((meta) => Number(meta?.unreadCount || 0) > 0).length;
    setTotalUnreadCount(unreadUsers);
  }, [conversationMeta]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("vibesync-unread-chats-updated", {
      detail: { unreadUsers: totalUnreadCount, unreadCount: totalUnreadCount },
    }));
  }, [totalUnreadCount]);

  const getAvatarUrl = (userObj, fallbackSeed) => {
    const seed = encodeURIComponent(userObj?.defaultAvatarSeed || fallbackSeed || "u");
    return userObj?.identityUnlocked && userObj?.profilePicUrl
      ? userObj.profilePicUrl
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  };

  const parseMessageDate = (rawTimestamp) => {
    if (!rawTimestamp) return new Date();
    if (typeof rawTimestamp === "string") {
      const hasTimezone = rawTimestamp.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(rawTimestamp);
      const normalized = hasTimezone ? rawTimestamp : `${rawTimestamp}Z`;
      const parsed = new Date(normalized);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    const fallback = new Date(rawTimestamp);
    return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
  };

  const formatMessageTimestamp = (rawTimestamp) => (
    parseMessageDate(rawTimestamp).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
  );

  const scrollToBottom = (behavior = "auto") => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  useLayoutEffect(() => {
    if (!autoScrollAfterAppendRef.current) return;
    autoScrollAfterAppendRef.current = false;
    scrollToBottom("smooth");
  }, [chatHistory.length]);

  useEffect(() => {
    if (!selectedUser) return;
    userInteractedWithChatScrollRef.current = false;
  }, [selectedUser]);

  const fetchFriends = async () => {
    if (!authHeaders.Authorization) return;
    setLoading(true);
    try {
      const res = await axios.get(`${getApiBase()}/api/friend-request/friends`, {
        headers: authHeaders,
      });
      setMatches(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Friends fetch failed", err);
      showToast("Could not load conversations.");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMeta = useCallback(async () => {
    if (!authHeaders.Authorization) return;
    try {
      const res = await axios.get(`${getApiBase()}/api/chat/conversations-meta`, { headers: authHeaders });
      const data = Array.isArray(res.data) ? res.data : [];
      const meta = {};
      data.forEach((row) => {
        const userId = Number(row.userId);
        const unreadCount = Number(row.unreadCount || 0);
        meta[userId] = {
          unreadCount,
          lastMessageAt: row.lastMessageAt || null,
        };
      });
      setConversationMeta(meta);
    } catch (err) {
      console.error("Conversation metadata fetch failed", err);
    }
  }, [authHeaders.Authorization]);

  const fetchPendingRequests = async () => {
    if (!authHeaders.Authorization) return;
    try {
      const res = await axios.get(`${getApiBase()}/api/friend-request/pending`, {
        headers: authHeaders,
      });
      setPendingRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch pending requests:", err);
    }
  };

  useEffect(() => {
    if (!authHeaders.Authorization) return;
    fetchFriends();
    fetchPendingRequests();
    fetchConversationMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, [authToken]);

  useEffect(() => {
    if (!authHeaders.Authorization) return;
    const intervalId = window.setInterval(() => {
      fetchConversationMeta();
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [authHeaders.Authorization, fetchConversationMeta]);

  const checkFriendshipStatus = async (userId) => {
    try {
      const res = await axios.get(`${getApiBase()}/api/friend-request/status/${userId}`, {
        headers: authHeaders,
      });
      setFriendshipStatus((prev) => ({
        ...prev,
        [userId]: res.data,
      }));
    } catch (err) {
      console.error("Failed to check friendship status:", err);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await axios.post(`${getApiBase()}/api/friend-request/send/${userId}`, {}, {
        headers: authHeaders,
      });
      showToast("Friend request sent!");
      checkFriendshipStatus(userId);
    } catch (err) {
      showToast(err.response?.data?.error || "Could not send friend request.");
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await axios.post(`${getApiBase()}/api/friend-request/${requestId}/accept`, {}, {
        headers: authHeaders,
      });
      showToast("Friend request accepted!");
      fetchPendingRequests();
      fetchFriends();
    } catch (err) {
      showToast("Could not accept request.");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await axios.post(`${getApiBase()}/api/friend-request/${requestId}/reject`, {}, {
        headers: authHeaders,
      });
      showToast("Friend request rejected.");
      fetchPendingRequests();
    } catch (err) {
      showToast("Could not reject request.");
    }
  };

  const loadChatHistory = useCallback(async (userId, offset, mode = "replace") => {
    if (!authHeaders.Authorization) return;

    if (mode === "replace") {
      setIsLoadingHistory(true);
    } else {
      setIsLoadingOlder(true);
    }

    const el = chatScrollRef.current;
    const prevHeight = el?.scrollHeight || 0;
    const prevTop = el?.scrollTop || 0;

    try {
      const res = await axios.get(`${getApiBase()}/api/chat/history/${userId}`, {
        headers: authHeaders,
        params: {
          limit: CHAT_PAGE_SIZE,
          offset,
        },
      });
      const batch = Array.isArray(res.data) ? res.data : [];
      setHasMoreHistory(batch.length === CHAT_PAGE_SIZE);
      setChatOffset(offset + batch.length);
      setChatHistory((prev) => (mode === "prepend" ? [...batch, ...prev] : batch));

      if (mode === "prepend") {
        requestAnimationFrame(() => {
          const node = chatScrollRef.current;
          if (!node) return;
          const nextHeight = node.scrollHeight;
          node.scrollTop = nextHeight - prevHeight + prevTop;
        });
      }
    } finally {
      if (mode === "replace") {
        setIsLoadingHistory(false);
      } else {
        setIsLoadingOlder(false);
      }
    }
  }, [authHeaders.Authorization]);

  const openChat = useCallback(async (user) => {
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainScrollTopRef.current = mainEl.scrollTop;
    }
    setSelectedUser(user);
    checkFriendshipStatus(user.userId);
    try {
      await loadChatHistory(user.userId, 0, "replace");
      requestAnimationFrame(() => {
        scrollToBottom("auto");
      });

      // Mark messages as read
      try {
        await axios.post(`${getApiBase()}/api/chat/mark-read/${user.userId}`, {}, {
          headers: authHeaders,
        });
        setConversationMeta((prev) => {
          const current = prev[user.userId] || { unreadCount: 0, lastMessageAt: null };
          const unreadDelta = current.unreadCount || 0;
          if (unreadDelta > 0) {
            setTotalUnreadCount((count) => Math.max(0, count - unreadDelta));
          }
          return {
            ...prev,
            [user.userId]: {
              ...current,
              unreadCount: 0,
            },
          };
        });
      } catch (e) {
        console.error("Failed to mark as read:", e);
      }
    } catch (err) {
      console.error("Failed to load chat", err);
      showToast("Could not load this chat.");
    }
  }, [showToast, loadChatHistory]);

  useLayoutEffect(() => {
    const mainEl = document.querySelector("main");
    if (!mainEl) return;
    mainEl.scrollTop = mainScrollTopRef.current;
  }, [selectedUser]);

  const openChatByUserId = useCallback(async (userId, fallbackProfile = null) => {
    if (!userId) return;
    const existing = matches.find((m) => Number(m.userId) === Number(userId));
    if (existing) {
      openChat(existing);
      return;
    }

    let fullName = fallbackProfile?.fullName || "Anonymous";
    if (!fallbackProfile && authHeaders.Authorization) {
      try {
        const profileRes = await axios.get(`${getApiBase()}/api/profile/user/${userId}`, {
          headers: authHeaders,
        });
        fullName = profileRes.data?.fullName || fullName;
      } catch {
        // Keep fallback name.
      }
    }

    openChat({
      userId,
      fullName,
      distance: null,
      identityUnlocked: !!fallbackProfile?.identityUnlocked,
      profilePicUrl: fallbackProfile?.profilePicUrl || null,
    });
  }, [matches, openChat, cleanedToken, authHeaders.Authorization]);

  useEffect(() => {
    const pendingUserId = localStorage.getItem("vibesync-open-chat-user-id");
    if (!pendingUserId) return;
    localStorage.removeItem("vibesync-open-chat-user-id");
    openChatByUserId(Number(pendingUserId));
  }, [openChatByUserId]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !myId || !selectedUser || !canChat) return;
    const payload = { senderId: myId, receiverId: selectedUser.userId, content: text };
    if (sendChat(payload)) {
      requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });
      setConversationMeta((prev) => ({
        ...prev,
        [selectedUser.userId]: {
          ...(prev[selectedUser.userId] || { unreadCount: 0 }),
          lastMessageAt: new Date().toISOString(),
          unreadCount: prev[selectedUser.userId]?.unreadCount || 0,
        },
      }));
      setMessage("");
      return;
    }
    try {
      const saved = await sendChatViaRest(getApiBase, cleanedToken, selectedUser.userId, text);
      autoScrollAfterAppendRef.current = true;
      setChatHistory((prev) => [...prev, saved]);
      setConversationMeta((prev) => ({
        ...prev,
        [selectedUser.userId]: {
          ...(prev[selectedUser.userId] || { unreadCount: 0 }),
          lastMessageAt: saved?.timestamp || saved?.createdAt || new Date().toISOString(),
          unreadCount: prev[selectedUser.userId]?.unreadCount || 0,
        },
      }));
      setMessage("");
    } catch (e) {
      console.error(e);
      showToast("Could not send message. Check your connection and try again.");
    }
  };

  const sortedMatches = [...matches].sort((a, b) => {
    const aMeta = conversationMeta[Number(a.userId)] || { lastMessageAt: null };
    const bMeta = conversationMeta[Number(b.userId)] || { lastMessageAt: null };
    const aTs = aMeta.lastMessageAt ? new Date(aMeta.lastMessageAt).getTime() : 0;
    const bTs = bMeta.lastMessageAt ? new Date(bMeta.lastMessageAt).getTime() : 0;
    if (aTs !== bTs) return bTs - aTs;
    return String(a.fullName || "").localeCompare(String(b.fullName || ""));
  });

  const handleChatScroll = useCallback(() => {
    const el = chatScrollRef.current;
    if (!el || !selectedUser || isLoadingOlder || !hasMoreHistory || isLoadingHistory) return;
    if (!userInteractedWithChatScrollRef.current) return;
    if (el.scrollTop > 80) return;
    loadChatHistory(selectedUser.userId, chatOffset, "prepend").catch(() => {
      showToast("Could not load older messages.");
    });
  }, [selectedUser, isLoadingOlder, hasMoreHistory, isLoadingHistory, loadChatHistory, chatOffset, showToast]);

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Messages</h1>
        <p className="text-slate-400 text-sm sm:text-base">Your conversations</p>
      </motion.div>

      {myId == null && authToken && (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Sign out and sign in again if sending messages does not work.
        </div>
      )}

      {wsStatus === "connecting" && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300">
          Connecting live updates… <strong className="text-slate-200">Sending still works</strong> via the server.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-[calc(100vh-180px)] lg:h-auto lg:min-h-0">
        <div className={`lg:col-span-1 min-h-0 flex flex-col ${selectedUser ? "hidden lg:flex" : "flex"}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chats</h3>
            <button
              type="button"
              onClick={fetchFriends}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold touch-manipulation py-1 px-2"
            >
              {loading ? "…" : "Refresh"}
            </button>
          </div>

          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-3 sm:p-4"
            >
              <button
                onClick={() => setShowPendingRequests(!showPendingRequests)}
                className="flex items-center gap-2 w-full text-sm font-bold text-yellow-200 hover:text-yellow-100 transition-colors"
              >
                <Clock size={16} /> {pendingRequests.length} pending friend request{pendingRequests.length !== 1 ? 's' : ''}
              </button>
              <AnimatePresence>
                {showPendingRequests && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2"
                  >
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(req.sender?.fullName || 'u')}`}
                          alt=""
                          className="w-8 h-8 rounded-full shrink-0"
                        />
                        <span className="flex-1 text-xs truncate">{req.sender?.fullName}</span>
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          className="p-1 hover:bg-green-500/20 rounded text-green-400 text-xs font-bold"
                          title="Accept"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="p-1 hover:bg-red-500/20 rounded text-red-400 text-xs font-bold"
                          title="Reject"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 flex-1 overflow-y-auto overscroll-none scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
            {sortedMatches.length === 0 ? (
              <p className="text-slate-500 text-sm p-4 text-center">No friends yet</p>
            ) : (
              sortedMatches.map((m, i) => {
                const unread = Number(conversationMeta[Number(m.userId)]?.unreadCount || 0);
                return (
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
                  <button
                    type="button"
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileViewerUserId(m.userId);
                    }}
                  >
                    <img
                      src={getAvatarUrl(m, m.userId)}
                      alt=""
                      className="w-10 h-10 rounded-full border border-indigo-500/20 shrink-0 object-cover"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileViewerUserId(m.userId);
                      }}
                      className="font-semibold text-sm text-white truncate hover:text-indigo-300"
                    >
                      {m.fullName || "Anonymous"}
                    </button>
                    <p className="text-[10px] text-slate-500">{m.identityUnlocked ? "Friend" : "Chat only"}</p>
                  </div>
                  {unread > 0 && (
                    <span className="ml-2 inline-flex min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold items-center justify-center">
                      {Math.min(unread, 99)}
                    </span>
                  )}
                </motion.div>
              );})
            )}
          </div>
        </div>

        <div
          className={`lg:col-span-2 min-h-0 flex flex-col h-full ${
            selectedUser ? "flex" : "hidden lg:flex"
          }`}
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          {selectedUser ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col flex-1 w-full h-full"
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
                      <button
                        type="button"
                        onClick={() => setProfileViewerUserId(selectedUser.userId)}
                        className="text-base sm:text-lg font-bold text-white truncate hover:text-indigo-300"
                      >
                        {selectedUser.fullName}
                      </button>
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
                    className="bg-linear-to-r from-indigo-500 to-pink-500 h-full"
                  />
                </div>
              </div>

              <div
                onWheel={() => {
                  userInteractedWithChatScrollRef.current = true;
                }}
                onTouchMove={() => {
                  userInteractedWithChatScrollRef.current = true;
                }}
                onScroll={handleChatScroll}
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 overscroll-none min-h-0 scroll-smooth"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {isLoadingOlder && (
                  <div className="flex items-center justify-center py-2 text-xs text-slate-400 gap-2">
                    <Loader2 size={12} className="animate-spin" /> Loading older messages...
                  </div>
                )}
                {!canChat ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                    {friendshipStatus[selectedUser.userId]?.status === "PENDING" ? (
                      <>
                        <Clock size={40} className="text-yellow-400" />
                        <p className="text-slate-300 text-sm font-semibold">Friend request pending</p>
                        <p className="text-slate-500 text-xs">Waiting for them to accept your request</p>
                      </>
                    ) : (
                      <>
                        <UserPlus size={40} className="text-indigo-400" />
                        <p className="text-slate-300 text-sm font-semibold">Send a friend request to chat</p>
                        <button
                          onClick={() => handleSendFriendRequest(selectedUser.userId)}
                          className="mt-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all flex items-center gap-2"
                        >
                          <UserPlus size={16} /> Send Request
                        </button>
                      </>
                    )}
                  </div>
                ) : isLoadingHistory ? (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm gap-2">
                    <Loader2 size={16} className="animate-spin" /> Loading messages...
                  </div>
                ) : chatHistory.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center mt-4">Start a conversation</p>
                ) : (
                  chatHistory.map((msg, idx) => {
                    const isMe = msg.senderId != null && myId != null && Number(msg.senderId) === Number(myId);
                    const timestamp = formatMessageTimestamp(msg.timestamp || msg.createdAt || Date.now());
                    return (
                      <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] px-3 sm:px-4 py-2 rounded-2xl wrap-break-word ${
                            isMe ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-100"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <div className="flex items-center justify-between gap-2 mt-1 text-[10px] text-white/70">
                            <span>{timestamp}</span>
                            {isMe && msg.isRead && <Check size={12} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div
                className="p-3 sm:p-4 bg-white/5 border-t border-white/5 flex gap-2 sm:gap-3 shrink-0"
                style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
              >
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && canChat) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={!canChat}
                  placeholder={canChat ? "Type your message…" : "Accept friend request to message"}
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 p-3 rounded-xl outline-none focus:border-indigo-500 transition-all text-base sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canChat}
                  className="bg-indigo-600 p-3 rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 touch-manipulation shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl min-h-70 lg:h-auto flex items-center justify-center px-4 flex-1">
              <p className="text-slate-500 text-center text-sm">Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>

      <UserProfileModal
        open={!!profileViewerUserId}
        userId={profileViewerUserId}
        token={authToken}
        onClose={() => setProfileViewerUserId(null)}
        onMessage={(uid, profile) => openChatByUserId(uid, profile)}
      />
    </div>
  );
};

export default Messages;

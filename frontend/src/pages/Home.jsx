import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, MessageCircle, X, Music, Heart, Share2, MoreHorizontal, Loader2, Wifi, WifiOff, UserPlus, Check, Play, Bell, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { getApiBase, API_TIMEOUT_MS } from "../config/env.js";
import { getMyUserIdFromToken } from "../utils/jwt.js";
import { formatMatchPercent } from "../utils/matchPercent.js";
import { sendChatViaRest } from "../api/chatSend.js";
import { useStompConnection } from "../hooks/useStompConnection.js";
import { useToast } from "../context/ToastContext.jsx";
import UserProfileModal from "../components/UserProfileModal.jsx";

const Home = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileViewerUserId, setProfileViewerUserId] = useState(null);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [friendRequestStatus, setFriendRequestStatus] = useState({}); // Maps userId -> status
  const chatEndRef = useRef(null);
  const showToast = useToast();

  const token = localStorage.getItem("token");
  const myId = getMyUserIdFromToken(token);

  const { status: wsStatus, sendChat } = useStompConnection(myId, (body) => {
    setChatHistory((prev) => [...prev, body]);
  });

  const blurAmount = Math.max(0, 20 - chatHistory.length * 0.4);
  const progress = Math.min(100, (chatHistory.length / 50) * 100);

  const getAvatarUrl = (userObj, fallbackSeed) => {
    const seed = encodeURIComponent(userObj?.defaultAvatarSeed || fallbackSeed || "u");
    return userObj?.identityUnlocked && userObj?.profilePicUrl
      ? userObj.profilePicUrl
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  };

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, selectedUser]);

  const [postContent, setPostContent] = useState("");
  const [selectedMusicUri, setSelectedMusicUri] = useState("");
  const [selectedMusicTitle, setSelectedMusicTitle] = useState("");
  const [selectedMusicArtist, setSelectedMusicArtist] = useState("");
  const [selectedMusicPreview, setSelectedMusicPreview] = useState("");
  const [selectedMusicAlbumCover, setSelectedMusicAlbumCover] = useState("");
  const [selectedFullTrack, setSelectedFullTrack] = useState(null);
  const [selectedPreviewTrack, setSelectedPreviewTrack] = useState(null);
  const [selectedMusicMode, setSelectedMusicMode] = useState("preview");
  const [showMusicSearch, setShowMusicSearch] = useState(false);
  const [musicQuery, setMusicQuery] = useState("");
  const [musicResults, setMusicResults] = useState([]);
  const [appleResults, setAppleResults] = useState([]);
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [musicLoading, setMusicLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (selectedMusicMode === "preview") {
      setSelectedMusicUri("");
      setSelectedFullTrack(null);
      setYoutubeResults([]);
      const previewSource = selectedPreviewTrack;
      setSelectedMusicPreview(previewSource?.preview || "");
      setSelectedMusicTitle(previewSource?.name || "");
      setSelectedMusicArtist(previewSource?.artist || "");
      setSelectedMusicAlbumCover(previewSource?.albumCover || "");
    } else if (selectedMusicMode === "full") {
      setSelectedMusicPreview("");
      setSelectedPreviewTrack(null);
      setAppleResults([]);
      const fullSource = selectedFullTrack;
      setSelectedMusicUri(fullSource?.uri || "");
      setSelectedMusicTitle(fullSource?.name || "");
      setSelectedMusicArtist(fullSource?.artist || "");
      setSelectedMusicAlbumCover(fullSource?.albumCover || "");
    }
  }, [selectedMusicMode]);

  const findMatches = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${getApiBase()}/api/profile/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const matchData = Array.isArray(res.data) ? res.data : [];
      setMatches(matchData);
      const userIds = Array.from(new Set(matchData.map((m) => m.userId).filter(Boolean)));
      await Promise.all(userIds.map((id) => checkFriendStatus(id)));
    } catch (err) {
      console.error("Match fetch failed", err);
      showToast("Could not load matches. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const checkFriendStatus = async (userId) => {
    try {
      const res = await axios.get(`${getApiBase()}/api/friend-request/status/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriendRequestStatus((prev) => ({
        ...prev,
        [userId]: res.data.status,
      }));
    } catch (err) {
      console.error("Failed to check friend status:", err);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await axios.post(`${getApiBase()}/api/friend-request/send/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Friend request sent!");
      checkFriendStatus(userId);
    } catch (err) {
      showToast(err.response?.data?.error || "Could not send friend request.");
    }
  };

  useEffect(() => {
    findMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  // Auto-search Music when query changes (DISABLED - use manual search instead)
  useEffect(() => {
    if (musicQuery.trim() && showMusicSearch) {
      const timeoutId = setTimeout(() => {
        searchMusic(musicQuery);
      }, 800); // 800ms debounce
      return () => clearTimeout(timeoutId);
    } else {
      setMusicResults([]);
    }
  }, [musicQuery, showMusicSearch]);

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

  const handleProfileMessage = (userId, profile = null) => {
    if (!userId) return;
    const existing = matches.find((m) => Number(m.userId) === Number(userId));
    if (existing) {
      openChat(existing);
      return;
    }

    openChat({
      userId,
      fullName: profile?.fullName || "Anonymous",
      distance: null,
      identityUnlocked: !!profile?.identityUnlocked,
      profilePicUrl: profile?.profilePicUrl || null,
      defaultAvatarSeed: String(userId),
    });
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
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(null);
  const [postsOffset, setPostsOffset] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isFetchingMorePosts, setIsFetchingMorePosts] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastRefresh, setLastRefresh] = useState(null);
  const POSTS_BATCH_SIZE = 5;

  // Post interaction states
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [postLikes, setPostLikes] = useState(new Map());
  const [expandedPosts, setExpandedPosts] = useState(new Set());

  // Comment states (matching Explore functionality)
  const [openComments, setOpenComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [comments, setComments] = useState({});
  const [isRightRailOpen, setIsRightRailOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => window.innerWidth < 768);
  const quickAudioMapRef = useRef(new Map());
  const [currentlyPlayingPostId, setCurrentlyPlayingPostId] = useState(null);

  // Pull to refresh state - MISSING DECLARATIONS FIXED
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullThreshold = 80;

  const fetchPosts = useCallback(async ({ reset = false, showLoading = true } = {}) => {
    const requestOffset = reset ? 0 : postsOffset;

    if (showLoading) setPostsLoading(true);
    if (reset) {
      setPostsError(null);
      setHasMorePosts(true);
    }

    try {
      const res = await axios.get(`${getApiBase()}/api/posts/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: API_TIMEOUT_MS,
        params: {
          limit: POSTS_BATCH_SIZE,
          offset: requestOffset,
        },
      });

      const postsData = Array.isArray(res.data) ? res.data : [];
      setPosts((prev) => (reset ? postsData : [...prev, ...postsData]));
      setPostsOffset(requestOffset + postsData.length);
      setHasMorePosts(postsData.length === POSTS_BATCH_SIZE);
      setLastRefresh(new Date());

      setPostLikes((prev) => {
        const likesMap = reset ? new Map() : new Map(prev);
        postsData.forEach((post) => {
          likesMap.set(normalizePostId(post.id), post.likeCount || 0);
        });
        return likesMap;
      });

      setLikedPosts((prev) => {
        const next = reset ? new Set() : new Set(prev);
        postsData.forEach((post) => {
          const id = normalizePostId(post.id);
          if (post.likedByCurrentUser) {
            next.add(id);
          } else {
            next.delete(id);
          }
        });
        return next;
      });
    } catch (err) {
      console.error("Posts fetch failed", err);
      setPostsError(err.message || "Failed to load posts");
      showToast("Could not load the feed. Check your connection.");
    } finally {
      if (showLoading) {
        setPostsLoading(false);
      }
    }
  }, [token, showToast, postsOffset]);

  const loadMorePosts = useCallback(() => {
    if (postsLoading || isFetchingMorePosts || !hasMorePosts || !isOnline) return;
    setIsFetchingMorePosts(true);
    fetchPosts({ reset: false, showLoading: false }).finally(() => {
      setIsFetchingMorePosts(false);
    });
  }, [postsLoading, isFetchingMorePosts, hasMorePosts, isOnline, fetchPosts]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Back online!", "success");
      fetchPosts({ reset: true, showLoading: false });
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast("You're offline. Some features may not work.", "warning");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchPosts, showToast]);

  useEffect(() => {
    fetchPosts({ reset: true, showLoading: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  useEffect(() => {
    const root = document.querySelector("main");
    const target = root || window;
    const onScroll = () => {
      if (root) {
        const nearBottom = root.scrollTop + root.clientHeight >= root.scrollHeight - 240;
        if (nearBottom) {
          loadMorePosts();
        }
        return;
      }
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 240;
      if (nearBottom) {
        loadMorePosts();
      }
    };

    target.addEventListener("scroll", onScroll);
    return () => target.removeEventListener("scroll", onScroll);
  }, [loadMorePosts]);

  // Character count and validation
  const maxChars = 500;
  const charCount = postContent.length;
  const isOverLimit = charCount > maxChars;
  const canPost = postContent.trim().length > 0 && !isOverLimit && !isPosting && isOnline;

  // Pull to refresh variables
  const [touchStartY, setTouchStartY] = useState(0);

  useEffect(() => {
    const onResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleTouchStart = (e) => {
    if (window.innerWidth >= 1024) return; // Only on mobile
    setTouchStartY(e.touches[0].clientY);
    setPullDistance(0);
  };

  const handleTouchMove = (e) => {
    if (window.innerWidth >= 1024 || !isOnline) return;
    const touch = e.touches[0];
    const distance = Math.max(0, touch.clientY - touchStartY);
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance * 0.5, pullThreshold * 2));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      fetchPosts({ reset: true, showLoading: false }).finally(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
  };

  const [recentActivity, setRecentActivity] = useState([]);
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);
  const ACTIVITY_SEEN_KEY = "vibesync-activity-seen-at";

  const formatActivityTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const computeUnreadActivityCount = useCallback((activities) => {
    const seenAtRaw = localStorage.getItem(ACTIVITY_SEEN_KEY);
    const seenAt = seenAtRaw ? new Date(seenAtRaw).getTime() : 0;
    if (!Array.isArray(activities)) return 0;
    return activities.reduce((count, item) => {
      const ts = new Date(item.createdAt || item.time || 0).getTime();
      if (Number.isFinite(ts) && ts > seenAt) return count + 1;
      return count;
    }, 0);
  }, []);

  const markNotificationsRead = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(ACTIVITY_SEEN_KEY, now);
    setUnreadActivityCount(0);
  }, []);

  const fetchActivity = useCallback(async () => {
    if (!token) {
      setRecentActivity([]);
      return;
    }

    try {
      const res = await axios.get(`${getApiBase()}/api/posts/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const activityData = Array.isArray(res.data) ? res.data : [];
      setRecentActivity(activityData);
      setUnreadActivityCount(computeUnreadActivityCount(activityData));
    } catch (err) {
      console.error("Activity fetch failed", err);
      setRecentActivity([]);
      setUnreadActivityCount(0);
    }
  }, [token, computeUnreadActivityCount]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleConfirmRequest = async (requestId) => {
    if (!token || !requestId) return;
    try {
      await axios.post(`${getApiBase()}/api/friend-request/${requestId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Connection confirmed!");
      fetchActivity();
      findMatches();
    } catch (err) {
      console.error("Failed to confirm friend request", err);
      showToast(err.response?.data?.error || "Could not confirm connection.");
    }
  };

  // Comment functions (matching Explore page)
  const fetchComments = async (postId) => {
    try {
      const res = await axios.get(`${getApiBase()}/api/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments((prev) => ({
        ...prev,
        [postId]: Array.isArray(res.data) ? res.data : [],
      }));
    } catch (err) {
      console.error("Failed to fetch comments", err);
      showToast("Could not load comments.");
    }
  };

  const toggleCommentBox = async (postId) => {
    const isOpen = !!openComments[postId];
    if (!isOpen && !comments[postId]) {
      await fetchComments(postId);
    }
    setOpenComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleCommentChange = (postId, value) => {
    setCommentDrafts((prev) => ({
      ...prev,
      [postId]: value,
    }));
  };

  const submitComment = async (postId) => {
    const text = String(commentDrafts[postId] || "").trim();
    if (!text) return;

    try {
      const res = await axios.post(
        `${getApiBase()}/api/posts/${postId}/comment`,
        { content: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments((prev) => ({
        ...prev,
        [postId]: [
          ...(prev[postId] || []),
          res.data,
        ],
      }));
      setCommentDrafts((prev) => ({
        ...prev,
        [postId]: "",
      }));
      setOpenComments((prev) => ({
        ...prev,
        [postId]: true,
      }));
    } catch (err) {
      console.error("Comment submit failed", err);
      showToast("Could not add comment. Please try again.");
    }
  };

  const handlePostVibe = async () => {
    if (!canPost) return;

    setIsPosting(true);
    try {
      const currentToken = localStorage.getItem("token");
      
      let requestBody = {
        content: postContent.trim(),
        musicUri: selectedMusicUri || null,
        musicTitle: selectedMusicTitle || null,
        musicArtist: selectedMusicArtist || null,
        musicPreview: selectedMusicPreview || null,
        musicAlbumCover: selectedMusicAlbumCover || null,
      };
      
      if (selectedMusicMode === "both" && selectedFullTrack && selectedPreviewTrack) {
        requestBody = {
          content: postContent.trim(),
          musicUri: selectedFullTrack.uri || null,
          musicTitle: selectedFullTrack.name || selectedMusicTitle || null,
          musicArtist: selectedFullTrack.artist || selectedMusicArtist || null,
          musicPreview: selectedPreviewTrack.preview || selectedPreviewTrack.uri || null,
          musicAlbumCover: selectedFullTrack.albumCover || selectedMusicAlbumCover || null,
        };
      }

      await axios.post(`${getApiBase()}/api/posts/create`, requestBody, {
        headers: {
          "Content-Type": "application/json",
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
        timeout: API_TIMEOUT_MS,
      });

      setPostContent("");
      setSelectedMusicUri("");
      setSelectedMusicTitle("");
      setSelectedMusicArtist("");
      setSelectedMusicPreview("");
      setSelectedMusicAlbumCover("");
      setSelectedFullTrack(null);
      setSelectedPreviewTrack(null);
      fetchPosts({ reset: true, showLoading: false });
      showToast("Vibe posted! 🎵", "success");

    } catch (err) {
      console.error("Vibe post failed", err);
      const errorMessage = err.response?.data?.error || "Could not post your vibe. Try again.";
      showToast(errorMessage);
    } finally {
      setIsPosting(false);
    }
  };

  const searchMusic = async (query) => {
    if (!query.trim()) return;
    setMusicLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No JWT token - using fallback song entry');
        setMusicResults([]);
        setAppleResults([]);
        setYoutubeResults([]);
        return;
      }

      const formatTracks = (tracks, isYouTubeSource) => {
        return Array.isArray(tracks) ? tracks.map(track => ({
          id: track.trackId || track.id,
          name: track.trackName || track.name || "Unknown title",
          artist: track.artistName || track.artist || "Unknown artist",
          uri: track.trackViewUrl || track.previewUrl || track.uri || "",
          albumCover: track.artworkUrl100 || track.albumCover || "",
          preview: track.previewUrl || track.preview || "",
          fullUrl: track.trackViewUrl || track.fullUrl || track.uri || "",
          isYouTube: isYouTubeSource || (track.trackViewUrl && track.trackViewUrl.includes("youtube.com")),
        })) : [];
      };

      if (selectedMusicMode === "both") {
        const [youtubeRes, appleRes] = await Promise.all([
          fetch(`${getApiBase()}/api/music/search?query=${encodeURIComponent(query)}&source=youtube`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${getApiBase()}/api/music/search?query=${encodeURIComponent(query)}&source=apple`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        const [youtubeData, appleData] = await Promise.all([youtubeRes.json(), appleRes.json()]);

        if (!youtubeRes.ok || !appleRes.ok) {
          const errorMessage = youtubeData.error || appleData.error || "Music search unavailable. Check backend connection.";
          console.error('Music API unavailable:', errorMessage);
          showToast(errorMessage, "warning");
          setMusicResults([]);
          setAppleResults([]);
          setYoutubeResults([]);
          return;
        }

        setYoutubeResults(formatTracks(youtubeData.results || [], true));
        setAppleResults(formatTracks(appleData.results || [], false));
        setMusicResults([]);
        return;
      }

      const source = selectedMusicMode === "preview" ? "apple" : "youtube";
      const response = await fetch(`${getApiBase()}/api/music/search?query=${encodeURIComponent(query)}&source=${source}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Music API unavailable:', data.error || response.statusText);
        showToast(data.error || "Music search unavailable. Check backend connection.", "warning");
        setMusicResults([]);
        setAppleResults([]);
        setYoutubeResults([]);
        return;
      }

      const formatted = formatTracks(data.results || [], source === "youtube");
      if (source === "apple") {
        setAppleResults(formatted);
        setYoutubeResults([]);
      } else {
        setYoutubeResults(formatted);
        setAppleResults([]);
      }
      setMusicResults(formatted);
    } catch (error) {
      console.error('Music search not available', error);
      showToast("Network error while contacting music search.", "warning");
      setMusicResults([]);
      setAppleResults([]);
      setYoutubeResults([]);
    } finally {
      setMusicLoading(false);
    }
  };

  const selectMusicTrack = (track, source = "youtube") => {
    const title = track.name || track.trackName || "";
    const artist = track.artist || track.artistName || "";
    const previewUrl = track.preview || track.previewUrl || "";
    const fullUrl = track.fullUrl || track.trackViewUrl || track.uri || "";
    const albumCover = track.albumCover || track.artworkUrl100 || "";

    const nextFullTrack = source === "youtube" ? {
      uri: fullUrl,
      name: title,
      artist,
      albumCover,
      preview: previewUrl,
    } : selectedFullTrack;

    const nextPreviewTrack = source === "apple" ? {
      preview: previewUrl,
      uri: fullUrl,
      name: title,
      artist,
      albumCover,
    } : selectedPreviewTrack;

    const primaryDisplayTrack = nextFullTrack || nextPreviewTrack;
    const shouldCloseSearch = selectedMusicMode !== "both" || (nextFullTrack && nextPreviewTrack);

    if (selectedMusicMode === "preview") {
      if (!previewUrl) {
        showToast("Preview clip unavailable for this track. Please select another song.", "warning");
        return;
      }
      setSelectedPreviewTrack(nextPreviewTrack);
      setSelectedMusicUri("");
      setSelectedMusicPreview(previewUrl);
      setSelectedMusicTitle(title);
      setSelectedMusicArtist(artist);
      setSelectedMusicAlbumCover(albumCover);
      setShowMusicSearch(false);
    } else if (selectedMusicMode === "full") {
      if (!fullUrl) {
        showToast("Full song URL unavailable for this track.", "warning");
        return;
      }
      setSelectedFullTrack(nextFullTrack);
      setSelectedMusicUri(fullUrl);
      setSelectedMusicPreview("");
      setSelectedMusicTitle(title);
      setSelectedMusicArtist(artist);
      setSelectedMusicAlbumCover(albumCover);
      setShowMusicSearch(false);
    } else {
      if (source === "apple") {
        if (!previewUrl && !fullUrl) {
          showToast("Unable to attach this Apple track. Please select another song.", "warning");
          return;
        }
        setSelectedPreviewTrack(nextPreviewTrack);
      }
      if (source === "youtube") {
        if (!fullUrl) {
          showToast("YouTube song URL unavailable for this track.", "warning");
          return;
        }
        setSelectedFullTrack(nextFullTrack);
      }

      setSelectedMusicPreview(nextPreviewTrack?.preview || nextPreviewTrack?.uri || "");
      setSelectedMusicUri(nextFullTrack?.uri || "");
      setSelectedMusicTitle(primaryDisplayTrack?.name || "");
      setSelectedMusicArtist(primaryDisplayTrack?.artist || "");
      setSelectedMusicAlbumCover(primaryDisplayTrack?.albumCover || "");
      if (shouldCloseSearch) {
        setShowMusicSearch(false);
        setMusicQuery("");
        setMusicResults([]);
        setAppleResults([]);
        setYoutubeResults([]);
      }
      return;
    }

    setMusicQuery("");
    setMusicResults([]);
    setAppleResults([]);
    setYoutubeResults([]);
  };

  const normalizeMusicField = (value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const getSpotifyTrackId = (uri) => {
    if (!uri) return null;
    const spotifyUriMatch = uri.match(/spotify:track:([A-Za-z0-9]+)/);
    if (spotifyUriMatch) return spotifyUriMatch[1];
    const spotifyUrlMatch = uri.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/);
    return spotifyUrlMatch ? spotifyUrlMatch[1] : null;
  };

  const isYouTubeLink = (uri) => {
    return typeof uri === "string" && /(youtube\.com|youtu\.be)/i.test(uri);
  };

  const getMusicLinkLabel = (uri) => {
    if (!uri) return "Open song";
    if (uri.includes("music.apple.com")) return "Open in Apple Music";
    if (isYouTubeLink(uri)) return "Watch on YouTube";
    if (uri.includes("spotify.com")) return "Open in Spotify";
    return "Open song";
  };

  const normalizePostId = (postId) => String(postId);

  const handleQuickPlay = (postId, previewUrl, fallbackUrl) => {
    if (!previewUrl) {
      if (fallbackUrl) {
        window.open(fallbackUrl, "_blank", "noopener,noreferrer");
        return;
      }
      showToast("No playable preview available for this post.");
      return;
    }

    let audio = quickAudioMapRef.current.get(postId);
    if (audio && audio.src !== previewUrl) {
      try {
        audio.pause();
      } catch {
        // ignore
      }
      quickAudioMapRef.current.delete(postId);
      audio = null;
    }
    if (!audio) {
      audio = new Audio(previewUrl);
      audio.onended = () => {
        audio.currentTime = 0;
        setCurrentlyPlayingPostId((prev) => (prev === postId ? null : prev));
      };
      quickAudioMapRef.current.set(postId, audio);
    }

    if (currentlyPlayingPostId === postId && !audio.paused) {
      audio.pause();
      setCurrentlyPlayingPostId(null);
      return;
    }

    quickAudioMapRef.current.forEach((otherAudio, key) => {
      if (key !== postId && !otherAudio.paused) {
        otherAudio.pause();
      }
    });

    if (Number.isFinite(audio.duration) && audio.duration > 0 && audio.currentTime >= audio.duration - 0.1) {
      audio.currentTime = 0;
    }
    audio.play().then(() => {
      setCurrentlyPlayingPostId(postId);
    }).catch(() => {
      if (fallbackUrl) {
        window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      } else {
        showToast("No playable preview available for this post.");
      }
    });
  };

  useEffect(() => {
    return () => {
      quickAudioMapRef.current.forEach((audio) => {
        try {
          audio.pause();
        } catch {
          // ignore
        }
      });
      quickAudioMapRef.current.clear();
    };
  }, []);

  // Post interaction functions
  const handleLikePost = async (postId) => {
    if (!token || !isOnline) return;
    const normalizedId = normalizePostId(postId);

    try {
      const res = await axios.post(`${getApiBase()}/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const nextLiked = !!res.data?.liked;
      const nextLikeCount = Number(res.data?.likeCount || 0);
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (nextLiked) next.add(normalizedId);
        else next.delete(normalizedId);
        return next;
      });
      setPostLikes((prev) => new Map(prev).set(normalizedId, nextLikeCount));
      setPosts((prev) => prev.map((post) => (
        normalizePostId(post.id) === normalizedId
          ? { ...post, likeCount: nextLikeCount, likedByCurrentUser: nextLiked }
          : post
      )));

      window.dispatchEvent(new CustomEvent("vibesync-post-like-updated", {
        detail: {
          postId: normalizedId,
          liked: nextLiked,
          likeCount: nextLikeCount,
        },
      }));
    } catch (err) {
      console.error("Like failed", err);
      showToast("Could not update like. Try again.");
    }
  };

  useEffect(() => {
    const onLikeUpdated = (event) => {
      const detail = event?.detail || {};
      const normalizedId = normalizePostId(detail.postId);
      const liked = !!detail.liked;
      const likeCount = Number(detail.likeCount || 0);

      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (liked) next.add(normalizedId);
        else next.delete(normalizedId);
        return next;
      });
      setPostLikes((prev) => new Map(prev).set(normalizedId, likeCount));
      setPosts((prev) => prev.map((post) => (
        normalizePostId(post.id) === normalizedId
          ? { ...post, likeCount, likedByCurrentUser: liked }
          : post
      )));
    };

    window.addEventListener("vibesync-post-like-updated", onLikeUpdated);
    return () => window.removeEventListener("vibesync-post-like-updated", onLikeUpdated);
  }, []);

  const handleSharePost = async (post) => {
    const shareData = {
      title: `Vibe from ${post.user?.fullName || 'VibeSync user'}`,
      text: post.content,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast("Post shared!", "success");
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.title}: ${shareData.text} ${shareData.url}`);
      showToast("Link copied to clipboard!", "success");
    }
  };

  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });
  };

  return (
    <div
      className="max-w-7xl mx-auto relative pb-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 bg-indigo-600 text-white text-center py-2 text-sm font-medium"
          style={{ transform: `translateY(${Math.max(-100, pullDistance - 100)}%)` }}
        >
          {pullDistance > pullThreshold ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              {isRefreshing ? "Refreshing..." : "Release to refresh"}
            </div>
          ) : (
            "Pull to refresh"
          )}
        </motion.div>
      )}
      {/* Connection Status */}
      {!isOnline && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
        >
          <WifiOff size={16} className="inline mr-2" />
          You're offline
        </motion.div>
      )}

      {myId == null && token && (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Your session token could not be read. Try logging out and signing in again so chat works.
        </div>
      )}

      {postsLoading && (
        <div className="fixed top-[max(1rem,env(safe-area-inset-top))] right-3 z-50 bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-lg">
          Loading vibes…
        </div>
      )}

      {wsStatus === "connecting" && (
        <div className="mb-4 rounded-2xl border border-(--border) bg-(--surface-soft) px-4 py-2 text-xs text-(--text-secondary)">
          Connecting live updates… You can still <strong className="text-slate-200">send messages</strong> — they
          are delivered through the server.
        </div>
      )}

      <div className="mb-4 flex justify-end items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const next = !showNotifications;
            setShowNotifications(next);
            if (next) {
              markNotificationsRead();
            }
          }}
          className="relative rounded-full border border-(--border) bg-(--surface-soft) p-2 text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-alt) transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadActivityCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {Math.min(unreadActivityCount, 9)}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setIsRightRailOpen(true)}
          className="rounded-full border border-(--border) bg-(--surface-soft) px-3 py-2 text-xs font-semibold text-(--text-primary) hover:bg-(--surface-alt) transition-colors"
        >
          Vibe Tribe
        </button>
      </div>

      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 z-40 bg-slate-900/25"
              aria-label="Close notifications"
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="fixed right-3 top-[max(4rem,env(safe-area-inset-top)+3.5rem)] z-50 w-[min(92vw,360px)] rounded-2xl border border-(--border) bg-(--surface-soft)/95 backdrop-blur p-3 sm:p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-(--text-secondary) uppercase tracking-widest">Notifications</h3>
                <button type="button" onClick={() => setShowNotifications(false)} className="text-(--text-muted) hover:text-(--text-primary) text-xs transition-colors">Close</button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <p className="text-xs text-(--text-muted)">No notifications yet.</p>
                ) : (
                  recentActivity.slice(0, 10).map((activity) => {
                    const isSelfActivity = activity.isSelf === true || Number(activity.userId) === Number(myId);
                    const isMatchedActivity = activity.isMatched === true;
                    const showIdentity = isSelfActivity || isMatchedActivity;
                    const displayName = showIdentity ? (activity.userName || (isSelfActivity ? "You" : "Someone")) : "Anonymous";
                    const isRequest = activity.type === "friend_request";
                    const requestId = activity.requestId || activity.id;
                    return (
                      <div key={`${activity.type}-${activity.userId}-${activity.createdAt}`} className="rounded-xl bg-(--surface-alt) p-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm text-(--text-secondary) line-clamp-2">
                              {activity.userId ? (
                                <button
                                  type="button"
                                  onClick={() => setProfileViewerUserId(activity.userId)}
                                  className={isMatchedActivity ? "font-semibold text-emerald-300 hover:text-emerald-200" : "font-medium text-slate-200 hover:text-indigo-300"}
                                >
                                  {displayName}
                                </button>
                              ) : (
                                <span className="font-medium text-(--text-primary)">{displayName}</span>
                              )}{" "}
                              {activity.action}
                            </p>
                            <p className="text-[10px] text-(--text-muted) mt-1">{formatActivityTime(activity.createdAt || activity.time)}</p>
                          </div>
                          {isRequest && requestId && (
                            <button
                              type="button"
                              onClick={() => handleConfirmRequest(requestId)}
                              className="rounded-full border border-(--border) bg-(--surface) px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-(--text-primary)"
                            >
                              Confirm
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4 lg:gap-6">

        {/* Posts Feed - Main content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-last lg:order-first">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-(--surface-soft) border border-(--border) backdrop-blur-xl p-4 sm:p-6 rounded-3xl sm:rounded-[2.5rem] shadow-xl transition-colors duration-300"
          >
            <div className="flex gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500" />
              <div className="flex-1 min-w-0">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share your current frequency…"
                  className="w-full bg-transparent border-none outline-none text-base sm:text-lg text-slate-200 placeholder:text-slate-600 resize-none min-h-20 sm:h-20"
                  rows={3}
                  maxLength={maxChars + 50} // Allow slight overflow for UX
                />

                {/* Character counter and validation */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {(selectedMusicUri || selectedMusicTitle || selectedFullTrack || selectedPreviewTrack) && (
                      <div className="flex flex-col gap-1.5">
                        {selectedMusicMode === "both" && selectedFullTrack && selectedPreviewTrack ? (
                          <>
                            <div className="flex items-center gap-2 bg-(--accent-bg) text-(--accent) px-3 py-1 rounded-full text-xs max-w-full">
                              <Music size={12} />
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <span className="truncate block font-semibold">Full: {selectedFullTrack.name}</span>
                                <span className="block text-[10px] opacity-75">{selectedFullTrack.artist}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 bg-(--accent-bg) text-(--accent) px-3 py-1 rounded-full text-xs max-w-full">
                              <Music size={12} />
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <span className="truncate block font-semibold">Preview: {selectedPreviewTrack.name}</span>
                                <span className="block text-[10px] opacity-75">{selectedPreviewTrack.artist}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedMusicUri("");
                                setSelectedMusicTitle("");
                                setSelectedMusicArtist("");
                                setSelectedMusicPreview("");
                                setSelectedMusicAlbumCover("");
                                setSelectedFullTrack(null);
                                setSelectedPreviewTrack(null);
                              }}
                              className="text-[10px] text-slate-400 hover:text-red-400 transition-colors text-left"
                            >
                              Remove both
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 bg-(--accent-bg) text-(--accent) px-3 py-1 rounded-full text-xs max-w-full">
                            <Music size={12} />
                            <div className="min-w-0 flex-1 overflow-hidden">
                              {selectedMusicTitle ? (
                                <span className="truncate block">{selectedMusicTitle} {selectedMusicArtist ? `- ${selectedMusicArtist}` : ""}</span>
                              ) : (
                                <span className="truncate block">Track attached</span>
                              )}
                              <span className="block text-[10px] uppercase tracking-[0.2em] text-(--accent) mt-0.5">
                                {selectedMusicMode === "preview" ? "Preview" : "Full song"}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedMusicUri("");
                                setSelectedMusicTitle("");
                                setSelectedMusicArtist("");
                                setSelectedMusicPreview("");
                                setSelectedMusicAlbumCover("");
                                setSelectedFullTrack(null);
                                setSelectedPreviewTrack(null);
                              }}
                              className="shrink-0 ml-1 hover:text-red-400 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${isOverLimit ? 'text-red-400' : charCount > maxChars * 0.8 ? 'text-yellow-400' : 'text-slate-500'}`}>
                      {charCount}/{maxChars}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-between items-center gap-3 pt-3 sm:pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-slate-500 shrink-0" aria-hidden />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMusicSearch(!showMusicSearch)}
                      disabled={!isOnline}
                      className="bg-(--accent) hover:bg-(--accent-2) disabled:opacity-50 text-white px-4 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2"
                    >
                      <Music size={14} />
                      Add Song
                    </button>
                    <button
                      type="button"
                      onClick={handlePostVibe}
                      disabled={!canPost}
                      className="touch-manipulation bg-(--accent) hover:bg-(--accent-2) disabled:bg-slate-500 disabled:cursor-not-allowed text-white px-5 sm:px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2"
                    >
                      {isPosting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          Post Vibe <Send size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {showMusicSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-(--surface-soft) border border-(--border) backdrop-blur-xl p-4 rounded-3xl shadow-xl overflow-hidden transition-colors duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-200">Attach a Song</h3>
                  <button
                    onClick={() => setShowMusicSearch(false)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  {/* Search Section */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Search songs:</p>
                    <input
                      type="text"
                      value={musicQuery}
                      onChange={(e) => setMusicQuery(e.target.value)}
                      placeholder="Song name or artist..."
                      className="w-full bg-(--surface-alt) border border-(--border) rounded-lg px-4 py-2 text-(--text-primary) placeholder:text-(--text-secondary) mb-2"
                    />
                    <div className="flex flex-wrap gap-2 mb-3 text-sm">
                      {[
                        { id: "preview", label: "Preview clip" },
                        { id: "full", label: "Full song" },
                        { id: "both", label: "Full + preview" },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedMusicMode(option.id)}
                          className={`rounded-full px-3 py-2 transition-all text-xs font-semibold ${selectedMusicMode === option.id ? "bg-(--accent) text-white" : "bg-(--surface-alt) text-(--text-primary) hover:bg-(--surface-soft)"}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {(musicResults.length > 0 || appleResults.length > 0 || youtubeResults.length > 0) ? (
                        <button
                          onClick={() => {
                            setMusicQuery("");
                            setMusicResults([]);
                            setAppleResults([]);
                            setYoutubeResults([]);
                          }}
                          className="bg-(--surface-alt) hover:bg-(--surface-soft) text-(--text-primary) px-4 py-2 rounded-lg font-medium text-sm"
                        >
                          Clear
                        </button>
                      ) : (
                        <button
                          onClick={() => searchMusic(musicQuery)}
                          disabled={musicLoading || !musicQuery.trim()}
                          className="bg-(--accent) hover:bg-(--accent-2) disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium text-sm"
                        >
                          {musicLoading ? "Searching..." : "Search"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search Results */}
                  {selectedMusicMode === "both" ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-h-72 overflow-y-auto">
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400">YouTube full-song results</p>
                        <p className="text-[10px] text-slate-500">Select one song from either side to attach it.</p>
                        {youtubeResults.length > 0 ? (
                          <div className="space-y-2">
                            {youtubeResults.map((track) => (
                              <div
                                key={track.id}
                                onClick={() => selectMusicTrack(track, "youtube")}
                                className="flex items-center gap-3 p-3 bg-(--surface-alt) border border-(--border) rounded-lg cursor-pointer hover:bg-(--surface-soft) transition-colors"
                              >
                                {track.albumCover ? (
                                  <img src={track.albumCover} alt={track.name} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
                                ) : (
                                  <Music size={20} className="text-(--accent) shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-(--text-primary) font-medium truncate">{track.name}</p>
                                  <p className="text-(--text-secondary) text-sm truncate">{track.artist}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-(--border) bg-(--surface-alt)/80 p-4 text-(--text-secondary) text-sm">
                            {musicLoading ? "Searching YouTube..." : "Search for songs above to display YouTube full-track results."}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400">Apple preview results</p>
                        <p className="text-[10px] text-slate-500">Select one song from either side to attach it.</p>
                        {appleResults.length > 0 ? (
                          <div className="space-y-2">
                            {appleResults.map((track) => (
                              <div
                                key={track.id}
                                onClick={() => selectMusicTrack(track, "apple")}
                                className="flex items-center gap-3 p-3 bg-(--surface-alt) border border-(--border) rounded-lg cursor-pointer hover:bg-(--surface-soft) transition-colors"
                              >
                                {track.albumCover ? (
                                  <img src={track.albumCover} alt={track.name} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
                                ) : (
                                  <Music size={20} className="text-(--accent) shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-(--text-primary) font-medium truncate">{track.name}</p>
                                  <p className="text-(--text-secondary) text-sm truncate">{track.artist}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-(--border) bg-(--surface-alt)/80 p-4 text-(--text-secondary) text-sm">
                            {musicLoading ? "Searching Apple Music..." : "Search for songs above to display Apple preview results."}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      <p className="text-xs text-slate-400">Found {musicResults.length} tracks:</p>
                      {musicResults.map((track) => (
                        <div
                          key={track.id}
                          onClick={() => selectMusicTrack(track, selectedMusicMode === "preview" ? "apple" : "youtube")}
                          className="flex items-center gap-3 p-3 bg-(--surface-alt) border border-(--border) rounded-lg cursor-pointer hover:bg-(--surface-soft) transition-colors"
                        >
                          {track.albumCover ? (
                            <img src={track.albumCover} alt={track.name} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
                          ) : (
                            <Music size={20} className="text-(--accent) shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-(--text-primary) font-medium truncate">{track.name}</p>
                            <p className="text-(--text-secondary) text-sm truncate">{track.artist}</p>
                          </div>
                        </div>
                      ))}
                      {musicResults.length === 0 && (
                        <div className="rounded-2xl border border-(--border) bg-(--surface-alt)/80 p-4 text-(--text-secondary) text-sm">
                          {musicLoading ? (
                            "Searching music..."
                          ) : musicQuery.trim() ? (
                            "No tracks found. Try a different song name."
                          ) : (
                            "Enter a song name or artist above to search music."
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {postsLoading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
              />
              <span className="ml-3 text-slate-400">Loading vibes...</span>
            </div>
          ) : postsError ? (
            <div className="text-center py-8">
              <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">Could not load posts</p>
              <p className="text-sm text-slate-500 mb-4">{postsError}</p>
              <button
                onClick={() => fetchPosts({ reset: true, showLoading: true })}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                disabled={!isOnline}
              >
                {isOnline ? "Try Again" : "Offline"}
              </button>
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Music className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No vibes yet</p>
              <p className="text-slate-500">Be the first to share your frequency!</p>
            </motion.div>
          ) : (
            <>
              {lastRefresh && (
                <div className="text-center mb-4">
                  <span className="text-xs text-slate-500">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </span>
                </div>
              )}
              <AnimatePresence>
                {posts.map((post, idx) => {
                  const normalizedPostId = normalizePostId(post.id);
                  const authorName = post.user?.fullName?.trim() || "Member";
                  const created = post.createdAt ? new Date(post.createdAt) : null;
                  const timeLabel = created && !Number.isNaN(created.getTime())
                    ? created.toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : "";
                  const isLiked = likedPosts.has(normalizedPostId);
                  const likesCount = postLikes.get(normalizedPostId) || 0;
                  const isExpanded = expandedPosts.has(post.id);
                  const isCollapsedOnMobile = isMobileView && !isExpanded;
                  const shouldTruncate = post.content && post.content.length > 200;
                  const normalizedMusicUri = normalizeMusicField(post.musicUri);
                  const normalizedMusicTitle = normalizeMusicField(post.musicTitle);
                  const normalizedMusicArtist = normalizeMusicField(post.musicArtist);
                  const normalizedMusicPreview = normalizeMusicField(post.musicPreview);
                  const normalizedMusicAlbumCover = normalizeMusicField(post.musicAlbumCover);
                  const spotifyTrackId = getSpotifyTrackId(normalizedMusicUri);
                  const isYouTubeMusic = isYouTubeLink(normalizedMusicUri);
                  const hasMusicInfo = spotifyTrackId || normalizedMusicUri || normalizedMusicTitle || normalizedMusicArtist || normalizedMusicPreview || normalizedMusicAlbumCover;
                  const musicLink = normalizedMusicUri || ((normalizedMusicTitle || normalizedMusicArtist) ? `https://music.apple.com/search?term=${encodeURIComponent((normalizedMusicTitle || "") + " " + (normalizedMusicArtist || ""))}` : null);
                  const musicButtonLabel = getMusicLinkLabel(normalizedMusicUri || musicLink);
                  const compactMusicImage = normalizedMusicAlbumCover || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(normalizedMusicTitle || authorName || "song")}`;
                  const compactPlayUrl = spotifyTrackId ? `https://open.spotify.com/track/${spotifyTrackId}` : (musicLink || null);

                  return (
                    <motion.div
                      key={post.id != null ? post.id : `post-${idx}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-(--surface-soft) border border-(--border) p-4 sm:p-6 rounded-3xl sm:rounded-4xl backdrop-blur-sm hover:border-(--accent) transition-all group"
                    >
                      <div className="flex items-start gap-3 mb-3 sm:mb-4">
                        <button
                          type="button"
                          onClick={() => post.user?.id && setProfileViewerUserId(post.user.id)}
                          className="shrink-0"
                        >
                          <img
                            src={getAvatarUrl(post.user, post.user?.id || authorName)}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-indigo-500/20"
                          />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <button
                                type="button"
                                onClick={() => post.user?.id && setProfileViewerUserId(post.user.id)}
                                className="font-bold text-sm text-white truncate hover:text-indigo-300"
                              >
                                {authorName}
                              </button>
                              {timeLabel && (
                                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{timeLabel}</p>
                              )}
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-full">
                              <MoreHorizontal size={16} className="text-slate-400" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-slate-300 leading-relaxed wrap-break-word">
                          {shouldTruncate && !isExpanded
                            ? `${post.content.substring(0, isMobileView ? 120 : 200)}...`
                            : post.content ?? ""
                          }
                        </p>
                        {shouldTruncate && (
                          <button
                            onClick={() => togglePostExpansion(post.id)}
                            className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 font-medium"
                          >
                            {isExpanded ? "Show less" : "Read more"}
                          </button>
                        )}
                        {isCollapsedOnMobile && (
                          <div className="mt-3 space-y-2">
                            {hasMusicInfo ? (
                              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-2 py-2">
                                <img src={compactMusicImage} alt="song" className="h-8 w-8 rounded-lg object-cover" />
                                <button
                                  type="button"
                                  onClick={() => handleQuickPlay(post.id, normalizedMusicPreview, compactPlayUrl)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500"
                                  aria-label="Play track"
                                >
                                  <Play size={12} className={currentlyPlayingPostId === post.id ? "hidden" : "block"} />
                                  <span className={`text-[10px] font-bold ${currentlyPlayingPostId === post.id ? "block" : "hidden"}`}>II</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLikePost(normalizedPostId)}
                                  disabled={!token || !isOnline}
                                  className={`ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full transition ${isLiked ? "bg-red-500/20 text-red-400" : "bg-white/5 text-slate-300"}`}
                                  aria-label="Like post"
                                >
                                  <Heart size={13} className={isLiked ? "fill-current" : ""} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => togglePostExpansion(post.id)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-300"
                                  aria-label="Expand post"
                                >
                                  <ChevronDown size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => togglePostExpansion(post.id)}
                                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                <Play size={12} /> Expand
                              </button>
                            )}
                          </div>
                        )}
                        {isMobileView && isExpanded && (
                          <button
                            type="button"
                            onClick={() => togglePostExpansion(post.id)}
                            className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-slate-400 hover:text-slate-200"
                          >
                            <ChevronUp size={12} /> Collapse
                          </button>
                        )}
                      </div>

                      {!isCollapsedOnMobile && (spotifyTrackId ? (
                        <div className="mt-4 mb-4">
                          <iframe
                            src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator`}
                            width="100%"
                            height="152"
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            className="rounded-lg"
                          />
                        </div>
                      ) : hasMusicInfo ? (
                        <div className="mt-4 mb-4 rounded-3xl border border-white/10 bg-slate-950/70 overflow-hidden">
                          <div className="sm:flex gap-4">
                            {normalizedMusicAlbumCover && (
                              <img
                                src={normalizedMusicAlbumCover}
                                alt={normalizedMusicTitle || "Attached song"}
                                className="w-full sm:w-32 h-32 sm:h-32 object-cover rounded-3xl sm:rounded-3xl"
                              />
                            )}
                            <div className="flex-1 p-4">
                              <p className="text-slate-300 text-sm font-semibold">Attached song</p>
                              <p className="text-white font-bold text-base mt-2">{normalizedMusicTitle || "Unknown title"}</p>
                              {normalizedMusicArtist && <p className="text-slate-400 text-sm mt-1">{normalizedMusicArtist}</p>}

                              {normalizedMusicPreview && !isYouTubeMusic && (
                                <div className="mt-4">
                                  <div className="bg-linear-to-r from-indigo-600/20 to-purple-600/20 rounded-2xl p-4 border border-white/10">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                                        <Music size={16} className="text-white" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-white text-sm font-medium">Preview</p>
                                        <p className="text-slate-400 text-xs">30-second sample</p>
                                      </div>
                                    </div>
                                    <audio
                                      controls
                                      src={normalizedMusicPreview}
                                      crossOrigin="anonymous"
                                      preload="metadata"
                                      className="w-full h-8 rounded-lg"
                                      style={{
                                        background: 'transparent',
                                        outline: 'none'
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                              {isYouTubeMusic && normalizedMusicUri && (
                                <div className="mt-4">
                                  <div className="bg-linear-to-r from-red-600/20 to-red-700/20 rounded-2xl p-4 border border-white/10">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                        <Play size={16} className="text-white" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-white text-sm font-medium">YouTube Video</p>
                                        <p className="text-slate-400 text-xs">Full song available</p>
                                      </div>
                                    </div>
                                    <a
                                      href={normalizedMusicUri}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                      <Play size={14} />
                                      Watch on YouTube
                                    </a>
                                  </div>
                                </div>
                              )}

                              {musicLink && (
                                <a
                                  href={musicLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 mt-3 text-indigo-300 hover:text-indigo-200 text-sm font-medium"
                                >
                                  <Music size={14} />
                                  {musicButtonLabel}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null)}

                      {!isCollapsedOnMobile && (
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLikePost(normalizedPostId)}
                            disabled={!token || !isOnline}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${
                              isLiked
                                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                : "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            }`}
                          >
                            <Heart size={16} className={isLiked ? "fill-current" : ""} />
                            <span className="text-sm font-medium">{likesCount}</span>
                          </button>

                          <button 
                            onClick={() => toggleCommentBox(String(post.id))}
                            className="flex items-center gap-2 px-3 py-1 rounded-full text-slate-400 hover:text-slate-300 hover:bg-white/5 transition-all"
                          >
                            <MessageCircle size={16} />
                            <span className="text-sm font-medium">{(comments[post.id] || []).length}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleSharePost(post)}
                          className="flex items-center gap-2 px-3 py-1 rounded-full text-slate-400 hover:text-slate-300 hover:bg-white/5 transition-all"
                        >
                          <Share2 size={16} />
                        </button>
                      </div>
                      )}

                      {/* Comments section */}
                      {!isCollapsedOnMobile && openComments[post.id] && (
                        <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
                          {(comments[post.id] || []).length > 0 && (
                            <div className="space-y-3">
                              {(comments[post.id] || []).map((comment, ci) => (
                                <div key={`${post.id}-comment-${ci}`} className="rounded-2xl bg-slate-950/70 p-3">
                                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                    {comment.user?.fullName || comment.author || "Anonymous"}
                                  </p>
                                  <p className="mt-1 text-slate-200 text-sm leading-relaxed">{comment.content}</p>
                                  <p className="mt-2 text-[10px] text-slate-500 uppercase tracking-tighter">
                                    {new Date(comment.createdAt || comment.timestamp || Date.now()).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      timeZone: "Asia/Kolkata",
                                    })}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={commentDrafts[post.id] || ""}
                              onChange={(e) => handleCommentChange(post.id, e.target.value)}
                              placeholder="Write a quick reply..."
                              className="flex-1 rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => submitComment(post.id)}
                              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
                            >
                              <Send size={14} />
                              Post
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {isFetchingMorePosts && (
                <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Loading more vibes...
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isRightRailOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRightRailOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/30"
              aria-label="Close rail"
            />
            <motion.aside
              initial={{ x: 360 }}
              animate={{ x: 0 }}
              exit={{ x: 360 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="fixed right-0 top-0 z-50 h-full w-[min(90vw,360px)] border-l border-(--border) bg-(--surface-soft)/95 backdrop-blur-xl p-4 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-(--text-secondary) uppercase tracking-widest">Your Vibe Tribe</h3>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={findMatches} disabled={loading || !isOnline} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold py-1 px-2 disabled:opacity-50">
                    {loading ? <Loader2 size={12} className="animate-spin" /> : "⟳"}
                  </button>
                  <button type="button" onClick={() => setIsRightRailOpen(false)} className="p-1 rounded text-(--text-muted) hover:text-(--text-primary) transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {matches.length === 0 && !loading && (
                  <div className="text-center py-6 px-4">
                    <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs mb-1">No matches found</p>
                    <p className="text-slate-500 text-[10px]">Complete your profile!</p>
                  </div>
                )}
                {matches.map((m, i) => {
                  const matchPercent = formatMatchPercent(m.distance);
                  const matchValue = matchPercent.label === "—" ? 0 : parseInt(matchPercent.label, 10) || 0;
                  const userName = (m.fullName || "").trim() || "Anonymous";
                  return (
                    <div key={m.userId ?? i} className="group relative bg-(--surface-alt) border border-(--border) p-3 rounded-2xl backdrop-blur-sm hover:bg-(--surface) transition-all cursor-pointer" onClick={() => openChat(m)}>
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img src={getAvatarUrl(m, m.userId)} alt="" className="w-10 h-10 rounded-full object-cover border border-indigo-500/20" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-[#0b0e14] flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white">{matchPercent.label}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setProfileViewerUserId(m.userId); }} className="font-semibold text-sm text-white truncate hover:text-indigo-300">{userName}</button>
                          <p className="text-xs text-slate-400">Match</p>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-slate-700 rounded-full h-1">
                        <div style={{ width: `${matchValue}%` }} className="bg-linear-to-r from-indigo-500 to-purple-500 h-1 rounded-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

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
                    {selectedUser.fullName || "Mysterious Vibe"}
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
                    className="bg-linear-to-r from-indigo-500 to-pink-500 h-full"
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
                          className={`max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 rounded-2xl wrap-break-word ${
                            isMe ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-100"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className="text-[10px] text-white/70 mt-1 text-right">
                            {new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Kolkata",
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

      <UserProfileModal
        open={!!profileViewerUserId}
        userId={profileViewerUserId}
        token={token}
        onClose={() => setProfileViewerUserId(null)}
        onMessage={(uid, profile) => handleProfileMessage(uid, profile)}
      />
    </div>
  );
};

export default Home;

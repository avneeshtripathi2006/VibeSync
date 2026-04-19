import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Search, Send, UserPlus, Check, X, Play, Music, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { getApiBase } from "../config/env.js";
import { useToast } from "../context/ToastContext.jsx";
import UserProfileModal from "../components/UserProfileModal.jsx";

const Explore = () => {
  const POSTS_BATCH_SIZE = 5;
  const showToast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [postsOffset, setPostsOffset] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isFetchingMorePosts, setIsFetchingMorePosts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [openComments, setOpenComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [comments, setComments] = useState({});
  const [friendRequestStatus, setFriendRequestStatus] = useState({}); // Maps userId -> status
  const [profileViewerUserId, setProfileViewerUserId] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  const [isMobileView, setIsMobileView] = useState(() => window.innerWidth < 768);
  const quickAudioMapRef = useRef(new Map());
  const [currentlyPlayingPostId, setCurrentlyPlayingPostId] = useState(null);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("token") || "");
  const token = authToken;

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
  const authHeaders = (() => {
    if (!token) return {};
    const cleaned = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
    if (!cleaned) return {};
    return { Authorization: `Bearer ${cleaned}` };
  })();

  const getAvatarUrl = (userObj, fallbackSeed) => {
    const seed = encodeURIComponent(userObj?.defaultAvatarSeed || fallbackSeed || "u");
    return userObj?.identityUnlocked && userObj?.profilePicUrl
      ? userObj.profilePicUrl
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  };

  const normalizeMusicField = (value) => {
    if (typeof value !== "string") return "";
    return value.trim();
  };

  const normalizePostId = (postId) => String(postId);

  const getSpotifyTrackId = (uri) => {
    if (!uri) return null;
    const spotifyUriMatch = uri.match(/spotify:track:([A-Za-z0-9]+)/);
    if (spotifyUriMatch) return spotifyUriMatch[1];
    const spotifyUrlMatch = uri.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/);
    return spotifyUrlMatch ? spotifyUrlMatch[1] : null;
  };

  const fetchAllPosts = async ({ reset = false, showLoading = true } = {}) => {
    const requestOffset = reset ? 0 : postsOffset;
    if (showLoading) setLoading(true);
    if (reset) {
      setLoadError("");
      setHasMorePosts(true);
    }
    try {
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${getApiBase()}/api/posts/explore`, {
        headers: authHeaders,
        timeout: 30000,
        params: { limit: POSTS_BATCH_SIZE, offset: requestOffset },
      });
      const allPosts = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.posts)
          ? res.data.posts
          : [];
      setPosts((prev) => (reset ? allPosts : [...prev, ...allPosts]));
      setPostsOffset(requestOffset + allPosts.length);
      setHasMorePosts(allPosts.length === POSTS_BATCH_SIZE);
      setLikedPosts((prev) => {
        const next = reset ? new Set() : new Set(prev);
        allPosts.forEach((post) => {
          const id = normalizePostId(post.id);
          if (post.likedByCurrentUser) {
            next.add(id);
          } else {
            next.delete(id);
          }
        });
        return next;
      });
      const userIds = Array.from(new Set(allPosts.map((post) => post.user?.id).filter(Boolean)));
      userIds.forEach((userId) => checkFriendStatus(userId));
    } catch (err) {
      console.error("Failed to fetch posts", err);
      try {
        const retryWithoutAuth = await axios.get(`${getApiBase()}/api/posts/explore`, {
          timeout: 30000,
          params: { limit: POSTS_BATCH_SIZE, offset: requestOffset },
        });
        const retriedPosts = Array.isArray(retryWithoutAuth.data) ? retryWithoutAuth.data : [];
        setPosts((prev) => (reset ? retriedPosts : [...prev, ...retriedPosts]));
        setPostsOffset(requestOffset + retriedPosts.length);
        setHasMorePosts(retriedPosts.length === POSTS_BATCH_SIZE);
        setLikedPosts((prev) => {
          const next = reset ? new Set() : new Set(prev);
          retriedPosts.forEach((post) => {
            const id = normalizePostId(post.id);
            if (post.likedByCurrentUser) {
              next.add(id);
            } else {
              next.delete(id);
            }
          });
          return next;
        });
      } catch {
        try {
          const fallbackRes = await axios.get(`${getApiBase()}/api/posts/all`, {
            headers: authHeaders,
            timeout: 30000,
            params: { limit: POSTS_BATCH_SIZE, offset: requestOffset },
          });
          const fallbackPosts = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
          setPosts((prev) => (reset ? fallbackPosts : [...prev, ...fallbackPosts]));
          setPostsOffset(requestOffset + fallbackPosts.length);
          setHasMorePosts(fallbackPosts.length === POSTS_BATCH_SIZE);
          setLikedPosts((prev) => {
            const next = reset ? new Set() : new Set(prev);
            fallbackPosts.forEach((post) => {
              const id = normalizePostId(post.id);
              if (post.likedByCurrentUser) {
                next.add(id);
              } else {
                next.delete(id);
              }
            });
            return next;
          });
        } catch {
          setLoadError("Could not load explore feed. Please try again.");
          showToast("Could not load explore feed.");
        }
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const loadMorePosts = async () => {
    if (loading || isFetchingMorePosts || !hasMorePosts) return;
    setIsFetchingMorePosts(true);
    await fetchAllPosts({ reset: false, showLoading: false });
    setIsFetchingMorePosts(false);
  };

  useEffect(() => {
    fetchAllPosts({ reset: true, showLoading: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only load
  }, [authToken]);

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
  }, [loading, isFetchingMorePosts, hasMorePosts, postsOffset]);

  useEffect(() => {
    const onResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const filteredPosts = posts.filter((post) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const author = String(post.user?.fullName || "");
    const content = String(post.content || "");
    return (
      author.toLowerCase().includes(term) ||
      content.toLowerCase().includes(term)
    );
  });

  const fetchComments = async (postId) => {
    try {
      const res = await axios.get(`${getApiBase()}/api/posts/${postId}/comments`, {
        headers: authHeaders,
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

  const handleToggleLike = async (postId) => {
    try {
      const res = await axios.post(`${getApiBase()}/api/posts/${postId}/like`, null, {
        headers: authHeaders,
      });

      const normalizedId = normalizePostId(postId);
      const nextLiked = !!res.data?.liked;
      const nextLikeCount = Number(res.data?.likeCount || 0);

      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          const currentId = normalizePostId(post.id ?? post.createdAt ?? post.content);
          if (currentId !== normalizedId) return post;
          return {
            ...post,
            likeCount: nextLikeCount,
            likedByCurrentUser: nextLiked,
          };
        })
      );

      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (nextLiked) {
          next.add(normalizedId);
        } else {
          next.delete(normalizedId);
        }
        return next;
      });

      window.dispatchEvent(new CustomEvent("vibesync-post-like-updated", {
        detail: {
          postId: normalizedId,
          liked: nextLiked,
          likeCount: nextLikeCount,
        },
      }));
    } catch (err) {
      console.error("Like toggle failed", err);
      showToast("Could not update like. Please try again.");
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

      setPosts((prev) => prev.map((post) => (
        normalizePostId(post.id) === normalizedId
          ? { ...post, likeCount, likedByCurrentUser: liked }
          : post
      )));
    };

    window.addEventListener("vibesync-post-like-updated", onLikeUpdated);
    return () => window.removeEventListener("vibesync-post-like-updated", onLikeUpdated);
  }, []);

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
        { headers: authHeaders }
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

  const togglePostExpansion = (postId) => {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

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

  // Fetch friend request status with a user
  const checkFriendStatus = async (userId) => {
    try {
      const res = await axios.get(`${getApiBase()}/api/friend-request/status/${userId}`, {
        headers: authHeaders,
      });
      setFriendRequestStatus((prev) => ({
        ...prev,
        [userId]: res.data.status || "NONE",
      }));
    } catch (err) {
      console.error("Failed to check friend status:", err);
    }
  };

  // Send friend request
  const handleSendFriendRequest = async (userId) => {
    try {
      await axios.post(`${getApiBase()}/api/friend-request/send/${userId}`, {}, {
        headers: authHeaders,
      });
      showToast("Friend request sent!");
      setFriendRequestStatus((prev) => ({
        ...prev,
        [userId]: "PENDING",
      }));
    } catch (err) {
      console.error("Failed to send friend request:", err);
      showToast(err.response?.data?.error || "Could not send friend request.");
    }
  };

  // Fetch statuses when posts load
  useEffect(() => {
    if (posts.length > 0 && token) {
      posts.forEach((post) => {
        if (post.user?.id) {
          checkFriendStatus(post.user.id);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, token]);

  return (
    <>
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Explore Vibes</h1>
        <p className="text-slate-400">Discover what others are sharing and search by author, vibe text, or tags.</p>
      </motion.div>

      <div className="mb-6">
        <div className="relative rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 shadow-inner shadow-black/20">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search profiles, posts, or vibe tags..."
            className="w-full pl-11 pr-4 bg-transparent text-white outline-none placeholder:text-slate-500"
          />
        </div>
        {searchTerm && (
          <p className="text-sm text-slate-500">
            Showing {filteredPosts.length} of {posts.length} vibes for "{searchTerm}"
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-slate-400">Loading vibes...</p>
        </div>
      ) : loadError ? (
        <div className="flex flex-col justify-center items-center py-20 gap-3">
          <p className="text-slate-500">{loadError}</p>
          <button
            type="button"
            onClick={() => fetchAllPosts({ reset: true, showLoading: true })}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Retry
          </button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-slate-500">No vibes matched your search. Try a different keyword.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post, i) => {
            const postId = post.id ?? `post-${i}`;
            const isLiked = likedPosts.has(String(postId));
            const isExpanded = expandedPosts.has(String(postId));
            const isCollapsedOnMobile = isMobileView && !isExpanded;
            const authorName = post.user?.fullName || "Anonymous";
            const musicUri = normalizeMusicField(post.musicUri);
            const musicPreview = normalizeMusicField(post.musicPreview);
            const musicTitle = normalizeMusicField(post.musicTitle);
            const musicArtist = normalizeMusicField(post.musicArtist);
            const musicAlbumCover = normalizeMusicField(post.musicAlbumCover);
            const hasMusicInfo = Boolean(musicUri || post.musicTitle || post.musicArtist || post.musicAlbumCover || musicPreview);
            const compactMusicImage = musicAlbumCover || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(musicTitle || authorName || "song")}`;
            const spotifyTrackId = getSpotifyTrackId(musicUri);
            const compactPlayUrl = spotifyTrackId ? `https://open.spotify.com/track/${spotifyTrackId}` : (musicUri || null);
            const postTime = new Date(post.createdAt || Date.now()).toLocaleString([], {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Kolkata",
            });

            return (
              <motion.div
                key={String(postId)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/10 p-6 rounded-4xl backdrop-blur-sm hover:border-white/20 transition-all group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => post.user?.id && setProfileViewerUserId(post.user.id)}
                  >
                    <img
                      src={getAvatarUrl(post.user, post.user?.id || authorName)}
                      className="w-12 h-12 rounded-full bg-slate-800 border border-indigo-500/20 object-cover"
                      alt="Avatar"
                    />
                  </button>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => post.user?.id && setProfileViewerUserId(post.user.id)}
                      className="font-bold text-sm text-white hover:text-indigo-300"
                    >
                      {authorName}
                    </button>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{postTime}</p>
                  </div>
                  {post.user?.id && (
                    <button
                      type="button"
                      onClick={() => handleSendFriendRequest(post.user.id)}
                      disabled={friendRequestStatus[post.user.id] === "PENDING" || friendRequestStatus[post.user.id] === "ACCEPTED"}
                      className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        friendRequestStatus[post.user.id] === "PENDING"
                          ? "bg-yellow-500/20 text-yellow-300 cursor-not-allowed"
                          : friendRequestStatus[post.user.id] === "ACCEPTED"
                          ? "bg-green-500/20 text-green-300 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white"
                      }`}
                    >
                      {friendRequestStatus[post.user.id] === "PENDING" ? (
                        <>
                          <Check size={14} /> Pending
                        </>
                      ) : friendRequestStatus[post.user.id] === "ACCEPTED" ? (
                        <>
                          <Check size={14} /> Friends
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} /> Connect
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="mb-4">
                  <p className={`text-slate-300 leading-relaxed whitespace-pre-wrap ${isCollapsedOnMobile ? "line-clamp-3" : ""}`}>{post.content}</p>
                  {isCollapsedOnMobile && (
                    <div className="mt-3 space-y-2">
                      {hasMusicInfo ? (
                        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-2 py-2">
                          <img src={compactMusicImage} alt="song" className="h-8 w-8 rounded-lg object-cover" />
                          <button
                            type="button"
                            onClick={() => handleQuickPlay(String(postId), musicPreview, compactPlayUrl)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500"
                            aria-label="Play track"
                          >
                            <Play size={12} className={currentlyPlayingPostId === String(postId) ? "hidden" : "block"} />
                            <span className={`text-[10px] font-bold ${currentlyPlayingPostId === String(postId) ? "block" : "hidden"}`}>II</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleLike(String(postId))}
                            className={`ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full transition ${isLiked ? "bg-red-500/20 text-red-400" : "bg-white/5 text-slate-300"}`}
                            aria-label="Like post"
                          >
                            <Heart size={13} className={isLiked ? "fill-current" : ""} />
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePostExpansion(String(postId))}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-300"
                            aria-label="Expand post"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => togglePostExpansion(String(postId))}
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
                      onClick={() => togglePostExpansion(String(postId))}
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
                ) : musicTitle || musicArtist ? (
                  <div className="mt-4 mb-4 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                    <p className="text-slate-300 text-sm font-semibold">Attached song</p>
                    <p className="text-white font-bold text-base mt-2">{musicTitle || "Unknown title"}</p>
                    {musicArtist && <p className="text-slate-400 text-sm mt-1">{musicArtist}</p>}
                    {musicPreview && !musicUri.includes("youtube.com") && (
                      <audio controls src={musicPreview} className="mt-3 w-full h-8" preload="metadata" />
                    )}
                    {musicUri.includes("youtube.com") && (
                      <a
                        href={musicUri}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 mt-3 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Play size={14} />
                        Watch on YouTube
                      </a>
                    )}
                  </div>
                ) : null)}

                {!isCollapsedOnMobile && (
                <div className="flex flex-wrap gap-3 text-slate-400 group-hover:text-indigo-400 transition-colors">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(String(postId))}
                    className={`flex items-center gap-2 text-sm rounded-full px-3 py-2 transition-all ${isLiked ? "bg-indigo-600 text-white" : "hover:bg-slate-800"}`}
                  >
                    <Heart size={16} />
                    <span>{isLiked ? "Liked" : "Like"}</span>
                    <span className="text-slate-300">({post.likeCount || 0})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCommentBox(String(postId))}
                    className="flex items-center gap-2 text-sm rounded-full px-3 py-2 hover:bg-slate-800 transition-all"
                  >
                    <MessageCircle size={16} />
                    <span>{openComments[postId] ? "Hide" : "Reply"}</span>
                  </button>
                </div>
                )}

                {!isCollapsedOnMobile && openComments[postId] && (
                  <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
                    {(comments[postId] || []).length > 0 && (
                      <div className="space-y-3">
                        {(comments[postId] || []).map((comment, ci) => (
                          <div key={`${postId}-comment-${ci}`} className="rounded-2xl bg-slate-950/70 p-3">
                            <button
                              type="button"
                              onClick={() => comment.user?.id && setProfileViewerUserId(comment.user.id)}
                              className="text-xs uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-300"
                            >
                              {comment.user?.fullName || comment.author || "Anonymous"}
                            </button>
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
                        value={commentDrafts[postId] || ""}
                        onChange={(e) => handleCommentChange(postId, e.target.value)}
                        placeholder="Write a quick reply..."
                        className="flex-1 rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => submitComment(postId)}
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
          {isFetchingMorePosts && (
            <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading more vibes...
            </div>
          )}
        </div>
      )}
    </div>
      <UserProfileModal
        open={!!profileViewerUserId}
        userId={profileViewerUserId}
        token={token}
        onClose={() => setProfileViewerUserId(null)}
        onMessage={(userId) => {
          localStorage.setItem("vibesync-open-chat-user-id", String(userId));
          window.location.assign("/chat");
        }}
      />
    </>
  );
};

export default Explore;

import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music, Play } from "lucide-react";
import { getApiBase } from "../config/env.js";
import { getMyUserIdFromToken } from "../utils/jwt.js";
import { useToast } from "../context/ToastContext.jsx";

const UserProfileModal = ({ open, userId, token, onClose, onMessage }) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState("NONE");
  const [statusLoading, setStatusLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const showToast = useToast();
  const myId = getMyUserIdFromToken(token);

  useEffect(() => {
    if (!open || !userId || !token) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${getApiBase()}/api/profile/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) {
          setProfile(res.data || null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.error || "Could not load profile");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, userId, token]);

  useEffect(() => {
    if (!open || !userId || !token) return;

    let cancelled = false;
    const loadPosts = async () => {
      setPostsLoading(true);
      try {
        const res = await axios.get(`${getApiBase()}/api/posts/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 25, offset: 0 },
        });
        if (!cancelled) {
          setPosts(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) {
          setPosts([]);
        }
      } finally {
        if (!cancelled) {
          setPostsLoading(false);
        }
      }
    };

    loadPosts();
    return () => {
      cancelled = true;
    };
  }, [open, userId, token]);

  useEffect(() => {
    if (!open || !userId || !token || myId == null || Number(userId) === Number(myId)) {
      return;
    }

    let cancelled = false;
    const loadStatus = async () => {
      setStatusLoading(true);
      try {
        const res = await axios.get(`${getApiBase()}/api/friend-request/status/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) {
          setFriendshipStatus(res.data?.status || "NONE");
        }
      } catch {
        if (!cancelled) {
          setFriendshipStatus("NONE");
        }
      } finally {
        if (!cancelled) {
          setStatusLoading(false);
        }
      }
    };

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [open, userId, token, myId]);

  const handleConnect = async () => {
    if (!token || !userId || connectLoading) return;
    try {
      setConnectLoading(true);
      await axios.post(`${getApiBase()}/api/friend-request/send/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriendshipStatus("PENDING");
      showToast("Connection request sent!");
    } catch (e) {
      showToast(e.response?.data?.error || "Could not send connection request.");
    } finally {
      setConnectLoading(false);
    }
  };

  const handleMessage = () => {
    if (typeof onMessage === "function") {
      onMessage(userId, profile);
    } else {
      localStorage.setItem("vibesync-open-chat-user-id", String(userId));
      window.location.assign("/chat");
    }
    onClose();
  };

  const isUnlocked = !!profile?.identityUnlocked;
  const avatarSeed = encodeURIComponent(profile?.defaultAvatarSeed || String(userId || "u"));
  const avatarUrl = isUnlocked && profile?.profilePicUrl
    ? profile.profilePicUrl
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;
  const isSelf = myId != null && Number(userId) === Number(myId);
  const connectDisabled = statusLoading || connectLoading || friendshipStatus === "PENDING" || friendshipStatus === "ACCEPTED";
  const connectLabel = friendshipStatus === "ACCEPTED"
    ? "Connected"
    : friendshipStatus === "PENDING"
      ? "Pending"
      : connectLoading
        ? "Sending..."
        : "Connect";

  const getSpotifyTrackId = (uri) => {
    if (!uri) return null;
    const spotifyUriMatch = uri.match(/spotify:track:([A-Za-z0-9]+)/);
    if (spotifyUriMatch) return spotifyUriMatch[1];
    const spotifyUrlMatch = uri.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/);
    return spotifyUrlMatch ? spotifyUrlMatch[1] : null;
  };

  const isYouTubeLink = (uri) => typeof uri === "string" && /(youtube\.com|youtu\.be)/i.test(uri);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-70 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-full sm:max-w-xl bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Profile</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                aria-label="Close profile"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 max-h-[80vh] overflow-y-auto">
              {loading ? (
                <p className="text-slate-400 text-sm">Loading profile...</p>
              ) : error ? (
                <p className="text-red-300 text-sm">{error}</p>
              ) : profile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img src={avatarUrl} alt="profile" className="w-16 h-16 rounded-full object-cover border border-white/10" />
                    <div>
                      <p className="text-white font-semibold">{profile.fullName || "Anonymous Member"}</p>
                      <p className="text-xs text-slate-400">
                        {profile.isConnected ? `${profile.messageCount || 0}/50 messages` : "Not connected"}
                      </p>
                    </div>
                  </div>

                  {!isSelf && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleConnect}
                        disabled={connectDisabled}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${connectDisabled ? "bg-white/10 text-slate-300 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-500"}`}
                      >
                        {connectLabel}
                      </button>
                      <button
                        type="button"
                        onClick={handleMessage}
                        className="rounded-full px-4 py-2 text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition"
                      >
                        Message
                      </button>
                    </div>
                  )}

                  {profile.bio && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Bio</p>
                      <p className="text-slate-200 text-sm whitespace-pre-wrap">{profile.bio}</p>
                    </div>
                  )}

                  {profile.vibeTags && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Vibe Tags</p>
                      <p className="text-slate-200 text-sm">{profile.vibeTags}</p>
                    </div>
                  )}

                  {profile.hobbies && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Hobbies</p>
                      <p className="text-slate-200 text-sm">{profile.hobbies}</p>
                    </div>
                  )}

                  {profile.interests && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Interests</p>
                      <p className="text-slate-200 text-sm">{profile.interests}</p>
                    </div>
                  )}

                  {isUnlocked && profile.musicTaste && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Music Taste</p>
                      <p className="text-slate-200 text-sm">{profile.musicTaste}</p>
                    </div>
                  )}

                  {isUnlocked && profile.learningGoals && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Learning Goals</p>
                      <p className="text-slate-200 text-sm">{profile.learningGoals}</p>
                    </div>
                  )}

                  {isUnlocked && profile.spotifyArtists && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Top Artists</p>
                      <p className="text-slate-200 text-sm">{profile.spotifyArtists}</p>
                    </div>
                  )}

                  {isUnlocked && profile.youtubeSubscriptions && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Subscriptions</p>
                      <p className="text-slate-200 text-sm">{profile.youtubeSubscriptions}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Posts</p>
                    {postsLoading ? (
                      <p className="text-slate-400 text-sm">Loading posts...</p>
                    ) : posts.length === 0 ? (
                      <p className="text-slate-500 text-sm">No vibes posted yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {posts.map((post) => {
                          const spotifyTrackId = getSpotifyTrackId(post.musicUri);
                          const youtube = isYouTubeLink(post.musicUri);
                          const hasMusic = spotifyTrackId || post.musicUri || post.musicTitle || post.musicArtist || post.musicPreview || post.musicAlbumCover;

                          return (
                            <div key={post.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                              <p className="text-slate-200 text-sm whitespace-pre-wrap">{post.content}</p>
                              {hasMusic && (
                                <div className="mt-3">
                                  {spotifyTrackId ? (
                                    <iframe
                                      src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator`}
                                      width="100%"
                                      height="152"
                                      frameBorder="0"
                                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                      loading="lazy"
                                      className="rounded-xl"
                                    />
                                  ) : (
                                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                      <div className="flex items-start gap-3">
                                        <img
                                          src={post.musicAlbumCover || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(post.musicTitle || post.content || "song")}`}
                                          alt={post.musicTitle || "Attached song"}
                                          className="h-12 w-12 rounded-lg object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-semibold text-white truncate">{post.musicTitle || "Attached song"}</p>
                                          {post.musicArtist && <p className="text-xs text-slate-400 truncate">{post.musicArtist}</p>}
                                        </div>
                                      </div>
                                      {post.musicPreview && !youtube && (
                                        <audio controls src={post.musicPreview} className="mt-2 w-full h-8" preload="metadata" />
                                      )}
                                      {post.musicUri && (
                                        <a
                                          href={post.musicUri}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-2 mt-2 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                                        >
                                          {youtube ? <Play size={12} /> : <Music size={12} />} {youtube ? "Watch on YouTube" : "Open song"}
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserProfileModal;

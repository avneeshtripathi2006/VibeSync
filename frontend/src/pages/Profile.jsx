import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Edit2, Grid, Bookmark, Tag, ChevronUp, ChevronDown, Music, Play, Loader2 } from "lucide-react";
import { getApiBase } from "../config/env.js";
import { useToast } from "../context/ToastContext.jsx";

const Profile = () => {
  const POSTS_BATCH_SIZE = 5;
  const showToast = useToast();
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [postsOffset, setPostsOffset] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isFetchingMorePosts, setIsFetchingMorePosts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [vibesCount, setVibesCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const token = localStorage.getItem("token");

  // User fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Profile fields
  const [bio, setBio] = useState("");
  const [vibeTags, setVibeTags] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [musicTaste, setMusicTaste] = useState("");
  const [learningGoals, setLearningGoals] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");

  // Derived fields
  const [interests, setInterests] = useState("");
  const [youtubeSubscriptions, setYoutubeSubscriptions] = useState("");
  const [musicArtists, setMusicArtists] = useState("");

  const fetchUserPosts = async ({ reset = false, showLoading = true } = {}) => {
    if (!token) return;
    const requestOffset = reset ? 0 : postsOffset;

    if (showLoading) setPostsLoading(true);

    try {
      const postsRes = await axios.get(`${getApiBase()}/api/posts/my-posts`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: POSTS_BATCH_SIZE,
          offset: requestOffset,
        },
      });
      const newPosts = Array.isArray(postsRes.data) ? postsRes.data : [];
      setUserPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
      setPostsOffset(requestOffset + newPosts.length);
      setHasMorePosts(newPosts.length === POSTS_BATCH_SIZE);
    } catch (err) {
      console.error("Failed to fetch profile posts", err);
      if (reset) {
        setUserPosts([]);
      }
    } finally {
      if (showLoading) {
        setPostsLoading(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await axios.post(`${getApiBase()}/api/profile/update-comprehensive`, {
        // User fields
        fullName,
        email,
        phone,
        location,
        dateOfBirth,
        interests,
        youtubeSubscriptions,
        spotifyArtists: musicArtists,
        // Profile fields
        bio,
        vibeTags,
        hobbies,
        musicTaste,
        learningGoals,
        profilePicUrl,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast("Profile saved successfully!");
      
      // Refresh profile data
      const profileRes = await axios.get(`${getApiBase()}/api/profile/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = profileRes.data || {};
      setUser(d);
      setFullName(d.fullName || "");
      setEmail(d.email || "");
      setPhone(d.phone || "");
      setLocation(d.location || "");
      setDateOfBirth(d.dateOfBirth || "");
      setBio(d.bio || "");
      setVibeTags(d.vibeTags || "");
      setHobbies(d.hobbies || "");
      setMusicTaste(d.musicTaste || "");
      setLearningGoals(d.learningGoals || "");
      setProfilePicUrl(d.profilePicUrl || "");
      setInterests(d.interests || "");
      setYoutubeSubscriptions(d.youtubeSubscriptions || "");
      setMusicArtists(d.spotifyArtists || d.musicArtists || "");
    } catch (err) {
      console.error("Failed to update profile", err);
      const msg =
        typeof err.response?.data === "string"
          ? err.response.data.replace(/^Error:\s*/i, "").trim()
          : err.response?.data?.error || err.response?.data?.message || err.message;
      showToast(msg || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!token) {
        setUser({ fullName: "You" });
        return;
      }
      try {
        // Fetch comprehensive profile
        const profileRes = await axios.get(`${getApiBase()}/api/profile/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = profileRes.data && typeof profileRes.data === "object" ? profileRes.data : {};
        setUser(d);
        setFullName(d.fullName || "");
        setEmail(d.email || "");
        setPhone(d.phone || "");
        setLocation(d.location || "");
        setDateOfBirth(d.dateOfBirth || "");
        setBio(d.bio || "");
        setVibeTags(d.vibeTags || "");
        setHobbies(d.hobbies || "");
        setMusicTaste(d.musicTaste || "");
        setLearningGoals(d.learningGoals || "");
        setProfilePicUrl(d.profilePicUrl || "");
        setInterests(d.interests || "");
        setYoutubeSubscriptions(d.youtubeSubscriptions || "");
        setMusicArtists(d.spotifyArtists || d.musicArtists || "");

        await fetchUserPosts({ reset: true, showLoading: true });

        // Fetch total posts count (not just currently loaded page)
        try {
          const postsCountRes = await axios.get(`${getApiBase()}/api/posts/my-posts/count`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setTotalPostsCount(Number(postsCountRes.data?.count || 0));
        } catch (e) {
          console.error("Failed to fetch total posts count:", e);
          setTotalPostsCount(0);
        }

        // Fetch vibes count
        try {
          const vibesRes = await axios.get(`${getApiBase()}/api/friend-request/count/vibes`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setVibesCount(vibesRes.data.vibes || 0);
        } catch (e) {
          console.error("Failed to fetch vibes count:", e);
        }

        // Fetch matches count
        try {
          const matchesRes = await axios.get(`${getApiBase()}/api/friend-request/count/matches`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setMatchesCount(matchesRes.data.matches || 0);
        } catch (e) {
          console.error("Failed to fetch matches count:", e);
        }
      } catch (err) {
        console.error("Profile fetch failed", err);
        showToast("Could not load your profile.");
        setUser({ fullName: "You" });
      }
    };
    fetchProfileData();
  }, [showToast, token]);

  useEffect(() => {
    const root = document.querySelector("main");
    const target = root || window;
    const onScroll = () => {
      if (!hasMorePosts || postsLoading || isFetchingMorePosts) return;
      const nearBottom = root
        ? root.scrollTop + root.clientHeight >= root.scrollHeight - 240
        : window.innerHeight + window.scrollY >= document.body.offsetHeight - 240;
      if (!nearBottom) return;

      setIsFetchingMorePosts(true);
      fetchUserPosts({ reset: false, showLoading: false }).finally(() => {
        setIsFetchingMorePosts(false);
      });
    };

    target.addEventListener("scroll", onScroll);
    return () => target.removeEventListener("scroll", onScroll);
  }, [hasMorePosts, postsLoading, isFetchingMorePosts, postsOffset]);

  if (!user) return <div className="p-20 text-center text-slate-500">Syncing frequency...</div>;

  const getSpotifyTrackId = (uri) => {
    if (!uri) return null;
    const spotifyUriMatch = uri.match(/spotify:track:([A-Za-z0-9]+)/);
    if (spotifyUriMatch) return spotifyUriMatch[1];
    const spotifyUrlMatch = uri.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/);
    return spotifyUrlMatch ? spotifyUrlMatch[1] : null;
  };

  const isYouTubeLink = (uri) => typeof uri === "string" && /(youtube\.com|youtu\.be)/i.test(uri);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-20"
    >
      {/* 🔝 IDENTITY HEADER */}
      <header className="flex flex-col md:flex-row items-center gap-10 md:gap-20 mb-12 px-4">
        <div className="relative group">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-linear-to-tr from-purple-500 via-pink-500 to-indigo-500">
            <img 
              src={profilePicUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.fullName || "u")}`} 
              className="w-full h-full rounded-full border-4 border-[#050505] object-cover bg-slate-800"
              alt="Profile"
            />
          </div>
        </div>

        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <h2 className="text-2xl font-light tracking-tight">{user.fullName}</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditOpen(!isEditOpen)} 
                className="bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
              >
                {isEditOpen ? (
                  <>
                    <ChevronUp size={16} /> Close Edit
                  </>
                ) : (
                  <>
                    <Edit2 size={16} /> Edit Profile
                  </>
                )}
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full">
                <Settings size={20} />
              </button>
            </div>
          </div>

          <div className="flex justify-center md:justify-start gap-8 text-sm">
            <span><strong>{totalPostsCount}</strong> posts</span>
            <span><strong>{vibesCount}</strong> vibes</span>
            <span><strong>{matchesCount}</strong> matches</span>
          </div>

          {/* Edit Section - Comprehensive Form */}
          <AnimatePresence>
            {isEditOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="max-w-2xl mx-auto md:mx-0 space-y-4 bg-white/5 border border-white/10 p-6 rounded-2xl max-h-[70vh] overflow-y-auto"
              >
                {/* Personal Information */}
                <div className="border-b border-white/10 pb-4">
                  <p className="text-xs text-slate-400 font-bold mb-3">PERSONAL INFORMATION</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Phone</label>
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Location</label>
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, Country"
                        className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="border-b border-white/10 pb-4">
                  <p className="text-xs text-slate-400 font-bold mb-3">PROFILE INFORMATION</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Profile Picture URL (HTTPS)</label>
                      <input
                        value={profilePicUrl}
                        onChange={(e) => setProfilePicUrl(e.target.value)}
                        placeholder="https://i.imgur.com/....jpg"
                        className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        maxLength={4000}
                        className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm resize-none"
                        rows={3}
                      />
                      <p className="text-[9px] text-slate-500 mt-1">{bio.length}/4000 characters</p>
                    </div>
                  </div>
                </div>

                {/* Interests & Tags */}
                <div className="border-b border-white/10 pb-4">
                  <p className="text-xs text-slate-400 font-bold mb-3">INTERESTS & TAGS</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Vibe Tags (comma separated)</label>
                      <input
                        value={vibeTags}
                        onChange={(e) => setVibeTags(e.target.value)}
                        placeholder="music, coding, travel, gaming"
                        className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Hobbies (comma separated)</label>
                      <input
                        value={hobbies}
                        onChange={(e) => setHobbies(e.target.value)}
                        placeholder="Photography, Gaming, Reading, Cooking"
                        className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Music Taste (comma separated)</label>
                      <input
                        value={musicTaste}
                        onChange={(e) => setMusicTaste(e.target.value)}
                        placeholder="Indie, Electronic, Hip-hop, Jazz"
                        className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Learning Goals (comma separated)</label>
                      <input
                        value={learningGoals}
                        onChange={(e) => setLearningGoals(e.target.value)}
                        placeholder="Python, Web Development, UI Design, Data Science"
                        className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">General Interests (comma separated)</label>
                      <input
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        placeholder="AI, Startups, Entrepreneurship, Music Production"
                        className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Connected Services */}
                <div className="pb-4">
                  <p className="text-xs text-slate-400 font-bold mb-3">CONNECTED SERVICES</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">YouTube Subscriptions (comma separated)</label>
                      <input
                        value={youtubeSubscriptions}
                        onChange={(e) => setYoutubeSubscriptions(e.target.value)}
                        placeholder="Channel A, Channel B, Creator X"
                        className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Music Top Artists (comma separated)</label>
                      <input
                        value={musicArtists}
                        onChange={(e) => setMusicArtists(e.target.value)}
                        placeholder="Artist 1, Artist 2, Artist 3"
                        className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between gap-4 pt-2 border-t border-white/10">
                  <button 
                    onClick={() => setIsEditOpen(false)}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Display Section - Always visible */}
          <div className="max-w-2xl mx-auto md:mx-0 space-y-3 bg-white/5 border border-white/10 p-6 rounded-2xl">
            <div className="flex justify-center">
              <img src={profilePicUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`} className="w-24 h-24 rounded-full border-4 border-[#050505] object-cover" alt="Profile" />
            </div>

            <div className="text-center md:text-left space-y-3">
               <div>
                 <p className="font-bold text-sm">{user.fullName}</p>
                 {user.email && <p className="text-xs text-slate-500">{user.email}</p>}
               </div>

               {user.location && (
                 <p className="text-xs text-slate-400">📍 {user.location}</p>
               )}

               {bio && (
                 <div>
                   <p className="text-xs text-slate-400 font-semibold mb-1">About</p>
                   <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{bio}</p>
                 </div>
               )}

               {vibeTags && (
                 <div>
                   <p className="text-xs text-slate-400 font-semibold mb-2">Vibes</p>
                   <div className="flex flex-wrap gap-2">
                     {vibeTags.split(',').map((tag, i) => (
                       <span key={i} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full">
                         {tag.trim()}
                       </span>
                     ))}
                   </div>
                 </div>
               )}

               {hobbies && (
                 <div>
                   <p className="text-xs text-slate-400 font-semibold mb-1">🎯 Hobbies</p>
                   <p className="text-xs text-slate-300">{hobbies}</p>
                 </div>
               )}

               {musicTaste && (
                 <div>
                   <p className="text-xs text-slate-400 font-semibold mb-1">🎵 Music</p>
                   <p className="text-xs text-slate-300">{musicTaste}</p>
                 </div>
               )}

               {learningGoals && (
                 <div>
                   <p className="text-xs text-slate-400 font-semibold mb-1">📚 Learning</p>
                   <p className="text-xs text-slate-300">{learningGoals}</p>
                 </div>
               )}

               {interests && (
                 <div>
                   <p className="text-xs text-slate-400 font-semibold mb-1">💡 Interests</p>
                   <p className="text-xs text-slate-300">{interests}</p>
                 </div>
               )}

               {musicArtists && (
                 <div>
                   <p className="text-xs text-slate-400 font-semibold mb-1">🎧 Top Artists</p>
                   <p className="text-xs text-slate-300">{musicArtists}</p>
                 </div>
               )}

               {youtubeSubscriptions && (
                 <div>
                   <p className="text-xs text-slate-400 font-semibold mb-1">📺 Subscriptions</p>
                   <p className="text-xs text-slate-300">{youtubeSubscriptions}</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </header>

      {/* 📑 TABS SECTION */}
      <div className="border-t border-white/10 mt-10">
        <div className="flex justify-center gap-12 -mt-px">
          <TabItem icon={<Grid size={14}/>} label="POSTS" active />
          <TabItem icon={<Tag size={14}/>} label="TAGGED" />
        </div>

        {/* 🎞️ CONTENT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mt-6">
          {postsLoading && userPosts.length === 0 ? (
            <div className="col-span-1 md:col-span-2 py-16 text-center text-slate-500">Loading posts...</div>
          ) : userPosts.length > 0 ? userPosts.map((post, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 0.98 }}
              className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden relative group"
            >
              <div className="p-4 space-y-4">
                <p className="text-xs md:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>

                {(() => {
                  const spotifyTrackId = getSpotifyTrackId(post.musicUri);
                  const youtube = isYouTubeLink(post.musicUri);
                  const hasMusic = spotifyTrackId || post.musicUri || post.musicTitle || post.musicArtist || post.musicPreview || post.musicAlbumCover;
                  if (!hasMusic) return null;

                  if (spotifyTrackId) {
                    return (
                      <iframe
                        src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator`}
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="rounded-xl"
                      />
                    );
                  }

                  return (
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={post.musicAlbumCover || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(post.musicTitle || post.content || "song")}`}
                          alt={post.musicTitle || "Attached song"}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{post.musicTitle || "Attached song"}</p>
                          {post.musicArtist && <p className="text-xs text-slate-400 truncate">{post.musicArtist}</p>}
                        </div>
                      </div>

                      {post.musicPreview && !youtube && (
                        <audio controls src={post.musicPreview} className="mt-3 w-full h-8" preload="metadata" />
                      )}

                      {youtube && post.musicUri && (
                        <a
                          href={post.musicUri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 mt-3 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500"
                        >
                          <Play size={12} /> Watch on YouTube
                        </a>
                      )}

                      {post.musicUri && !youtube && !spotifyTrackId && (
                        <a
                          href={post.musicUri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 mt-3 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                        >
                          <Music size={12} /> Open song
                        </a>
                      )}
                    </div>
                  );
                })()}
              </div>
              {/* Hover Overlay */}
                <div className="pointer-events-none absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                 <span className="flex items-center gap-1 font-bold"><Edit2 size={16}/></span>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-1 md:col-span-2 py-20 text-center">
               <p className="text-slate-600">Share your first vibe to start your grid.</p>
            </div>
          )}
          {isFetchingMorePosts && (
            <div className="col-span-1 md:col-span-2 py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading more posts...
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const TabItem = ({ icon, label, active }) => (
  <button className={`flex items-center gap-2 py-4 text-xs font-bold tracking-widest transition-all ${active ? 'border-t border-white text-white' : 'text-slate-500'}`}>
    {icon} {label}
  </button>
);

export default Profile;
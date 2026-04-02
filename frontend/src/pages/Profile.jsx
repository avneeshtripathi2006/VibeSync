import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Edit2, Grid, Bookmark, Tag, ChevronUp, ChevronDown } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [bio, setBio] = useState("");
  const [vibeTags, setVibeTags] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const token = localStorage.getItem("token");

  const handleSaveProfile = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/profile/update`, {
        bio,
        vibeTags,
        profilePicUrl,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh profile data after save
      const profileRes = await axios.get(`${API_BASE}/api/profile/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(profileRes.data);
      setBio(profileRes.data.bio || "");
      setVibeTags(profileRes.data.vibeTags || "");
      setProfilePicUrl(profileRes.data.profilePicUrl || "");
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Could not save profile. Try again.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7486/ingest/acfb494f-e1a9-47f6-8548-4a7650be671c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'134bb9'},body:JSON.stringify({sessionId:'134bb9',location:'frontend/src/pages/Profile.jsx:fetchProfileData:profileRequest',message:'profile request',data:{endpoint:'/api/profile/my',tokenPresent:!!token},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        // Fetch User Info
        const profileRes = await axios.get(`${API_BASE}/api/profile/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(profileRes.data);
        setBio(profileRes.data.bio || "");
        setVibeTags(profileRes.data.vibeTags || "");
        setProfilePicUrl(profileRes.data.profilePicUrl || "");

        // #region agent log
        fetch('http://127.0.0.1:7486/ingest/acfb494f-e1a9-47f6-8548-4a7650be671c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'134bb9'},body:JSON.stringify({sessionId:'134bb9',location:'frontend/src/pages/Profile.jsx:fetchProfileData:profileResponseShape',message:'profile response shape',data:{hasProfileId:profileRes.data?.id!=null,hasFullName:profileRes.data?.fullName!=null,hasBio:profileRes.data?.bio!=null,hasVibeTags:profileRes.data?.vibeTags!=null,hasUserField:profileRes.data?.user!=null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        // Fetch only THIS user's posts
        // #region agent log
        fetch('http://127.0.0.1:7486/ingest/acfb494f-e1a9-47f6-8548-4a7650be671c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'134bb9'},body:JSON.stringify({sessionId:'134bb9',location:'frontend/src/pages/Profile.jsx:fetchProfileData:postsRequest',message:'posts request',data:{endpoint:'/api/posts/my-posts',tokenPresent:!!token},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        const postsRes = await axios.get(`${API_BASE}/api/posts/my-posts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserPosts(postsRes.data);

        // #region agent log
        fetch('http://127.0.0.1:7486/ingest/acfb494f-e1a9-47f6-8548-4a7650be671c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'134bb9'},body:JSON.stringify({sessionId:'134bb9',location:'frontend/src/pages/Profile.jsx:fetchProfileData:postsResponseShape',message:'posts response shape',data:{postsCount:Array.isArray(postsRes.data)?postsRes.data.length:null,hasUserOnFirstItem:!!postsRes.data?.[0]?.user},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      } catch (err) {
        console.error("Profile fetch failed", err);

        // #region agent log
        fetch('http://127.0.0.1:7486/ingest/acfb494f-e1a9-47f6-8548-4a7650be671c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'134bb9'},body:JSON.stringify({sessionId:'134bb9',location:'frontend/src/pages/Profile.jsx:fetchProfileData:error',message:'profile/posts request failed',data:{status:err?.response?.status||null,hasResponseData:!!err?.response?.data,axiosErrorMessage:!!err?.message},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      }
    };
    fetchProfileData();
  }, []);

  if (!user) return <div className="p-20 text-center text-slate-500">Syncing frequency...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-20"
    >
      {/* 🔝 IDENTITY HEADER */}
      <header className="flex flex-col md:flex-row items-center gap-10 md:gap-20 mb-12 px-4">
        <div className="relative group">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`} 
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
            <span><strong>{userPosts.length}</strong> posts</span>
            <span><strong>84</strong> vibes</span>
            <span><strong>12</strong> matches</span>
          </div>

          {/* Edit Section - Expandable */}
          <AnimatePresence>
            {isEditOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="max-w-xs mx-auto md:mx-0 space-y-4 bg-white/5 border border-white/10 p-6 rounded-2xl"
              >
                <div className="text-left">
                  <label className="block text-xs text-slate-400 mb-1">Profile picture URL</label>
                  <input value={profilePicUrl} onChange={(e) => setProfilePicUrl(e.target.value)} placeholder="https://..." className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm" />
                </div>

                <div className="text-left">
                  <label className="block text-xs text-slate-400 mb-1">Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm resize-none" rows={3} />
                </div>

                <div className="text-left">
                  <label className="block text-xs text-slate-400 mb-1">Vibe tags (comma separated)</label>
                  <input value={vibeTags} onChange={(e) => setVibeTags(e.target.value)} placeholder="music,coding,travel" className="w-full rounded-lg p-2 bg-slate-900 border border-white/10 text-sm" />
                </div>

                <div className="flex justify-between gap-4 pt-2">
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
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Display Section - Always visible */}
          <div className="max-w-xs mx-auto md:mx-0 space-y-3 bg-white/5 border border-white/10 p-6 rounded-2xl">
            <div className="flex justify-center">
              <img src={profilePicUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`} className="w-24 h-24 rounded-full border-4 border-[#050505] object-cover" alt="Profile" />
            </div>

            <div className="text-center md:text-left">
               <p className="font-bold text-sm mb-1">{user.fullName}</p>
               <p className="text-sm text-slate-400 whitespace-pre-wrap leading-relaxed">
                 {bio || "No frequency signal detected..."}
               </p>
               {vibeTags && (
                 <div className="mt-3 flex flex-wrap gap-2">
                   {vibeTags.split(',').map((tag, i) => (
                     <span key={i} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full">
                       {tag.trim()}
                     </span>
                   ))}
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
        <div className="grid grid-cols-3 gap-1 md:gap-8 mt-6">
          {userPosts.length > 0 ? userPosts.map((post, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 0.98 }}
              className="aspect-square bg-white/5 border border-white/5 rounded-sm md:rounded-xl overflow-hidden relative group cursor-pointer"
            >
              <div className="p-4 h-full flex flex-col justify-center text-center">
                 <p className="text-[10px] md:text-sm text-slate-300 line-clamp-4 italic">
                   "{post.content}"
                 </p>
              </div>
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                 <span className="flex items-center gap-1 font-bold"><Edit2 size={16}/></span>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-3 py-20 text-center">
               <p className="text-slate-600">Share your first vibe to start your grid.</p>
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
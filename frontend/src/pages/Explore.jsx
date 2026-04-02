import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Heart, MessageCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const fetchAllPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/posts/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPosts();
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Explore Vibes</h1>
        <p className="text-slate-400">Discover what others are sharing</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-slate-400">Loading vibes...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-slate-500">No vibes yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm hover:border-white/20 transition-all group"
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.fullName || 'unknown'}`}
                  className="w-12 h-12 rounded-full bg-slate-800 border border-indigo-500/20"
                  alt="Avatar"
                />
                <div className="flex-1">
                  <p className="font-bold text-sm text-white">{post.user?.fullName || 'Anonymous'}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
                    {new Date(post.createdAt).toLocaleString([], {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed mb-4">{post.content}</p>

              <div className="flex gap-4 text-slate-400 group-hover:text-indigo-400 transition-colors">
                <button className="flex items-center gap-2 text-sm hover:scale-110 transition-transform">
                  <Heart size={16} />
                  <span>Like</span>
                </button>
                <button className="flex items-center gap-2 text-sm hover:scale-110 transition-transform">
                  <MessageCircle size={16} />
                  <span>Reply</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;

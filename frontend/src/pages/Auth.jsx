import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Github, Music } from "lucide-react"

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });

  // Check for OAuth success callback
  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    const error = searchParams.get('error');

    if (token) {
      // OAuth login successful
      localStorage.setItem("token", token);
      navigate("/home");
    } else if (error) {
      // OAuth login failed
      alert("OAuth authentication failed. Please try again.");
    }
  }, [searchParams, navigate]);

  // Redirect to /home if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home");
    }
  }, [navigate]);

  const LOCAL_API_URL = "http://localhost:8080";
  const REMOTE_API_URL = import.meta.env.VITE_API_URL || "https://vibesync.onrender.com";

  const [apiUrl, setApiUrl] = useState(LOCAL_API_URL);

  useEffect(() => {
    const chooseApiUrl = async () => {
      try {
        const res = await fetch(`${LOCAL_API_URL}/auth/test`, { method: 'GET', mode: 'cors' });
        if (res.ok) {
          setApiUrl(LOCAL_API_URL);
          return;
        }
      } catch (_) {
        // localhost not available
      }
      setApiUrl(REMOTE_API_URL);
    };

    chooseApiUrl();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isLogin ? `${apiUrl}/auth/login` : `${apiUrl}/auth/signup`;
    try {
      const response = await axios.post(url, formData);
      const data = response.data;

      // If it's a login and the response isn't an error message
      if (isLogin) {
        if (typeof data === 'string' && data.includes("Error")) {
          alert(data);
        } else {
          // 💾 This is the key part!
          localStorage.setItem("token", data); 
          navigate("/home"); // 🚀 Redirect to home page
        }
      } else {
        alert(typeof data === 'string' ? data : "User registered successfully!"); // Shows signup response
        setIsLogin(true); // Switch to login mode automatically
      }
    } catch (error) {
      console.error("Auth error:", error);
      alert(error.response?.data || "Backend connection failed!");
    }
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = `${apiUrl}/auth/oauth2/${provider}`;
  };

  const SocialButton = ({ icon, label, provider }) => (
    <button
      onClick={() => handleOAuthLogin(provider)}
      className="flex-1 flex items-center justify-center gap-2 bg-[#1e293b] border border-white/5 py-2.5 rounded-xl hover:bg-[#334155] transition-all"
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  // Add this helper for the Google Icon if you don't have an SVG
  const GoogleIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z" />
      <path fill="#34A853" d="M16.04 18.013c-1.09.693-2.459 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823L1.29 17.38c1.978 3.922 6.04 6.62 10.71 6.62 3.037 0 5.811-1.036 7.941-2.799l-3.9-3.188z" />
      <path fill="#4285F4" d="M19.94 21.214c2.506-2.07 4.06-5.555 4.06-9.214 0-.785-.07-1.533-.204-2.25H12v4.42h6.917c-.312 1.563-1.19 2.891-2.506 3.784l3.53 3.26z" />
      <path fill="#FBBC05" d="M5.277 14.268a7.12 7.12 0 0 1 0-4.515L1.25 6.638a11.985 11.985 0 0 0 0 10.741l4.027-3.111z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center p-6 text-slate-200">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="text-white text-2xl font-black italic">VS</span>
        </div>
        <h1 className="text-2xl font-bold mt-4 text-white">
            {isLogin ? "Welcome back" : "Create your vibe"}
        </h1>
      </div>

      <div className="w-full max-w-md bg-[#111827]/50 border border-white/5 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl">
        {/* 🛡️ Wrapped in a FORM for the handleSubmit to work */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 📝 Show Full Name ONLY during Signup */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
              <input 
                type="text" 
                required
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email address</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
            />
          </div>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-600/20 transition-all">
            {isLogin ? "Sign in" : "Register"}
          </button>
        </form>

        <div className="relative flex items-center justify-center py-6">
          <div className="flex-grow border-t border-gray-800"></div>
          <span className="px-3 text-[10px] text-gray-500 uppercase tracking-widest">Or continue with</span>
          <div className="flex-grow border-t border-gray-800"></div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <SocialButton icon={<GoogleIcon />} label="Google" provider="google" />
          <SocialButton icon={<Github size={18} />} label="GitHub" provider="github" />
          <SocialButton icon={<Music size={18} className="text-green-500" />} label="Spotify" provider="spotify" />
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        {isLogin ? "Not a member?" : "Already have an account?"} 
        <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-400 font-bold ml-1 hover:underline"
        >
          {isLogin ? "Join the Tribe" : "Login here"}
        </button>
      </p>
    </div>
  );
};

export default Auth;
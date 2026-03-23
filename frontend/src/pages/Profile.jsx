import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


const Profile = () => {
  const [profile, setProfile] = useState({ bio: "", vibeTags: "" });
  const navigate = useNavigate();

  // 1. Fetch data when page opens
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get("http://localhost:8080/api/profile/my", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Full Backend Response:", res.data); // 👈 CHECK THIS IN CONSOLE

        if (res.data) {
          // We use || '' to ensure it never becomes 'undefined'
          setProfile({
            bio: res.data.bio || "",
            vibeTags: res.data.vibeTags || "",
          });
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        "http://localhost:8080/api/profile/update",
        profile,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert(res.data);
    } catch (err) {
      alert("Error saving profile!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Vibe Check</h1>
        <form onSubmit={handleUpdate} className="space-y-4">
          <textarea
            value={profile.bio} // 👈 Critical: This connects the state to the box
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="w-full p-4 bg-slate-800 rounded-xl"
            placeholder="Your Bio"
          />
          <input
            type="text"
            value={profile.vibeTags} // 👈 Critical: This connects the state to the box
            onChange={(e) =>
              setProfile({ ...profile, vibeTags: e.target.value })
            }
            className="w-full p-4 bg-slate-800 rounded-xl"
            placeholder="Tags"
          />
          <button className="w-full py-4 bg-purple-600 rounded-xl font-bold">
            Save My Vibe
          </button>
        </form>
        <button
        onClick={() => navigate("/matches")}
        className="bg-purple-600 p-2 rounded"
      >
        Check My Vibe Tribe
      </button>
      </div>
    </div>
  );
};

export default Profile;

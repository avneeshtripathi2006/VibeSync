import { useState } from 'react'
import axios from 'axios'

function App() {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Signup
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isLogin ? "http://localhost:8080/auth/login" : "http://localhost:8080/auth/signup";
    
    try {
      const response = await axios.post(url, formData);
      alert(response.data);
    } catch (error) {
      alert("Connection failed!");
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1>{isLogin ? "🔑 VibeSync Login" : "🚀 VibeSync Signup"}</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px', margin: '0 auto', gap: '15px' }}>
        {!isLogin && (
          <input type="text" placeholder="Full Name" onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
        )}
        <input type="email" placeholder="Email" onChange={(e) => setFormData({...formData, email: e.target.value})} />
        <input type="password" placeholder="Password" onChange={(e) => setFormData({...formData, password: e.target.value})} />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#646cff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {isLogin ? "Login" : "Create Account"}
        </button>
      </form>

      <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: 'pointer', color: '#646cff', marginTop: '20px' }}>
        {isLogin ? "New here? Create an account" : "Already have an account? Login"}
      </p>
    </div>
  );
}

export default App;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../config';
// import removed to bypass NPM

const Login = () => {
  const [role, setRole] = useState('Admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // If already logged in, redirect to correct dashboard
  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info');
    if (token && token !== 'undefined' && token !== 'null' && userInfo) {
      try {
        const user = JSON.parse(userInfo);
        if (user.role === 'Admin') navigate('/admin', { replace: true });
        else if (user.role === 'Doctor') navigate('/doctor', { replace: true });
        else navigate('/patient', { replace: true });
      } catch (e) {
        // Malformed user_info, clear and stay on login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_info', JSON.stringify(data.user));
        
        if (data.user.role === 'Admin') navigate('/admin');
        else if (data.user.role === 'Doctor') navigate('/doctor');
        else navigate('/patient');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error connecting to the server');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden">
      {/* Central Holographic Form */}
      <div className="anti-gravity-card p-10 w-full max-w-md floating relative">
        <div className="absolute inset-x-0 -top-6 flex justify-center">
          <div className="w-16 h-16 bg-[#007BFF] rounded-full flex items-center justify-center edge-glow">
            {/* Logo */}
            <span className="text-2xl">🛡️</span>
          </div>
        </div>

        <h2 className="text-3xl font-black text-center mt-6 mb-2 text-white tracking-widest uppercase">DR Detect AI</h2>
        <p className="text-blue-200 text-center text-sm mb-6 font-medium">Advanced Clinical Screening</p>

        {error && <div className="bg-red-500/20 border border-red-500 text-red-300 text-xs p-3 rounded-lg mb-4 text-center">{error}</div>}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">

          <div>
            <label className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1 block">Email</label>
            <input 
              type="email" 
              placeholder="user@drdetect.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0A2540]/60 border border-blue-500/30 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1 block">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0A2540]/60 border border-blue-500/30 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="text-right">
            <a href="#" className="text-xs text-blue-400 hover:text-blue-300 font-medium">Forgot Password?</a>
          </div>

          <button type="submit" className="mt-4 w-full bg-[#007BFF] hover:bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-xl edge-glow transition-all active:scale-95">
            Login
          </button>
        </form>

        <div className="text-center mt-6 flex flex-col gap-3">
          <button onClick={() => navigate('/register')} className="text-xs text-blue-400 hover:text-blue-300 font-medium">New User? Create an Account</button>
          <button onClick={() => navigate('/demo')} className="text-xs uppercase tracking-[0.25em] text-white bg-blue-500/15 border border-blue-500/30 rounded-full px-4 py-3 hover:bg-blue-500/25 transition font-bold">
            Try Demo Mode
          </button>
        </div>
      </div>

      <div className="fixed bottom-6 left-6 text-sm font-bold text-blue-500 uppercase tracking-wider">
        DR Detect AI Platform v2.0
      </div>
    </div>
  );
};

export default Login;

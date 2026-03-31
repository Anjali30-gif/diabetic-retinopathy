import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [role, setRole] = useState('Doctor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error connecting to the server');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden">
      <div className="anti-gravity-card p-10 w-full max-w-md floating relative">
        <div className="absolute inset-x-0 -top-6 flex justify-center">
          <div className="w-16 h-16 bg-[#007BFF] rounded-full flex items-center justify-center edge-glow">
            <span className="text-2xl">🛡️</span>
          </div>
        </div>

        <h2 className="text-3xl font-black text-center mt-6 mb-2 text-white tracking-widest uppercase">Register Access</h2>
        <p className="text-blue-200 text-center text-sm mb-6 font-medium">Create a clinical account</p>

        {showSuccess ? (
          <div className="bg-green-500/20 border border-green-500 text-green-300 p-8 rounded-2xl mb-4 text-center flex flex-col items-center gap-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="text-5xl text-green-400 drop-shadow-[0_0_15px_#10b981]">✅</span>
            <div>
              <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2">Account Created Successfully</h3>
              <p className="text-xs font-medium text-slate-300">Your credential profile has been verified and registered on the platform securely.</p>
            </div>
            <button onClick={() => navigate('/')} className="mt-4 text-xs font-black uppercase hover:text-white px-8 py-4 bg-[#10b981] shadow-lg shadow-green-500/50 hover:bg-green-600 rounded-xl text-black transition-all w-full tracking-widest active:scale-95">Go to Login Dashboard</button>
          </div>
        ) : (
          <>
            {error && <div className="bg-red-500/20 border border-red-500 text-red-300 text-xs p-3 rounded-lg mb-4 text-center">{error}</div>}

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1 block">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Dr. Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#0A2540]/60 border border-blue-500/30 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1 block">Role</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#0A2540]/60 border border-blue-500/30 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="Admin">Admin</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Patient">Patient</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1 block">Email</label>
                <input 
                  type="email" 
                  placeholder="jane@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                  required
                  className="w-full bg-[#0A2540]/60 border border-blue-500/30 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <button type="submit" className="mt-4 w-full bg-[#007BFF] hover:bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-xl edge-glow transition-all active:scale-95">
                Create Account
              </button>
            </form>

            <div className="text-center mt-6">
              <button onClick={() => navigate('/')} className="text-xs text-blue-400 hover:text-blue-300 font-medium">Already have an account? Login</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;

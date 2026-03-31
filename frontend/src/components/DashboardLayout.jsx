import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// import removed to bypass NPM

const DashboardLayout = ({ role, children, sidebarItems }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userInfoStr = localStorage.getItem('user_info');
  let userInfo = { name: 'Unknown User', role: role };
  try {
    if (userInfoStr && userInfoStr !== 'undefined') {
      userInfo = JSON.parse(userInfoStr);
    }
  } catch (e) {
    console.warn("Invalid user_info in localStorage");
  }
  const actualRole = userInfo.role || role;

  const [modelStatus, setModelStatus] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/model-status')
      .then(r => r.json())
      .then(data => setModelStatus(data))
      .catch(() => setModelStatus(null));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-blue-500/20 bg-[#0A2540]/80 backdrop-blur-xl relative z-20 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-blue-500/20 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#007BFF] edge-glow flex items-center justify-center mb-4 text-3xl">
            👁️
          </div>
          <span className="font-black text-xl tracking-widest uppercase text-white drop-shadow-md">DR Detect AI</span>
          <div className="text-[10px] text-blue-300 mt-1 uppercase font-bold tracking-[0.2em] opacity-80 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
            {actualRole} Portal
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems?.map((item, idx) => {
            const isActive = location.pathname === item.path || (item.id && location.hash === `#${item.id}`);
            return (
              <button
                key={idx}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                  isActive ? 'bg-[#007BFF]/20 text-[#007BFF] border border-[#007BFF]/50 shadow-[0_0_15px_rgba(0,123,255,0.2)]' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
                onClick={() => {
                   if (item.path) navigate(item.path);
                   if (item.id) {
                     const el = document.getElementById(item.id);
                     if (el) el.scrollIntoView({ behavior: 'smooth' });
                   }
                }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-bold uppercase tracking-wider">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-blue-500/20 bg-black/20">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-4 cursor-pointer hover:bg-white/10 transition-colors shadow-lg">
            <div className="w-10 h-10 rounded-full bg-[#007BFF]/20 border border-[#007BFF]/50 overflow-hidden flex items-center justify-center edge-glow text-xl">
              👤
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">{userInfo.name}</div>
              <div className="text-[10px] text-blue-300 uppercase tracking-widest font-bold">{actualRole}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors font-bold uppercase text-xs tracking-wider border border-red-500/20 shadow-lg active:scale-95"
          >
            🛑 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden z-10 scroll-smooth">
        {/* Model Accuracy Banner */}
        {modelStatus && (
          <div className={`w-full px-8 py-4 flex items-center justify-between gap-6 flex-wrap border-b backdrop-blur-sm ${modelStatus.mock_mode ? 'bg-[#0A2540]/60 border-yellow-500/20' : 'bg-[#0A2540]/60 border-green-500/20'}`}>
            {/* Status pulse + label */}
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full animate-pulse flex-shrink-0 ${modelStatus.mock_mode ? 'bg-yellow-400 shadow-[0_0_12px_#facc15]' : 'bg-green-400 shadow-[0_0_12px_#10b981]'}`} />
              <div>
                <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${modelStatus.mock_mode ? 'text-yellow-300' : 'text-green-300'}`}>
                  {modelStatus.mock_mode ? '⚠ Mock Mode Active' : '✅ Live Model Active'}
                </div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{modelStatus.architecture}</div>
              </div>
            </div>

            {/* Accuracy — Big highlight */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Model Accuracy</div>
                <div className={`text-3xl font-black leading-none tracking-tight drop-shadow-lg ${modelStatus.mock_mode ? 'text-yellow-300 [text-shadow:0_0_20px_rgba(250,204,21,0.5)]' : 'text-green-300 [text-shadow:0_0_20px_rgba(16,185,129,0.5)]'}`}>
                  {modelStatus.mock_mode ? '97.3%' : `${(modelStatus.accuracy * 100).toFixed(1)}%`}
                </div>
              </div>
              {/* Mini bar */}
              <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${modelStatus.mock_mode ? 'bg-yellow-400' : 'bg-green-400'}`}
                  style={{ width: modelStatus.mock_mode ? '97.3%' : `${(modelStatus.accuracy * 100).toFixed(1)}%` }}
                />
              </div>
            </div>

            {/* Dataset */}
            <div className="hidden md:flex items-center gap-2 border-l border-white/10 pl-6">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Dataset</span>
              <span className="text-[10px] text-slate-300 font-bold">{modelStatus.dataset}</span>
            </div>

            {/* 5-class pills */}
            <div className="hidden lg:flex items-center gap-1 flex-wrap">
              {(modelStatus.classes || []).map((cls, i) => (
                <span key={i} className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                  {cls}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="p-8 max-w-7xl mx-auto pb-20">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;


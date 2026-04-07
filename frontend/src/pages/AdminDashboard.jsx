import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import DashboardLayout from '../components/DashboardLayout';
import Scanner from './Scanner';
import API_BASE from '../config';
// import removed to bypass NPM

const AdminDashboard = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getMonthlyStats = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const stats = new Array(7).fill(0);
    historyRecords.forEach(rec => {
      const parts = rec.date.split(' ');
      if (parts.length >= 2) {
          const mIdx = months.indexOf(parts[1]);
          if (mIdx !== -1) stats[mIdx]++;
      }
    });
    const max = Math.max(...stats, 1);
    return stats.map(s => (s / max) * 100);
  };

  const getSeverityDistribution = () => {
    const dist = {};
    historyRecords.forEach(r => {
       dist[r.label] = (dist[r.label] || 0) + 1;
    });
    return dist;
  };

  const sidebarItems = [
    { label: 'System Overview', icon: '📊', id: 'overview' },
    { label: 'New Scan', icon: '🔍', id: 'scan' },
    { label: 'Staff Management', icon: '👥', id: 'staff' },
    { label: 'Analysis', icon: '📈', id: 'analysis' },
    { label: 'History', icon: '🕒', id: 'history' },
    { label: 'Settings', icon: '⚙️', id: 'settings' },
    { label: 'Profile', icon: '👤', path: '/profile' }
  ];

  const metrics = [
    { label: 'Total Scans Processed', value: (historyRecords?.length || 0).toString(), color: 'text-blue-400', glow: 'rgba(0,123,255,0.4)', bg: 'bg-blue-500/10' },
    { label: 'Active Staff', value: (teamData?.length || 0).toString(), color: 'text-green-400', glow: 'rgba(16,185,129,0.4)', bg: 'bg-green-500/10' },
    { label: 'High Risk Cases', value: (historyRecords?.filter(r => (r.level || 0) >= 50).length || 0).toString(), color: 'text-red-400', glow: 'rgba(239,68,68,0.4)', bg: 'bg-red-500/10' },
    { label: 'System Uptime', value: '99.9%', color: 'text-orange-400', glow: 'rgba(249,115,22,0.4)', bg: 'bg-orange-500/10' }
  ];

  useEffect(() => {
    const socket = io('http://127.0.0.1:5000');
    
    if (socket) {
      socket.on('new_scan', (data) => {
        setHistoryRecords(prev => [data, ...prev]);
        // Simple built-in notification for real-time feel
        if (notifications) {
           const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
           audio.play().catch(() => {});
        }
      });
      socket.on('new_user', (data) => {
         setTeamData(prev => [...prev, data]);
      });
      socket.on('patient_checkin', (data) => {
         if (notifications) {
             const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
             audio.play().catch(() => {});
             alert(`[System Alert] Patient Check-in! Visit Code: ${data.visitCode}`);
         }
      });
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const [recordsRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/api/records`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/users`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (recordsRes.status === 401 || usersRes.status === 401) {
            console.error("Admin: Token invalid/expired (401). Redirecting to login.");
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
            navigate('/');
            return;
        }
        if (recordsRes.status === 422 || usersRes.status === 422) {
            console.error("Admin: JWT format error (422). Token may be old — please log out and log in again.");
            // Don't redirect — just show no data. User can log out manually.
        }


        if (recordsRes.ok) {
          const data = await recordsRes.json();
          setHistoryRecords(data);
        }
        if (usersRes.ok) {
          const data = await usersRes.json();
          setTeamData(data);
        }
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => { if (socket) socket.disconnect(); };
  }, [notifications, navigate]);

  return (
    <DashboardLayout role="Admin" sidebarItems={sidebarItems}>
      <Scanner />

      {/* System Overview */}
      <section id="overview" className="mb-12 pt-4 scroll-mt-8">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg">System Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((m, i) => (
            <div key={i} className={`anti-gravity-card p-6 floating overflow-hidden relative ${m.bg}`} style={{ animationDelay: `${i * 0.5}s` }}>
              <div className="absolute -inset-10 bg-gradient-to-tr from-white/5 to-transparent blur-2xl z-0 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-3 opacity-80">{m.label}</h3>
                <div 
                  className={`text-5xl font-black ${m.color}`}
                  style={{ textShadow: `0 0 25px ${m.glow}` }}
                >
                  {m.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mock Chart Area */}
        <div className="anti-gravity-card p-8 h-96 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-6">Scan Volume (Monthly)</h3>
          <div className="flex-1 flex items-end gap-6 justify-between pt-6 border-b-2 border-l-2 border-blue-500/30 px-6 pb-2 relative z-10">
            {getMonthlyStats().map((h, idx) => (
              <div key={idx} className="w-full relative group h-full flex items-end">
                <div 
                    className="w-full bg-gradient-to-t from-[#007BFF] to-[#00bfff] rounded-t-md edge-glow transition-all duration-500 hover:opacity-100 opacity-70 group-hover:scale-y-105 origin-bottom" 
                    style={{ height: `${h}%` }}>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between px-6 pt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
          </div>
        </div>
      </section>

      {/* Staff Management */}
      <section id="staff" className="mb-12 pt-8 scroll-mt-8">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg">Staff Management</h2>
        <div className="anti-gravity-card overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#007BFF]/10 text-[10px] uppercase tracking-widest text-blue-300 font-black border-b border-blue-500/20">
              <tr>
                <th className="p-5">Staff ID</th>
                <th className="p-5">Name</th>
                <th className="p-5">Role</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-center">Scans Reviewed</th>
                <th className="p-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-500/10 text-sm font-medium">
              {teamData.length === 0 ? (
                <tr>
                   <td colSpan="6" className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No active staff data found in directory.</td>
                </tr>
              ) : (
                teamData.map((staff, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors group">
                    <td className="p-5 font-mono text-blue-300">{staff.id}</td>
                    <td className="p-5 text-white font-bold tracking-wide">{staff.name}</td>
                    <td className="p-5 text-slate-400">{staff.role}</td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${staff.status === 'Active' ? 'badge-green' : 'badge-red'}`}>
                        <span className={`w-2 h-2 rounded-full ${staff.status === 'Active' ? 'bg-green-400 shadow-[0_0_8px_#10b981]' : 'bg-red-400 shadow-[0_0_8px_#ef4444]'}`}></span>
                        {staff.status}
                      </span>
                    </td>
                    <td className="p-5 text-center text-slate-300 font-mono text-lg">{staff.scans}</td>
                    <td className="p-5 text-center space-x-3 text-lg">
                      <button className="p-2.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all hover:scale-110 active:scale-95">✏️</button>
                      <button className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all hover:scale-110 active:scale-95">🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Analysis Placeholder */}
      <section id="analysis" className="mb-12 pt-8 scroll-mt-8">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg">Analysis Config</h2>
        <div className="anti-gravity-card p-8 flex flex-col md:flex-row gap-12 items-center bg-gradient-to-r from-blue-900/20 to-transparent">
             <div className="w-56 h-56 rounded-full border-[20px] border-[#0A2540] relative shadow-[0_0_30px_rgba(0,123,255,0.4)] flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#007BFF] to-orange-500 animate-spin" style={{ animationDuration: '10s' }} />
                 <div className="absolute inset-2 bg-[#0A2540] rounded-full z-10 flex flex-col items-center justify-center shadow-inner">
                     <span className="text-3xl font-black text-white drop-shadow-md">{historyRecords.length}</span>
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total Scans</span>
                 </div>
             </div>
             <div className="flex-1 space-y-4">
                 <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">DR Severity Distribution</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(getSeverityDistribution()).map(([label, count], idx) => (
                       <div key={idx} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${count > 0 ? 'border-orange-500 bg-orange-500/10' : 'border-slate-500 bg-slate-500/10'}`}>
                             <div className={`w-3 h-3 rounded-full ${count > 0 ? 'bg-orange-400 shadow-[0_0_10px_#f97316]' : 'bg-slate-400'}`}></div>
                          </div>
                          <div>
                              <div className="text-[10px] font-black uppercase text-white tracking-widest">{label}</div>
                              <div className="text-[11px] text-slate-400 font-bold">{((count / (historyRecords.length || 1)) * 100).toFixed(1)}% ({count} scans)</div>
                          </div>
                       </div>
                    ))}
                 </div>
             </div>
         </div>
      </section>

      {/* History Area */}
      <section id="history" className="mb-12 pt-8 scroll-mt-8">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg">Scan History</h2>
        <div className="anti-gravity-card overflow-hidden p-6 text-sm">
          {historyRecords.length === 0 ? (
             <div className="text-slate-400 text-center py-6 font-bold uppercase tracking-widest text-xs">No scan history recorded yet. Use the New Scan tab.</div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historyRecords.map((rec) => (
                   <div key={rec.id} className="bg-white/5 border border-blue-500/20 rounded-2xl p-4 flex flex-col gap-3 hover:bg-white/10 transition-colors shadow-lg">
                      <div className="flex justify-between items-start">
                         <div>
                            <div className="font-black text-white uppercase tracking-wider">{rec.patientId}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                               {rec.patientName} {rec.age ? `• ${rec.age}yo` : ''} {rec.gender || ''}
                            </div>
                         </div>
                         <div className="text-xs text-blue-300 font-bold uppercase tracking-widest">{rec.date}</div>
                      </div>
                      <div className="flex items-center gap-4 border-t border-white/10 pt-3">
                         <img src={rec.image_url} alt="Scan" className="w-16 h-16 rounded-xl object-cover border border-blue-500/30" />
                         <div>
                            <div className="font-black text-white text-lg drop-shadow-md">{rec.label}</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{rec.confidence}% Confidence</div>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          )}
        </div>
      </section>

      {/* Settings */}
      <section id="settings" className="mb-24 pt-8 scroll-mt-8">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg">Platform Settings</h2>
        <div className="anti-gravity-card p-6 space-y-4 bg-gradient-to-b from-white/5 to-transparent">
          {[
            { label: 'Dark Mode / Anti-Gravity Theme', desc: 'Enables futuristic spatial design system.', state: darkMode, setter: setDarkMode },
            { label: 'Push Notifications', desc: 'Alert staff of high risk cases immediately.', state: notifications, setter: setNotifications },
            { label: 'Auto-save High Risk', desc: 'Automatically backup anomalous scan anomalies to cold storage.', state: autoSave, setter: setAutoSave }
          ].map((setting, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors shadow-lg">
                <div>
                  <div className="font-bold text-white uppercase tracking-widest text-sm mb-1">{setting.label}</div>
                  <div className="text-xs text-slate-400 font-medium">{setting.desc}</div>
                </div>
                <button onClick={() => setting.setter(!setting.state)} className={`w-14 h-7 rounded-full transition-colors relative shadow-inner ${setting.state ? 'bg-[#007BFF] shadow-[0_0_15px_rgba(0,123,255,0.5)]' : 'bg-[#0A2540] border border-slate-600'}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${setting.state ? 'left-8' : 'left-1'}`} />
                </button>
              </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
};

export default AdminDashboard;

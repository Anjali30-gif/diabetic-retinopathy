import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import io from 'socket.io-client';
import DashboardLayout from '../components/DashboardLayout';
import Scanner from './Scanner';
import API_BASE from '../config';
// import removed to bypass NPM

const DoctorDashboard = () => {
  const sidebarItems = [
    { label: 'New Scan', icon: '🔍', id: 'scan' },
    { label: 'Analysis', icon: '📊', id: 'analysis' },
    { label: 'Patient History', icon: '🕒', id: 'history' },
    { label: 'Settings', icon: '⚙️', id: 'settings' },
    { label: 'Profile', icon: '👤', path: '/profile' }
  ];

  const [reviewStatus, setReviewStatus] = useState('Pending');
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [historyRecords, setHistoryRecords] = useState([]);
  const navigate = useNavigate();


  useEffect(() => {
    let user;
    try { user = JSON.parse(localStorage.getItem('user_info')); } catch(e) {}
    const socket = io('http://127.0.0.1:5000');
    if (socket) {
      socket.on('new_scan', (data) => {
        if (user && String(data.doctor_user_id) === String(user.id)) {
            setHistoryRecords(prev => [data, ...prev]);
            if (notifications) {
               const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
               audio.play().catch(() => {});
            }
        }
      });
      socket.on('patient_checkin', (data) => {
         if (notifications) {
             const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
             audio.play().catch(() => {});
             alert(`[System Alert] Patient Check-in! Visit Code: ${data.visitCode}`);
         }
      });
    }

    const fetchRecords = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE}/api/records`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            console.error(`Doctor: Token invalid/expired (401). Redirecting to login.`);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
            navigate('/');
            return;
        }
        if (res.status === 422) {
            console.error(`Doctor: JWT format error (422). Token may be old — please log out and log in again.`);
            // Don't redirect — just show no data. User can log out manually.
            return;
        }


        if (res.ok) {
          const data = await res.json();
          setHistoryRecords(data);
        }
      } catch (err) {
        console.error("Error fetching records:", err);
      }
    };

    fetchRecords();

    return () => { if (socket) socket.disconnect(); };
  }, [notifications, navigate]);

  return (
    <DashboardLayout role="Doctor" sidebarItems={sidebarItems}>
      <Scanner />

      {/* Analysis Section */}
      <section id="analysis" className="mb-12 pt-8 scroll-mt-8">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg">Clinical Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="anti-gravity-card p-6 bg-blue-500/10 border border-blue-500/20">
              <h3 className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-2">Total Scans</h3>
              <div className="text-4xl font-black text-white">{historyRecords.length}</div>
           </div>
           <div className="anti-gravity-card p-6 bg-red-500/10 border border-red-500/20">
              <h3 className="text-[10px] font-black text-red-300 uppercase tracking-widest mb-2">High Risk (DR+)</h3>
              <div className="text-4xl font-black text-white">{historyRecords.filter(r => (r.level || 0) >= 50).length}</div>
           </div>
           <div className="anti-gravity-card p-6 bg-green-500/10 border border-green-500/20">
              <h3 className="text-[10px] font-black text-green-300 uppercase tracking-widest mb-2">Normal Cases</h3>
              <div className="text-4xl font-black text-white">{historyRecords.filter(r => (r.level || 0) < 50).length}</div>
           </div>
        </div>
      </section>
      
      {/* History Table */}
      <section id="history" className="mb-12 pt-8 scroll-mt-8">

        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg">Patient History</h2>
        <div className="anti-gravity-card overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#007BFF]/10 text-[10px] uppercase tracking-widest text-blue-300 font-black border-b border-blue-500/20">
              <tr>
                <th className="p-5">Scan ID</th>
                <th className="p-5">Patient Name</th>
                <th className="p-5">Date</th>
                <th className="p-5">Diagnosis</th>
                <th className="p-5 text-center">AI Score</th>
                <th className="p-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-500/10 text-sm font-medium">
              {historyRecords.length === 0 ? (
                <tr>
                   <td colSpan="6" className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No scan records available in database.</td>
                </tr>
              ) : (
                historyRecords.map((h, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-5 font-mono text-blue-300">{h.patientId}</td>
                    <td className="p-5">
                       <div className="text-white font-bold tracking-wide">{h.patientName}</div>
                       <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                          {h.age ? `${h.age}yo` : ''} {h.gender || ''} {h.diabetes_history ? `• ${h.diabetes_history}y DM` : ''}
                       </div>
                    </td>
                    <td className="p-5 text-slate-400">{h.date}</td>
                    <td className={`p-5 font-bold uppercase tracking-wider text-xs ${h.level >= 50 ? 'text-red-500' : 'text-green-500'}`}>{h.label}</td>
                    <td className="p-5 text-center font-black text-lg">{h.confidence}%</td>
                    <td className="p-5">
                       <span className={`inline-block px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black ${h.level >= 50 ? 'badge-orange' : 'badge-green'}`}>Recorded</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      {/* Settings */}
      <section id="settings" className="mb-24 pt-8 scroll-mt-8">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg">Platform Settings</h2>
        <div className="anti-gravity-card p-6 space-y-4 bg-gradient-to-b from-white/5 to-transparent">
          {[
            { label: 'Dark Mode / Anti-Gravity Theme', desc: 'Enables futuristic spatial design system.', state: darkMode, setter: setDarkMode },
            { label: 'Push Notifications', desc: 'Receive priority alerts for High Risk assignments.', state: notifications, setter: setNotifications },
            { label: 'Auto-save Clinical Notes', desc: 'Automatically backup typed clinical findings.', state: autoSave, setter: setAutoSave }
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

export default DoctorDashboard;

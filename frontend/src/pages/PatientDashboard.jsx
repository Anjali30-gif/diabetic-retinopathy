import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import DashboardLayout from '../components/DashboardLayout';
import API_BASE from '../config';
// import removed to bypass NPM

const PatientDashboard = () => {
  const sidebarItems = [
    { label: 'My Records', icon: '📝', id: 'records' },
    { label: 'Appointments', icon: '📅', id: 'appointments' }
  ];

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [visitCode, setVisitCode] = useState('');
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    let user;
    try { user = JSON.parse(localStorage.getItem('user_info')); } catch(e) {}
    socketRef.current = io(API_BASE);
    if (socketRef.current) {
      socketRef.current.on('new_scan', (data) => {
        if (user && data.patient_user_id && String(data.patient_user_id) === String(user.id)) {
            setHistoryRecords(prev => [data, ...prev]);
        }
      });
    }

    const fetchRecords = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE}/api/patients/records`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            console.error(`Patient: Token invalid/expired (401). Redirecting to login.`);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
            navigate('/');
            return;
        }
        if (res.status === 422) {
            console.error(`Patient: JWT format error (422). Token may be old — please log out and log in again.`);
            return;
        }

        if (res.ok) {
          const data = await res.json();
          setHistoryRecords(data);
        }
      } catch (err) {
        console.error("Error fetching records:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [navigate]);

  const handleCheckIn = () => {
     if (visitCode.trim() === '') return;
     if (socketRef.current) {
         socketRef.current.emit('patient_checkin', { visitCode, timestamp: new Date().toISOString() });
         alert("Check-in successful. Your doctor has been notified.");
         setCheckInOpen(false);
         setVisitCode('');
     }
  };


  return (
    <DashboardLayout role="Patient" sidebarItems={sidebarItems}>
      {/* Records Section */}
      <section id="records" className="mb-12 pt-4 scroll-mt-8">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg">My Records</h2>
        
        {loading ? (
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs py-10">Accessing Cloud Patient Records...</div>
        ) : historyRecords.length === 0 ? (
          <div className="anti-gravity-card p-10 text-center text-slate-500 font-bold uppercase tracking-widest text-xs border-dashed border-2 border-white/10">
            No clinical records found for your identity profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {historyRecords.map((rec, idx) => (
              <div key={rec.id} className={`anti-gravity-card p-8 border-t-[6px] ${rec.level >= 50 ? 'border-t-red-500 shadow-[0_10px_40px_rgba(239,68,68,0.15)]' : 'border-t-green-500'} floating cursor-pointer`} style={{ animationDelay: `${idx * 0.2}s` }}>
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none rounded-2xl" />
                <div className="flex justify-between items-start mb-6 relative">
                    <div>
                        <h3 className="text-xl font-black text-white tracking-widest uppercase mb-1">Retinal Scan</h3>
                        <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">{rec.date}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-md ${rec.level >= 50 ? 'badge-red shadow-red-500/30' : 'badge-green shadow-green-500/30'}`}>
                      {rec.label}
                    </span>
                </div>
                <div className="h-48 bg-slate-900/80 rounded-2xl mb-8 shadow-inner relative flex items-center justify-center border border-white/5 overflow-hidden group">
                    <img src={rec.image_url} alt="Scan Result" className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity duration-700 blur-[2px] hover:blur-0" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                      <span className="text-white text-[10px] font-black uppercase tracking-[0.3em] bg-black/60 px-4 py-2 rounded-lg border border-white/10">Secure View Only</span>
                    </div>
                </div>
                <button className="w-full flex justify-center items-center gap-3 py-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-xs font-black uppercase tracking-widest text-slate-300 border border-white/10">
                    📥 Download AI Analysis Report
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Appointments Section */}
      <section id="appointments" className="mb-32 pt-12 scroll-mt-8 relative border-t border-blue-500/20">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="flex justify-between items-end mb-8">
           <h2 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-lg">Appointments</h2>
           <button 
             onClick={() => setCheckInOpen(true)}
             className="px-8 py-4 bg-[#007BFF] hover:bg-blue-500 rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(0,123,255,0.4)] transition-all hover:scale-[1.05] active:scale-95 flex items-center gap-3"
           >
              ➕ Check In
           </button>
        </div>

        <div className="anti-gravity-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between border-l-[6px] border-[#007BFF] mb-4 bg-gradient-to-r from-[#007BFF]/10 to-transparent gap-6">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[20px] bg-[#0A2540] border border-blue-500/40 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1/3 bg-blue-500/10 border-b border-blue-500/20"></div>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest relative z-10">Apr</span>
                    <span className="text-2xl font-black text-white relative z-10">14</span>
                </div>
                <div>
                   <h4 className="font-black text-white uppercase tracking-widest text-xl mb-1">Follow-up with Dr. Smith</h4>
                   <p className="text-sm text-slate-400 font-bold tracking-wider">Eye Clinic • Suite 402</p>
                </div>
            </div>
            <div className="text-left md:text-right bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="text-xl font-black text-blue-400 flex items-center gap-3 drop-shadow-[0_0_10px_rgba(0,123,255,0.4)]">
                    ⏰ 09:30 AM
                </div>
                <div className="text-[10px] text-green-400 font-black tracking-[0.2em] uppercase mt-2 flex items-center md:justify-end gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_#10b981]"></div> Confirmed
                </div>
            </div>
        </div>
      </section>

      {/* Check-in Modal */}
      {checkInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-[#0A2540]/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setCheckInOpen(false)}></div>
           
           <div className="anti-gravity-card p-12 max-w-md w-full relative z-10 border-t-[6px] border-[#007BFF] shadow-[0_0_60px_rgba(0,123,255,0.3)] animate-in zoom-in-95 duration-300">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#007BFF] rounded-full flex items-center justify-center shadow-[0_0_20px_#007BFF] text-2xl">
                 ➕
              </div>
              
              <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-3 text-center mt-4">Check-In</h2>
              <p className="text-sm text-slate-400 mb-10 text-center font-bold">Enter the visit code provided by the front desk.</p>
              
              <div className="mb-10">
                 <input 
                   type="text" 
                   value={visitCode}
                   onChange={(e) => setVisitCode(e.target.value)}
                   placeholder="VIS-***"
                   className="w-full bg-[#0A2540]/80 border-2 border-[#007BFF]/30 rounded-2xl p-6 text-center text-3xl font-mono font-bold text-white tracking-[0.4em] outline-none focus:border-[#007BFF] focus:shadow-[0_0_25px_rgba(0,123,255,0.4)] transition-all uppercase placeholder:text-slate-600"
                 />
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setCheckInOpen(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors">Cancel</button>
                 <button onClick={handleCheckIn} className="flex-1 py-4 bg-[#007BFF] hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(0,123,255,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]">Submit</button>
              </div>
           </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PatientDashboard;

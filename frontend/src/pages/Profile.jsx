import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    hospital: '',
    specialty: ''
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('http://127.0.0.1:5000/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            console.error("Profile: Token invalid/expired (401). Redirecting to login.");
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
            navigate('/');
            return;
        }
        if (res.status === 422) {
            console.error("Profile: JWT format error (422). Token may be old — please log out and log in again.");
            return;
        }


        if (res.ok) {
          const data = await res.json();
          setProfile({
            name: data.name || '',
            email: data.email || '',
            role: data.role || '',
            phone: data.phone || '',
            hospital: data.hospital || '',
            specialty: data.specialty || ''
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);


  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('http://127.0.0.1:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        setSaveStatus('success');
        // Update local storage so identity bar reflects new name
        const currentInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        localStorage.setItem('user_info', JSON.stringify({ ...currentInfo, name: profile.name }));
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  const sidebarItems = [
    { label: 'Back to Dashboard', icon: '⬅️', path: profile.role === 'Doctor' ? '/doctor' : '/admin' },
    { label: 'Profile Settings', icon: '👤', id: 'profile' }
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading Verification Data...</div>;

  return (
    <DashboardLayout role={profile.role || 'User'} sidebarItems={sidebarItems}>
       <section id="profile" className="mb-12 pt-4 scroll-mt-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg">Clinical Profile Settings</h2>
          
          <div className="anti-gravity-card p-10 max-w-3xl relative overflow-hidden">
             
             {saveStatus === 'success' && (
                <div className="absolute top-0 left-0 w-full bg-green-500/20 text-green-300 border-b border-green-500 p-3 text-center text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  Clinical Details Updated Successfully
                </div>
             )}
             {saveStatus === 'error' && (
                <div className="absolute top-0 left-0 w-full bg-red-500/20 text-red-300 border-b border-red-500 p-3 text-center text-xs font-black uppercase tracking-widest">
                  Error Saving Profile
                </div>
             )}

             <div className="flex items-center gap-8 mb-10 mt-6 border-b border-blue-500/20 pb-8">
                 <div className="w-24 h-24 rounded-full bg-[#007BFF]/20 border-2 border-[#007BFF]/50 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(0,123,255,0.4)]">
                    🧑‍⚕️
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-1 shadow-sm">{profile.name}</h3>
                    <p className="text-sm font-bold text-blue-300 uppercase tracking-widest">Medical ID: {profile.email}</p>
                 </div>
             </div>

             <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Full Name</label>
                     <input type="text" name="name" value={profile.name} onChange={handleChange} className="w-full bg-[#0A2540]/60 border border-blue-500/30 rounded-xl p-4 text-white hover:border-blue-400 focus:border-[#007BFF] outline-none transition-colors" />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Contact Phone Number</label>
                     <input type="text" name="phone" value={profile.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" className="w-full bg-[#0A2540]/60 border border-blue-500/30 rounded-xl p-4 text-white hover:border-blue-400 focus:border-[#007BFF] outline-none transition-colors" />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Hospital / Institution</label>
                     <input type="text" name="hospital" value={profile.hospital} onChange={handleChange} placeholder="e.g. Johns Hopkins Medical" className="w-full bg-[#0A2540]/60 border border-blue-500/30 rounded-xl p-4 text-white hover:border-blue-400 focus:border-[#007BFF] outline-none transition-colors" />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Medical Specialty</label>
                     <input type="text" name="specialty" value={profile.specialty} onChange={handleChange} placeholder="e.g. Ophthalmology, Retina Specialist" className="w-full bg-[#0A2540]/60 border border-blue-500/30 rounded-xl p-4 text-white hover:border-blue-400 focus:border-[#007BFF] outline-none transition-colors" />
                   </div>
                </div>

                <div className="pt-6 border-t border-blue-500/20 text-right">
                   <button type="submit" disabled={saveStatus === 'saving'} className="bg-[#007BFF] hover:bg-blue-500 text-white font-black uppercase tracking-widest px-10 py-4 rounded-xl shadow-[0_0_20px_rgba(0,123,255,0.4)] active:scale-95 transition-all text-xs">
                     {saveStatus === 'saving' ? 'Verifying...' : 'Save Clinical Profile'}
                   </button>
                </div>
             </form>

          </div>
       </section>
    </DashboardLayout>
  );
};

export default Profile;

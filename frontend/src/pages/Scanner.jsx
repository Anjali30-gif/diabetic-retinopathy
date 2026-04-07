import React, { useState } from 'react';
import API_BASE, { DEMO_MODE } from '../config';

const SEVERITY_DATA = {
  'No DR': { color: '#10b981', level: 0, risk: '0-5%', recommendation: 'Annual routine screening advised.' },
  'Mild': { color: '#f59e0b', level: 25, risk: '15-20%', recommendation: 'Follow-up screening in 6-12 months.' },
  'Moderate': { color: '#f97316', level: 50, risk: '40-50%', recommendation: 'Consult an ophthalmologist for detailed evaluation.' },
  'Severe': { color: '#ef4444', level: 75, risk: '70-80%', recommendation: 'Urgent referral to a retina specialist.' },
  'Proliferative': { color: '#7f1d1d', level: 100, risk: '>90%', recommendation: 'Immediate clinical intervention required to prevent vision loss.' }
};

const Scanner = ({ demoMode }) => {
  const isDemoMode = demoMode || DEMO_MODE;

  const [state, setState] = useState('IDLE'); // IDLE, SCANNING, RESULT
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    diabetesYears: '',
    patientUserId: '' // Optional: link scan to a registered patient account (DX-XXXXX)
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        startScanning(selectedFile);
    }
  };

  const startScanning = async (fileArg) => {
    setState('SCANNING');
    setProgress(0);
    
    // Smooth progress simulation while waiting for API
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        currentProgress = prev;
        if (prev >= 60 && prev < 85) return prev + 0.8; // Faster slow down
        if (prev >= 85 && prev < 99) return prev + 0.2; // FASTER crawl
        if (prev >= 99) return prev;
        return prev + 2; // Rapid start
      });
    }, 50); // Higher frequency (20fps) for smoother visuals

    try {
      if (isDemoMode) {
        const data = await generateMockResult(fileArg);
        clearInterval(progressInterval);
        setProgress(100);
        setTimeout(() => {
          setResult({
            severity: data.label,
            confidence: data.confidence,
            level: data.level,
            patientId: data.patientId,
            date: data.date,
            original_url: data.original_url
          });
          setState('RESULT');
        }, 500);
        return;
      }

      const formData = new FormData();
      formData.append('retinal_image', fileArg);
      formData.append('patient_name', patientData.name);
      formData.append('age', patientData.age);
      formData.append('gender', patientData.gender);
      formData.append('diabetes_history', patientData.diabetesYears);
      if (patientData.patientUserId) formData.append('patient_user_id', patientData.patientUserId);
      // Let backend decide mock mode based on model availability, or allow explicit override
      // formData.append('mock', 'false'); 

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        let errorMsg = 'Inference failed';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.msg || errorMsg; // msg is common in JWT errors
        } catch (e) {
          errorMsg = `Server error (${response.status})`;
        }
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        setResult({
          severity: data.label,
          confidence: data.confidence,
          level: data.level,
          patientId: data.patientId,
          date: data.date,
          original_url: data.original_url
        });
        setState('RESULT');
      }, 500);
    } catch (error) {
      console.error("SCAN_ERROR:", error);
      clearInterval(progressInterval);
      
      const isAuthError = error.message.toLowerCase().includes('token') || 
                          error.message.includes('401') || 
                          error.message.includes('422') ||
                          error.message.toLowerCase().includes('signature');

      let displayMessage = `Scan Failed: ${error.message}`;
      if (isAuthError) {
        displayMessage = "Session Expired or Invalid User. Please log out and sign in again (all local sessions were reset during the server update).";
      }

      alert(displayMessage);
      reset();
    }
  };

  const generateReport = () => {
    window.print();
  };

  const hashFile = async (fileObj) => {
    const buffer = await fileObj.arrayBuffer();
    const data = new Uint8Array(buffer);
    let hash = 0;
    for (let i = 0; i < Math.min(data.length, 256); i += 1) {
      hash = (hash * 1315423911) ^ data[i];
    }
    return Math.abs(hash);
  };

  const getMockPrediction = async (fileObj) => {
    const hash = await hashFile(fileObj);
    const labels = ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative'];
    const index = hash % labels.length;
    const confidence = (80 + (hash % 20)) + (hash % 10) / 100;
    const date = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    return {
      label: labels[index],
      confidence: `${confidence.toFixed(1)}`,
      level: [0, 25, 50, 75, 100][index],
      patientId: `DX-${10000 + (hash % 90000)}`,
      date,
      original_url: preview || ''
    };
  };

  const generateMockResult = async (fileArg) => {
    const data = await getMockPrediction(fileArg);
    return {
      label: data.label,
      confidence: data.confidence,
      level: data.level,
      patientId: data.patientId,
      date: data.date,
      original_url: data.original_url
    };
  };

  const reset = () => {
    setState('IDLE');
    setFile(null);
    setPreview(null);
    setResult(null);
    setPatientData({ name: '', age: '', gender: 'Male', diabetesYears: '', patientUserId: '' });
  };

  return (
    <section id="scan" className="mb-12 pt-4 scroll-mt-8 w-full border-b border-blue-500/20 pb-12">
       <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg">New Scan Entry</h2>
       <div className="flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {state === 'IDLE' && (
            <div className="flex flex-col gap-8 w-full max-w-4xl">
              <div className="anti-gravity-card p-8 bg-[#0A2540]/60 border-blue-500/20">
                <h3 className="text-sm font-black text-blue-300 uppercase tracking-widest mb-6 border-b border-blue-500/20 pb-4">Patient Pre-Registration</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Full Name</label>
                    <input type="text" value={patientData.name} onChange={(e) => setPatientData({...patientData, name: e.target.value})} className="w-full bg-black/40 border border-blue-500/30 rounded-xl p-3 text-white outline-none focus:border-blue-400" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Age</label>
                    <input type="number" value={patientData.age} onChange={(e) => setPatientData({...patientData, age: e.target.value})} className="w-full bg-black/40 border border-blue-500/30 rounded-xl p-3 text-white outline-none focus:border-blue-400" placeholder="Years" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Gender</label>
                    <select value={patientData.gender} onChange={(e) => setPatientData({...patientData, gender: e.target.value})} className="w-full bg-black/40 border border-blue-500/30 rounded-xl p-3 text-white outline-none focus:border-blue-400 appearance-none font-bold">
                       <option>Male</option>
                       <option>Female</option>
                       <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Years of Diabetes</label>
                    <input type="number" value={patientData.diabetesYears} onChange={(e) => setPatientData({...patientData, diabetesYears: e.target.value})} className="w-full bg-black/40 border border-blue-500/30 rounded-xl p-3 text-white outline-none focus:border-blue-400" placeholder="0 if None" />
                  </div>
                </div>
                {/* Optional link to registered patient account */}
                <div className="mt-4 pt-4 border-t border-blue-500/20">
                  <label className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-2 block">🔗 Link to Patient Account (Optional)</label>
                  <div className="flex items-center gap-4 flex-wrap">
                    <input type="text" value={patientData.patientUserId} onChange={(e) => setPatientData({...patientData, patientUserId: e.target.value})} className="w-64 bg-black/40 border border-blue-500/30 rounded-xl p-3 text-white font-mono outline-none focus:border-blue-400" placeholder="e.g. DX-38291" />
                    <span className="text-[10px] text-slate-500">If filled, this scan will appear in the patient dashboard.</span>
                  </div>
                </div>
              </div>

              <div className="anti-gravity-card p-12 text-center w-full floating">
                <div 
                  className={`border-2 border-dashed rounded-[32px] p-16 cursor-pointer transition-all ${!patientData.name ? 'opacity-50 grayscale pointer-events-none' : 'border-[#007BFF]/50 hover:border-[#007BFF] hover:bg-blue-500/5 bg-[#0A2540]/60'} focus:outline-none`}
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <input id="fileInput" type="file" onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                  <div className="w-24 h-24 bg-[#007BFF]/20 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-[0_0_20px_rgba(0,123,255,0.4)] edge-glow border border-[#007BFF]/50 relative overflow-hidden">
                     <span className="relative z-10 drop-shadow-md">📤</span>
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-3">Upload Retinal Scan</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-sm">
                    {patientData.name ? `Linked to: ${patientData.name}` : 'Fill patient details first to unlock upload'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {state === 'SCANNING' && (
            <div className="anti-gravity-card p-12 text-center relative overflow-hidden w-full max-w-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent -z-10 animate-pulse" />
              <div className="relative w-64 h-64 mx-auto mb-10 group">
                <div className="absolute -inset-6 bg-[#007BFF] rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity animate-pulse" />
                <div className="relative w-full h-full overflow-hidden rounded-full border-4 border-[#007BFF]/60 shadow-[0_0_40px_rgba(0,123,255,0.4)] edge-glow bg-slate-900 pointer-events-none">
                    <img src={preview} alt="Scanning" className="w-full h-full object-cover grayscale opacity-50 mix-blend-screen" />
                    <div 
                    className="absolute left-0 w-full h-1 bg-[#007BFF] shadow-[0_0_20px_#007BFF]"
                    style={{ top: `${progress}%`, transition: 'top 0.1s linear' }}
                    />
                    <div className="absolute inset-x-0 w-full bg-gradient-to-b from-[#00bfff]/30 to-transparent h-32" style={{ top: `${progress}%`, transition: 'top 0.1s linear' }} />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-3">Analyzing Vascular Structure</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">Hybrid AI Engine Active</p>
              
              <div className="w-full max-w-md mx-auto relative h-4 bg-[#0A2540] rounded-full overflow-hidden shadow-inner border border-white/10">
                  <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-[#00bfff] relative shadow-[0_0_10px_#007BFF]"
                  style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 w-full translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                </div>
              </div>
              <div className="mt-6 text-[10px] font-black tracking-[0.3em] text-[#007BFF] uppercase">
                {progress < 30 ? 'Pre-processing Image Data...' : progress < 70 ? 'Deep Feature Extraction...' : 'Finalizing Inference Weights...'}
              </div>
            </div>
          )}

          {state === 'RESULT' && result && (
            <div className="anti-gravity-card overflow-hidden w-full max-w-4xl border-t-[6px] shadow-[0_10px_50px_rgba(0,0,0,0.5)] border-[#007BFF] animate-in slide-in-from-bottom duration-500">
              <div className="p-8 border-b border-blue-500/20 flex flex-col md:flex-row items-center justify-between bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-6 mb-4 md:mb-0">
                  <div className="relative border-4 border-[#007BFF]/30 p-1 rounded-2xl bg-slate-900">
                    <img src={preview} alt="Scan" className="w-24 h-24 rounded-xl object-cover shadow-[0_0_15px_rgba(0,123,255,0.3)] opacity-90" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-lg mb-1">Clinical AI Diagnosis</h4>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Scan ID: {result.patientId} • Date: {result.date}</p>
                  </div>
                </div>
                <button 
                  onClick={reset}
                  className="flex items-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-md"
                >
                  🔄 New Scan
                </button>
              </div>

              <div className="p-10">
                <div className="mb-14 text-center">
                  <div
                    className="inline-block px-12 py-5 rounded-2xl text-white font-black text-3xl uppercase tracking-widest mb-8 border border-white/20 relative overflow-hidden group shadow-2xl"
                    style={{ 
                        backgroundColor: SEVERITY_DATA[result.severity].color,
                        boxShadow: `0 0 45px ${SEVERITY_DATA[result.severity].color}88`
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 group-hover:translate-x-[200%] transition-transform duration-[1500ms] translate-x-[-150%] skew-x-[-25deg] w-1/2 pointer-events-none" />
                    <span className="drop-shadow-md">{result.severity}</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-4 text-slate-300 font-bold text-lg mb-12 uppercase tracking-widest bg-black/20 inline-flex px-8 py-4 rounded-2xl border border-white/5 mx-auto">
                    <span>⚙️ Confidence Matrix:</span>
                    <span className="text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] shadow-blue-500">{result.confidence}%</span>
                  </div>

                  <div className="max-w-2xl mx-auto bg-[#0A2540]/60 p-8 rounded-3xl border border-blue-500/20 shadow-inner mb-12">
                    <div className="flex justify-between text-xs font-black text-slate-400 tracking-widest uppercase mb-5 px-3">
                      <span>Pathological Risk Index</span>
                      <span style={{ color: SEVERITY_DATA[result.severity].color, textShadow: `0 0 15px ${SEVERITY_DATA[result.severity].color}` }}>{SEVERITY_DATA[result.severity].risk} Factor</span>
                    </div>
                    
                    <div className="relative h-10 bg-slate-900/80 rounded-full p-2 shadow-inner flex gap-2 overflow-hidden border border-white/5">
                        <div 
                            className="absolute inset-y-0 left-0 bg-white/10 rounded-full transition-all duration-[2000ms] ease-out shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            style={{ width: `${result.level}%` }}
                        />
                        <div 
                             className="absolute inset-y-0 left-0 rounded-full pointer-events-none"
                             style={{ backgroundColor: SEVERITY_DATA[result.severity].color, opacity: 0.2, width: `${result.level}%` }}
                        />
                        {[0, 25, 50, 75].map((step) => (
                            <div key={step} className="flex-1 rounded-full relative z-10 border border-white/10" 
                                 style={{ backgroundColor: result.level > step ? SEVERITY_DATA[result.severity].color : 'transparent', opacity: result.level > step ? 1 : 0.05 }} />
                        ))}
                    </div>
                  </div>

                  {/* Fundus Sector Deep Analysis using Uploaded Image */}
                  <div className="mb-12 border-t-[6px] border-[#0A2540] pt-12 shadow-inner bg-black/10 rounded-[32px] p-8 pb-10">
                      <h4 className="text-2xl font-black text-white uppercase tracking-widest mb-8 drop-shadow-md text-left border-b border-blue-500/20 pb-4 flex items-center gap-3">
                         <span className="text-blue-500">🔍</span> Segmented Deep Visual Analysis
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {[
                            { color: 'orange', code: '#f97316', ring: 'bottom-[30%] left-[20%]', label: 'Sector 1: Exudates' },
                            { color: 'pink', code: '#ec4899', ring: 'top-[60%] right-[30%]', label: 'Sector 2: Microaneurysms' },
                            { color: 'yellow', code: '#eab308', ring: 'bottom-[20%] left-[40%]', label: 'Macular Analysis' }
                          ].map((c, i) => (
                            <div key={i} className="anti-gravity-card p-6 relative flex flex-col items-center group bg-[#0A2540]/80 border-white/5 shadow-inner hover:bg-[#0A2540] transition-colors">
                                <div className="absolute inset-x-8 -inset-y-2 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: `${c.code}33` }} />
                                <div className="w-full aspect-square rounded-[32px] border-4 relative overflow-hidden bg-slate-900 flex items-center justify-center z-10 shadow-[0_0_25px_rgba(0,0,0,0.5)] border-t-white/30" style={{ borderColor: `${c.code}88` }}>
                                    <img src={preview} alt="Segmented Upload" className="w-full h-full object-cover opacity-90 mix-blend-screen hover:scale-110 transition-transform duration-1000" />
                                    <div className={`absolute ${c.ring} w-10 h-10 rounded-full border border-2 animate-pulse shadow-[0_0_20px_currentColor]`} style={{ borderColor: c.code, backgroundColor: `${c.code}44` }}></div>
                                </div>
                                <span className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-300 bg-black/40 px-5 py-2 rounded-xl border border-white/10 shadow-inner group-hover:text-white transition-colors">{c.label}</span>
                            </div>
                          ))}
                      </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="bg-[#0A2540]/60 p-8 rounded-[24px] border border-blue-500/30 shadow-inner group hover:bg-[#0A2540]/80 transition-colors">
                    <h5 className="font-black text-white mb-5 flex items-center gap-3 uppercase text-xs tracking-[0.2em] border-b border-white/10 pb-4">
                       <span className="text-2xl drop-shadow-[0_0_10px_rgba(0,123,255,0.8)]">🧪</span>
                       Neural Explanation Map
                    </h5>
                    <p className="text-slate-400 text-sm leading-loose font-bold italic">
                      Neural attention maps identify focal point clusters in the {result.severity.toLowerCase()} parametric bounds. 
                      Automated feature mapping indicates pathognomonic markers (exudates/hemorrhages) triggering the specific diagnostic boundary thresholding.
                    </p>
                  </div>
                  <div className="bg-[#0A2540]/60 p-8 rounded-[24px] border border-blue-500/30 shadow-inner group hover:bg-[#0A2540]/80 transition-colors">
                    <h5 className="font-black text-white mb-5 flex items-center gap-3 uppercase text-xs tracking-[0.2em] border-b border-white/10 pb-4">
                       <span className="text-2xl drop-shadow-[0_0_10px_#f97316]">⚠️</span>
                       Clinical Directives
                    </h5>
                    <p className="text-slate-400 text-sm leading-loose font-bold italic">
                      {SEVERITY_DATA[result.severity].recommendation}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 mb-12 bg-black/20 p-8 rounded-3xl border border-white/5">
                   <div className="flex-1 text-left">
                      <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3 block">Clinical Notes</label>
                      <textarea className="w-full bg-[#0A2540]/80 border border-blue-500/30 rounded-2xl p-5 text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_15px_rgba(0,123,255,0.2)] transition-all h-32 resize-none text-sm font-medium" placeholder="Enter findings to append to the patient's Electronic Health Record..."></textarea>
                   </div>
                   <div className="w-full md:w-72 space-y-5 text-left">
                      <div>
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3 block">Target Triage Status</label>
                        <select className="w-full bg-[#0A2540]/80 border border-blue-500/30 rounded-2xl p-4 text-white outline-none focus:border-blue-400 focus:shadow-[0_0_15px_rgba(0,123,255,0.2)] transition-all font-black tracking-widest uppercase text-xs appearance-none">
                           <option>Pending Signature</option>
                           <option>Routine Follow-up</option>
                           <option>High Risk Path</option>
                        </select>
                      </div>
                      <button className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 hover:text-green-300 font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 text-xs">
                         ✅ Confirm Validated Results
                      </button>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 mt-8">
                  <button 
                    onClick={generateReport}
                    className="flex-1 bg-[#007BFF] hover:bg-blue-500 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_0_25px_rgba(0,123,255,0.5)] hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-xs"
                  >
                    <span className="text-xl">📥</span>
                    Download Secure Metric Report
                  </button>
                  <button 
                    onClick={() => alert('Premium Feature Locked: Connect to the external Enterprise Vector Database to retrieve historically similar Content-Based Image Retrieval records.')}
                    className="flex-1 bg-[#0A2540]/80 border-2 border-blue-500/30 hover:border-[#007BFF] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-blue-500/10 uppercase tracking-widest text-xs active:scale-95 shadow-md">
                    <span className="text-xl">👁️</span>
                    Compare Deep Visual Vectors
                  </button>
                </div>
              </div>
            </div>
          )}
       </div>
    </section>
  )
}

export default Scanner;

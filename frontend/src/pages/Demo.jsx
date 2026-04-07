import React from 'react';
import { Link } from 'react-router-dom';
import Scanner from './Scanner';

const Demo = () => {
  return (
    <div className="min-h-screen bg-[#020712] text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-blue-300 font-bold mb-3">Live Demo Mode</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">Diabetic Retinopathy Demo</h1>
          <p className="mt-4 max-w-2xl mx-auto text-slate-400 text-sm leading-relaxed">
            The application is running in browser-only demo mode. No backend connection is required for this preview, and all scans are generated using a safe mock inference engine.
          </p>
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <Link to="/" className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-bold hover:bg-white/15 transition">
              Back to Login
            </Link>
          </div>
        </div>

        <div className="bg-[#08172f]/80 border border-blue-500/20 rounded-[40px] p-6 shadow-[0_25px_100px_rgba(0,90,255,0.15)] backdrop-blur-xl">
          <Scanner demoMode />
        </div>
      </div>
    </div>
  );
};

export default Demo;

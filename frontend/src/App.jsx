import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Demo from './pages/Demo';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  // Handle empty or string-ified null/undefined values
  if (!token || token === 'undefined' || token === 'null' || token === '') {
     return <Navigate to="/" replace />;
  }
  return children;
};


function App() {
  return (
    <div className="min-h-screen text-white relative flex flex-col font-sans">
      <div className="nebula-bg" />
      {/* Background Particles for Extra Depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-5]">
        <div className="orbiting-particle" style={{ top: '30%', left: '20%', animationDuration: '25s' }}></div>
        <div className="orbiting-particle" style={{ top: '70%', left: '80%', animationDuration: '35s', width:'6px', height:'6px' }}></div>
        <div className="orbiting-particle" style={{ top: '60%', left: '40%', animationDuration: '45s', transformOrigin: '-200px' }}></div>
      </div>

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/doctor" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/patient" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

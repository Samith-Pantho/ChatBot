import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import Header from './Header';

const MasterPage = () => {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (userInfo === null) {
    navigate('/login', { replace: true });
    } else if (location.pathname === '/') {
    navigate('/chat', { replace: true });
    }
    
  }, [userInfo, location.pathname, navigate]);

  if (!userInfo) {
    return null;
  }

  return (
    <div className="master-page">
      <Header
        userInfo={userInfo}
        onLogout={handleLogout}
        connectionStatus={connectionStatus}
      />
      
      <main className="main-content">
        <Outlet context={{ userInfo, connectionStatus, setConnectionStatus }} />
      </main>
    </div>
  );
};

export default MasterPage;
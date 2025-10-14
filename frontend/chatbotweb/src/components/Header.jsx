import React, { useState, useEffect, useRef } from 'react';
import { capitalizeName } from '../utils/helper';

const Header = ({ userInfo, onLogout, connectionStatus }) => {
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const popupRef = useRef(null);
  const profileRef = useRef(null);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target) &&
          profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfilePopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleProfilePopup = () => {
    setShowProfilePopup(!showProfilePopup);
  };

  const getStatusColor = () => {
    switch(connectionStatus) {
      case 'connected': return '#4caf50';
      case 'connecting': return '#ff9800';
      case 'disconnected': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = () => {
    switch(connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  return (
    <header className="chat-header">
      <div className="header-left">
        <h1 className="app-title">Chat Bot</h1>
        <div className="connection-status">
          <span 
            className="status-indicator" 
            style={{ backgroundColor: getStatusColor() }}
          ></span>
          <span className="status-text">{getStatusText()}</span>
        </div>
      </div>
      
      {userInfo && (
        <div 
          className="user-profile-container"
          ref={profileRef}
        >
          <div 
            className="user-profile" 
            onClick={toggleProfilePopup}
            onMouseEnter={() => setShowProfilePopup(true)}
          >
            <div className="profile-container">
              <img 
                src={userInfo.picture} 
                alt="Profile" 
                className="profile-pic"
              />
              <span className="user-name">{userInfo.name}</span>
            </div>
            
            {showProfilePopup && (
              <div 
                className="profile-popup"
                ref={popupRef}
                onMouseLeave={() => setShowProfilePopup(false)}
              >
                <div className="popup-header">
                  <img 
                    src={userInfo.picture} 
                    alt="Profile" 
                    className="popup-profile-pic"
                  />
                </div>
                <div className="popup-content">
                  <p className="greeting">
                    Hi, {userInfo.name?.split(' ').map(part => capitalizeName(part)).join(' ')}!
                  </p>
                  <p className="user-email">{userInfo.email}</p>
                </div>
                <div className="popup-footer">
                  <button 
                    className="logout-btn"
                    onClick={() => {
                      onLogout();
                      setShowProfilePopup(false);
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
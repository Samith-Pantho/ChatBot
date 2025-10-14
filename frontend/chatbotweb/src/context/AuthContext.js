import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForToken, logoutUser } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const login = async (code) => {
    try {
      setLoading(true);
      const response = await exchangeCodeForToken(code);
      if (response.Status === 'OK') {
        const { token, user } = response.Result;
        const userObj = {
            token,
            name: user.name,
            email: user.email,
            id: user.id,
            picture: user.picture
        };
        setUserInfo(userObj);
        navigate('/chat');
      }
      setLoading(false);
      return response;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const token = userInfo?.token;
      setUserInfo(null);
      await logoutUser(token);
    } catch (error) {
      setLoading(false);
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ userInfo, loading, setUserInfo, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
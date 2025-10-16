import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import '../styles/Login.css';

const Login = () => {
    const { login, userInfo, demoLogin } = useAuth(); // Added demoLogin
    const navigate = useNavigate();
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const googleRedirecturl = process.env.REACT_APP_GOOGLE_REDIRECT_URL;
    const scope = "openid email profile";
    
    const handleGoogleLogin = () => {
        window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' +
            `client_id=${googleClientId}&` +
            `redirect_uri=${googleRedirecturl}/Login&` +
            'response_type=code&' +
            `scope=${encodeURIComponent(scope)}`;
    };

    // Add demo login handler
    const handleDemoLogin = async () => {
        try {
            await demoLogin(); 
        } catch (error) {
            console.error('Demo login failed:', error);
        }
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code && !userInfo) { 
            const handleLogin = async () => {
                try {
                    await login(code);
                } catch (error) {
                    console.error('Login failed:', error);
                }
            };
            handleLogin();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    useEffect(() => {
        if (userInfo) {
            navigate('/');
        }
    }, [userInfo, navigate]);

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Chat Bot</h1>
                <p>Sign in to start chatting</p>
                <button className="google-login-btn" onClick={handleGoogleLogin}>
                    <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
                    Sign in with Google
                </button>
                
                {/* Demo Login Button */}
                <button className="demo-login-btn" onClick={handleDemoLogin}>
                    Try Demo Version
                </button>
                
                <p className="demo-note">
                    Use the demo to explore features without creating an account
                </p>
            </div>
        </div>
    );
};

export default Login;
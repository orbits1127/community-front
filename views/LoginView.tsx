
import React, { useState } from 'react';

const LoginView: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-phones"></div>

        <div className="auth-forms">
          <div className="auth-card">
            <h1 className="auth-card__logo">Instagram</h1>
            <form className="auth-form" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
              <input type="text" placeholder="Phone number, username, or email" className="auth-input" />
              <input type="password" placeholder="Password" className="auth-input" />
              <button type="submit" className="auth-btn">
                {isSignup ? 'Sign up' : 'Log in'}
              </button>
            </form>
            <div style={{ margin: '20px 0', fontSize: '13px', color: '#8e8e8e', fontWeight: 600 }}>OR</div>
            <button style={{ color: '#385185', fontSize: '14px', fontWeight: 600 }}>Log in with Facebook</button>
          </div>

          <div className="auth-card" style={{ padding: '20px' }}>
            <p style={{ fontSize: '14px' }}>
              {isSignup ? "Have an account?" : "Don't have an account?"}{" "}
              <button onClick={() => setIsSignup(!isSignup)} style={{ color: 'var(--ig-link)', fontWeight: 600 }}>
                {isSignup ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;

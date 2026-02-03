'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser, LoginCredentials, SignupData, getLoginErrorReason } from '../types';
import { authService } from '../services/dataService';

// =============================================================================
// Types
// =============================================================================

interface LoginViewProps {
  onLogin: (user?: AuthUser) => void;
}

// =============================================================================
// Constants: slideshow images, footer links
// =============================================================================

const screenshots = [
  'https://static.cdninstagram.com/images/instagram/xig/homepage/phones/screenshot1.png',
  'https://static.cdninstagram.com/images/instagram/xig/homepage/phones/screenshot2.png',
  'https://static.cdninstagram.com/images/instagram/xig/homepage/phones/screenshot3.png',
  'https://static.cdninstagram.com/images/instagram/xig/homepage/phones/screenshot4.png',
];

const footerLinks = [
  'Meta', 'About', 'Blog', 'Jobs', 'Help', 'API', 'Privacy', 'Terms',
  'Locations', 'Instagram Lite', 'Threads', 'Contact Uploading & Non-Users',
  'Meta Verified'
];

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  // =============================================================================
  // State: login/signup mode, password visibility, slide, loading, error
  // =============================================================================
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginErrorCode, setLoginErrorCode] = useState<string | null>(null);

  // State: form data (email, name, username, password)
  const [formData, setFormData] = useState<LoginCredentials & SignupData>({
    username: '',
    password: '',
    email: '',
    fullName: '',
  });

  // =============================================================================
  // Slideshow: next image every 5s
  // =============================================================================
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % screenshots.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // =============================================================================
  // Form: input change / validation / login / signup / mode switch
  // =============================================================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setLoginErrorCode(null);
  };

  const isFormValid = isSignup
    ? formData.email && formData.fullName && formData.username && formData.password
    : formData.username && formData.password;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);
    setLoginErrorCode(null);

    try {
      const response = await authService.login({
        username: formData.username,
        password: formData.password,
      });

      if (response.success && response.data) {
        onLogin(response.data);
      } else {
        const msg = response.error || '로그인이 실패했습니다.';
        setError(msg);
        setLoginErrorCode(response.errorCode ?? null);
        const reason = getLoginErrorReason(response.errorCode);
        alert(`로그인이 실패했습니다.\n${reason || msg}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      setError(msg);
      setLoginErrorCode('SERVER_ERROR');
      alert(`로그인이 실패했습니다.\n${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.signup({
        email: formData.email,
        fullName: formData.fullName,
        username: formData.username,
        password: formData.password,
      });

      if (response.success && response.data) {
        onLogin(response.data);
      } else {
        // For demo purposes, allow signup without backend
        onLogin();
      }
    } catch (err) {
      // For demo purposes, allow signup without backend
      onLogin();
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsSignup(!isSignup);
    setFormData({ username: '', password: '', email: '', fullName: '' });
    setError(null);
    setLoginErrorCode(null);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* ---------- Section: left phone mockup + slideshow ---------- */}
        <div className="login-phone-mockup">
          <div className="login-phone-frame">
            {screenshots.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`Screenshot ${index + 1}`}
                className={`login-phone-screenshot ${index === currentSlide ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* ---------- Section: login/signup form ---------- */}
        <div className="login-forms">
          {/* Main card: logo, error, form fields, submit, Facebook / forgot password */}
          <div className="login-card">
            <h1 className="login-logo">Instagram</h1>

            {isSignup && (
              <p className="login-signup-text">
                Sign up to see photos and videos from your friends.
              </p>
            )}

            {isSignup && (
              <button className="login-facebook-btn login-facebook-btn--signup" type="button">
                <svg aria-label="Facebook" className="login-facebook-icon" fill="currentColor" height="20" role="img" viewBox="0 0 24 24" width="20">
                  <path d="M9.602 21.026v-7.274H6.818v-3.26h2.784V8.008c0-2.761 1.664-4.27 4.103-4.27 1.198 0 2.231.09 2.532.13v2.87h-1.738c-1.362 0-1.626.652-1.626 1.605v2.15h3.25l-.424 3.26h-2.826v7.273H9.602z"></path>
                </svg>
                Log in with Facebook
              </button>
            )}

            {isSignup && <div className="login-divider"><span>OR</span></div>}

            {error && (
              <div style={{ color: 'var(--ig-error)', fontSize: '14px', textAlign: 'center', marginBottom: '12px' }}>
                {loginErrorCode && (
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    {getLoginErrorReason(loginErrorCode)}
                  </div>
                )}
                <div>{error}</div>
              </div>
            )}

            <form className="login-form" onSubmit={isSignup ? handleSignup : handleLogin}>
              {isSignup && (
                <>
                  <div className="login-input-wrapper">
                    <input
                      type="email"
                      name="email"
                      className={`login-input ${formData.email ? 'has-value' : ''}`}
                      value={formData.email}
                      onChange={handleInputChange}
                      aria-label="Mobile Number or Email"
                      autoComplete="email"
                    />
                    <span className={`login-input-label ${formData.email ? 'active' : ''}`}>
                      Mobile Number or Email
                    </span>
                  </div>
                  <div className="login-input-wrapper">
                    <input
                      type="text"
                      name="fullName"
                      className={`login-input ${formData.fullName ? 'has-value' : ''}`}
                      value={formData.fullName}
                      onChange={handleInputChange}
                      aria-label="Full Name"
                      autoComplete="name"
                    />
                    <span className={`login-input-label ${formData.fullName ? 'active' : ''}`}>
                      Full Name
                    </span>
                  </div>
                </>
              )}

              <div className="login-input-wrapper">
                <input
                  type="text"
                  name="username"
                  className={`login-input ${formData.username ? 'has-value' : ''}`}
                  value={formData.username}
                  onChange={handleInputChange}
                  aria-label={isSignup ? "Username" : "Phone number, username, or email"}
                  autoComplete="username"
                />
                <span className={`login-input-label ${formData.username ? 'active' : ''}`}>
                  {isSignup ? "Username" : "Phone number, username, or email"}
                </span>
              </div>

              <div className="login-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`login-input ${formData.password ? 'has-value' : ''}`}
                  value={formData.password}
                  onChange={handleInputChange}
                  aria-label="Password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                />
                <span className={`login-input-label ${formData.password ? 'active' : ''}`}>
                  Password
                </span>
                {formData.password && (
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? 'Please wait...' : isSignup ? 'Sign up' : 'Log in'}
              </button>
            </form>

            {!isSignup && (
              <>
                <div className="login-divider"><span>OR</span></div>

                <button className="login-facebook-btn" type="button">
                  <svg aria-label="Facebook" className="login-facebook-icon" fill="currentColor" height="16" role="img" viewBox="0 0 24 24" width="16">
                    <path d="M9.602 21.026v-7.274H6.818v-3.26h2.784V8.008c0-2.761 1.664-4.27 4.103-4.27 1.198 0 2.231.09 2.532.13v2.87h-1.738c-1.362 0-1.626.652-1.626 1.605v2.15h3.25l-.424 3.26h-2.826v7.273H9.602z"></path>
                  </svg>
                  Log in with Facebook
                </button>

                <a href="#" className="login-forgot-password">
                  Forgot password?
                </a>
              </>
            )}

            {isSignup && (
              <p className="login-terms">
                People who use our service may have uploaded your contact information to Instagram. <a href="#">Learn More</a>
                <br /><br />
                By signing up, you agree to our <a href="#">Terms</a>, <a href="#">Privacy Policy</a> and <a href="#">Cookies Policy</a>.
              </p>
            )}
          </div>

          {/* Switch card: login ↔ signup */}
          <div className="login-card login-card--switch">
            <p>
              {isSignup ? "Have an account?" : "Don't have an account?"}{" "}
              <button className="login-switch-btn" onClick={handleModeSwitch} type="button">
                {isSignup ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>

          {/* App download (App Store, Google Play) */}
          <div className="login-app-download">
            <p>Get the app.</p>
            <div className="login-app-badges">
              <a href="https://apps.apple.com/app/instagram/id389801252" target="_blank" rel="noopener noreferrer">
                <img
                  src="https://static.cdninstagram.com/rsrc.php/v3/yz/r/c5Rp7Ym-Klz.png"
                  alt="Download on the App Store"
                  className="login-app-badge"
                />
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.instagram.android" target="_blank" rel="noopener noreferrer">
                <img
                  src="https://static.cdninstagram.com/rsrc.php/v3/yo/r/Tu9eNfPZ4S-.png"
                  alt="Get it on Google Play"
                  className="login-app-badge"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Section: footer links + language select + copyright ---------- */}
      <footer className="login-footer">
        <div className="login-footer-links">
          {footerLinks.map((link, index) => (
            <a key={index} href="#" className="login-footer-link">{link}</a>
          ))}
        </div>
        <div className="login-footer-bottom">
          <select className="login-language-select">
            <option value="en">English</option>
            <option value="ko">한국어</option>
            <option value="ja">日本語</option>
            <option value="zh">中文(简体)</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
          <span className="login-copyright">© 2026 Instagram from Meta</span>
        </div>
      </footer>
    </div>
  );
};

export default LoginView;

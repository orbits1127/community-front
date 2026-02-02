'use client';

import React, { useState } from 'react';
import { X, Instagram } from 'lucide-react';
import { AuthUser, LoginCredentials } from '../types';
import { authService } from '../services/dataService';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (user: AuthUser) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
  const [formData, setFormData] = useState<LoginCredentials>({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isFormValid = Boolean(formData.username && formData.password);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login({
        username: formData.username,
        password: formData.password,
      });

      if (response.success && response.data) {
        onLogin(response.data);
        onClose();
      } else {
        setError(response.error || '로그인이 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={e => e.stopPropagation()}>
        <div className="login-modal__header">
          <h2 className="login-modal__title">Switch account</h2>
          <button
            type="button"
            className="login-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="login-modal__card">
          <h1 className="login-modal__logo" aria-label="Instagram">
            <Instagram className="login-modal__logo-icon" size={48} />
            <span className="login-modal__logo-text">Instagram</span>
          </h1>

          {error && (
            <p className="login-modal__error" role="alert">
              {error}
            </p>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-input-wrapper">
              <input
                type="text"
                name="username"
                className={`login-input ${formData.username ? 'has-value' : ''}`}
                value={formData.username}
                onChange={handleInputChange}
                aria-label="Username or email"
                autoComplete="username"
              />
              <span className={`login-input-label ${formData.username ? 'active' : ''}`}>
                Username or email
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
                autoComplete="current-password"
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
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

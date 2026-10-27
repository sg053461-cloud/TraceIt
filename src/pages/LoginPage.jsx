/**
 * TraceIt — Login & Registration Page Component
 * LoginPage.jsx
 *
 * Implements authentication identical to login.html:
 * sign-in with campus email/password, new account registration with roles (Student/Faculty/Staff),
 * one-click pre-configured demo logins, password reveal toggles, and redirect notifications.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage({
  onLoginSuccess,
  onNavigate,
  theme,
  onToggleTheme,
  redirectMessage,
}) {
  const { login, register, loginDemo } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  // Form states for login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginRemember, setLoginRemember] = useState(true);

  // Form states for registration
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('Student');
  const [regId, setRegId] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // Error/Success alert state
  const [alert, setAlert] = useState(null);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setAlert(null);

    const res = login(loginEmail, loginPassword);
    if (res.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setAlert({ type: 'error', message: res.message });
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setAlert(null);

    if (regPassword !== regConfirm) {
      setAlert({ type: 'error', message: 'Passwords do not match. Please verify both fields.' });
      return;
    }

    if (regPassword.length < 6) {
      setAlert({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    const res = register({
      name: regName,
      email: regEmail,
      role: regRole,
      studentId: regId,
      phone: regPhone,
      password: regPassword,
    });

    if (res.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setAlert({ type: 'error', message: res.message });
    }
  };

  const handleDemoClick = (accountId) => {
    setAlert(null);
    const res = loginDemo(accountId);
    if (res.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setAlert({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Header ────────────────────────────────────── */}
      <header className="auth-header">
        <a
          href="#/"
          className="navbar__brand"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('landing');
          }}
          aria-label="TraceIt Home"
        >
          <div className="navbar__logo" aria-hidden="true">
            <img src="/images/logo-icon.png" alt="TraceIt" className="navbar__logo-img" width="36" height="36" />
          </div>
          <span>
            Trace<span className="gradient-text">It</span>
          </span>
        </a>

        <div className="flex items-center gap-3">
          <button
            className="navbar__icon-btn"
            id="theme-toggle"
            onClick={onToggleTheme}
            aria-label="Toggle dark mode"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => onNavigate('landing')}
          >
            Back to Home
          </button>
        </div>
      </header>

      {/* ── Main Auth Section ─────────────────────────────── */}
      <main className="auth-main" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div className="hero-bg-blob hero-bg-blob--1" style={{ opacity: 0.35 }} aria-hidden="true" />
        <div className="hero-bg-blob hero-bg-blob--2" style={{ opacity: 0.35 }} aria-hidden="true" />

        <div className="auth-container animate-fade-in">
          <div className="auth-card">
            <div className="auth-card__header">
              <img
                src="/images/logo-icon.png"
                alt="TraceIt"
                style={{
                  width: '52px',
                  height: '52px',
                  margin: '0 auto var(--space-3)',
                  display: 'block',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-card)',
                }}
              />
              <div className="auth-card__badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Campus Security Portal
              </div>
              <h1 className="auth-card__title">Welcome to TraceIt</h1>
              <p className="auth-card__desc" id="auth-subtitle">
                Sign in to your campus account to browse items or submit lost &amp; found reports.
              </p>
            </div>

            {/* Redirect Notice Banner */}
            {redirectMessage && (
              <div
                className="card mb-4"
                style={{
                  padding: 'var(--space-3)',
                  background: 'rgba(var(--clr-primary-rgb),0.08)',
                  borderColor: 'rgba(var(--clr-primary-rgb),0.25)',
                }}
                role="status"
              >
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{redirectMessage}</span>
                </p>
              </div>
            )}

            {/* Alert Message Box */}
            {alert && (
              <div
                className="card mb-4"
                style={{
                  padding: 'var(--space-3)',
                  background: alert.type === 'error' ? 'var(--clr-danger-bg)' : 'var(--clr-success-bg)',
                  borderColor: alert.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
                }}
                role="alert"
              >
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    margin: 0,
                    color: alert.type === 'error' ? 'var(--clr-danger)' : 'var(--clr-success)',
                  }}
                >
                  {alert.message}
                </p>
              </div>
            )}

            {/* Segmented Tab Switcher */}
            <div className="auth-tabs" role="tablist" aria-label="Sign in or register">
              <button
                className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                id="tab-login"
                role="tab"
                aria-selected={activeTab === 'login'}
                onClick={() => setActiveTab('login')}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                id="tab-register"
                role="tab"
                aria-selected={activeTab === 'register'}
                onClick={() => setActiveTab('register')}
              >
                Create Account
              </button>
            </div>

            {/* ── TAB PANE 1: Sign In ── */}
            {activeTab === 'login' && (
              <div id="pane-login" role="tabpanel" aria-labelledby="tab-login">
                <form id="form-login" onSubmit={handleLoginSubmit} noValidate>
                  <div className="form-group">
                    <label className="form-label" htmlFor="login-email">
                      Campus Email <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      id="login-email"
                      className="form-control"
                      placeholder="e.g. alex@campus.edu"
                      required
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <div className="flex-between mb-1">
                      <label className="form-label" htmlFor="login-password" style={{ marginBottom: 0 }}>
                        Password <span className="required">*</span>
                      </label>
                    </div>
                    <div className="input-password-wrap">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        id="login-password"
                        className="form-control"
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        aria-label="Toggle password visibility"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex-between mb-6 flex-wrap gap-2">
                    <label className="flex items-center gap-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        id="login-remember"
                        checked={loginRemember}
                        onChange={(e) => setLoginRemember(e.target.checked)}
                      />
                      <span>Remember me on this campus device</span>
                    </label>
                  </div>

                  <button type="submit" className="btn btn--primary btn--full btn--lg" id="btn-submit-login">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: '8px' }}>
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Sign In to TraceIt
                  </button>
                </form>

                {/* Quick Demo Logins */}
                <div className="demo-accounts-box">
                  <div className="demo-accounts-box__title">
                    <span>⚡ One-Click Demo Access</span>
                    <span style={{ fontWeight: 'normal', fontSize: '10px', textTransform: 'none', color: 'var(--clr-text-tertiary)' }}>
                      Preconfigured profiles
                    </span>
                  </div>
                  <div className="demo-accounts-buttons">
                    <button
                      type="button"
                      className="btn-demo"
                      id="demo-student"
                      onClick={() => handleDemoClick('user_stu_001')}
                      title="Sign in as Alex Johnson (Student)"
                    >
                      <span style={{ fontSize: '18px' }}>🎓</span>
                      <div>
                        <span className="btn-demo__role">Student</span>
                        <span className="btn-demo__email">alex@campus.edu</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="btn-demo"
                      id="demo-faculty"
                      onClick={() => handleDemoClick('user_fac_002')}
                      title="Sign in as Prof. Sarah Smith (Faculty)"
                    >
                      <span style={{ fontSize: '18px' }}>👩‍🏫</span>
                      <div>
                        <span className="btn-demo__role">Faculty</span>
                        <span className="btn-demo__email">sarah.smith@campus.edu</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB PANE 2: Create Account ── */}
            {activeTab === 'register' && (
              <div id="pane-register" role="tabpanel" aria-labelledby="tab-register">
                <form id="form-register" onSubmit={handleRegisterSubmit} noValidate>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-name">
                      Full Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="reg-name"
                      className="form-control"
                      placeholder="e.g. Maya Lin"
                      required
                      autoComplete="name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-email">
                      Campus Email <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      id="reg-email"
                      className="form-control"
                      placeholder="e.g. maya@campus.edu"
                      required
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="reg-role">
                        Campus Role <span className="required">*</span>
                      </label>
                      <select
                        id="reg-role"
                        className="form-control"
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value)}
                      >
                        <option value="Student">Student</option>
                        <option value="Faculty">Faculty</option>
                        <option value="Staff">Staff / Administration</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="reg-id">
                        Student / Staff ID
                      </label>
                      <input
                        type="text"
                        id="reg-id"
                        className="form-control"
                        placeholder="e.g. STU-2024-1102"
                        value={regId}
                        onChange={(e) => setRegId(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-phone">
                      Phone Number <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      id="reg-phone"
                      className="form-control"
                      placeholder="+91 98765 43210"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-password">
                      Password <span className="required">*</span>
                    </label>
                    <div className="input-password-wrap">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        id="reg-password"
                        className="form-control"
                        placeholder="At least 6 characters"
                        required
                        autoComplete="new-password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowRegPassword((prev) => !prev)}
                        aria-label="Toggle password visibility"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-confirm">
                      Confirm Password <span className="required">*</span>
                    </label>
                    <div className="input-password-wrap">
                      <input
                        type={showRegConfirm ? 'text' : 'password'}
                        id="reg-confirm"
                        className="form-control"
                        placeholder="Re-enter password"
                        required
                        autoComplete="new-password"
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowRegConfirm((prev) => !prev)}
                        aria-label="Toggle password visibility"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn btn--primary btn--full btn--lg" id="btn-submit-register">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: '8px' }}>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                    Create Account &amp; Enter
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

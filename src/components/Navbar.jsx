/**
 * TraceIt — Navbar Component
 * Navbar.jsx
 *
 * Top application header bar providing mobile sidebar toggle, brand identity,
 * global live search input with keyboard shortcut (/), dark/light theme switcher,
 * and user session details.
 */

import React, { useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserInitials } from '../services/auth.js';

export default function Navbar({
  onToggleSidebar,
  onNavigate,
  theme,
  onToggleTheme,
  searchQuery,
  onSearchChange,
  isSidebarOpen,
}) {
  const { user, logout } = useAuth();
  const searchInputRef = useRef(null);

  // Keyboard shortcut '/' focuses the global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        document.activeElement.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      onNavigate('browse');
    }
  };

  return (
    <header className="navbar" role="banner">
      <button
        className="navbar__toggle"
        id="sidebar-toggle"
        onClick={onToggleSidebar}
        aria-label="Toggle navigation"
        aria-expanded={isSidebarOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <a
        href="#/dashboard"
        className="navbar__brand"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('dashboard');
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

      <div className="navbar__search" role="search">
        <span className="navbar__search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          ref={searchInputRef}
          type="search"
          id="global-search"
          placeholder="Search items… (press /)"
          aria-label="Search all items"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            onNavigate('browse');
          }}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      <nav className="navbar__actions" aria-label="Utility navigation">
        <button
          className="navbar__icon-btn"
          id="theme-toggle"
          onClick={onToggleTheme}
          aria-label="Toggle dark mode"
          title="Toggle theme (Alt+T)"
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {user ? (
          <div className="navbar__user" title={`${user.name} (${user.role})`}>
            <div
              className="navbar__user-avatar"
              style={{ background: user.avatarBg || '#2563EB' }}
              aria-hidden="true"
            >
              {getUserInitials(user.name)}
            </div>
            <div className="navbar__user-info">
              <span className="navbar__user-name">{user.name}</span>
              <span className="navbar__user-role">{user.role}</span>
            </div>
            <button
              className="navbar__logout-btn"
              id="navbar-logout-btn"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            className="btn btn--primary btn--sm"
            onClick={() => onNavigate('login')}
            style={{ marginLeft: 'var(--space-2)' }}
          >
            Sign In
          </button>
        )}
      </nav>
    </header>
  );
}

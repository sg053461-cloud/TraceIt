/**
 * TraceIt — Sidebar Component
 * Sidebar.jsx
 *
 * Side navigation drawer with navigation links, counters, user badge, and mobile overlay.
 */

import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserInitials } from '../services/auth.js';

export default function Sidebar({
  activePage,
  onNavigate,
  isOpen,
  onClose,
  totalItemsCount = 0,
  matchesCount = 0,
}) {
  const { user, logout } = useAuth();

  const handleLinkClick = (page) => {
    onNavigate(page);
    onClose();
  };

  return (
    <>
      <aside
        id="sidebar"
        className={`sidebar ${isOpen ? 'mobile-open' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <nav className="sidebar__nav">
          <a
            href="#/dashboard"
            className={`sidebar__item ${activePage === 'dashboard' ? 'active' : ''}`}
            aria-current={activePage === 'dashboard' ? 'page' : 'false'}
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('dashboard');
            }}
          >
            <span aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
            <span>Dashboard</span>
          </a>

          <a
            href="#/browse"
            className={`sidebar__item ${activePage === 'browse' ? 'active' : ''}`}
            aria-current={activePage === 'browse' ? 'page' : 'false'}
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('browse');
            }}
          >
            <span aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </span>
            <span>Browse Items</span>
            <span className="sidebar__badge" aria-label={`${totalItemsCount} items`}>
              {totalItemsCount}
            </span>
          </a>

          <a
            href="#/matches"
            className={`sidebar__item ${activePage === 'matches' ? 'active' : ''}`}
            aria-current={activePage === 'matches' ? 'page' : 'false'}
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('matches');
            }}
          >
            <span aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z" />
              </svg>
            </span>
            <span>Smart Matches</span>
            {matchesCount > 0 && (
              <span className="sidebar__badge" aria-label={`${matchesCount} matches`}>
                {matchesCount}
              </span>
            )}
          </a>

          <div className="sidebar__section-label">Report</div>

          <a
            href="#/report-lost"
            className={`sidebar__item ${activePage === 'report-lost' ? 'active' : ''}`}
            aria-current={activePage === 'report-lost' ? 'page' : 'false'}
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('report-lost');
            }}
          >
            <span aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <span>Report Lost</span>
          </a>

          <a
            href="#/report-found"
            className={`sidebar__item ${activePage === 'report-found' ? 'active' : ''}`}
            aria-current={activePage === 'report-found' ? 'page' : 'false'}
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('report-found');
            }}
          >
            <span aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span>Report Found</span>
          </a>

          <div className="sidebar__section-label">Account</div>

          <a
            href="#/analytics"
            className={`sidebar__item ${activePage === 'analytics' ? 'active' : ''}`}
            aria-current={activePage === 'analytics' ? 'page' : 'false'}
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('analytics');
            }}
          >
            <span aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            <span>Analytics</span>
          </a>

          <div className="sidebar__section-label">Account</div>

          <a
            href="#/settings"
            className={`sidebar__item ${activePage === 'settings' ? 'active' : ''}`}
            aria-current={activePage === 'settings' ? 'page' : 'false'}
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('settings');
            }}
          >
            <span aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <span>Settings</span>
          </a>
        </nav>

        {user && (
          <div className="sidebar__user">
            <div className="sidebar__user-inner">
              <div
                className="sidebar__user-avatar"
                style={{ background: user.avatarBg || '#2563EB' }}
                aria-hidden="true"
              >
                {getUserInitials(user.name)}
              </div>
              <div className="sidebar__user-details">
                <div className="sidebar__user-name" title={user.name}>
                  {user.name}
                </div>
                <div className="sidebar__user-role">
                  <span>{user.role}</span>
                  {user.studentId ? ` · ${user.studentId}` : ''}
                </div>
              </div>
              <button
                className="sidebar__logout-btn"
                id="sidebar-logout-btn"
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
          </div>
        )}

        <div className="sidebar__footer">
          <button
            className="btn btn--primary btn--full btn--sm"
            onClick={() => handleLinkClick('report-lost')}
          >
            + Report Lost Item
          </button>
        </div>
      </aside>

      <div
        id="sidebar-overlay"
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
    </>
  );
}

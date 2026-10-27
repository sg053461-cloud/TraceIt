/**
 * TraceIt — Dashboard Page Component
 * DashboardPage.jsx
 *
 * Reproduces the dashboard layout and features from dashboard.html:
 * live metric stat cards, Quick Actions shortcuts, real-time activity feed,
 * daily inspirational quote with API integration, and recent items preview.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { getStorageStats, getRecentItems, getAllItems } from '../services/storage.js';
import { fetchQuote } from '../services/api.js';
import { getCategoryEmoji, formatDate, truncate } from '../services/utils.js';

export default function DashboardPage({
  onNavigate,
  onViewDetail,
  itemsVersion,
  matchesCount = 0,
}) {
  const [stats, setStats] = useState({ total: 0, lostCount: 0, foundCount: 0, resolved: 0 });
  const [recentItems, setRecentItems] = useState([]);
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(true);

  // Load statistics and recent items
  useEffect(() => {
    setStats(getStorageStats());
    setRecentItems(getRecentItems(6));
  }, [itemsVersion]);

  // Active high-urgency items count
  const urgentCount = useMemo(() => {
    return getAllItems().filter((i) => i.isUrgent && i.status !== 'resolved').length;
  }, [itemsVersion]);

  // Fetch inspirational quote from Quotable API
  useEffect(() => {
    let isMounted = true;
    setLoadingQuote(true);

    fetchQuote()
      .then((data) => {
        if (isMounted) {
          setQuote(data);
          setLoadingQuote(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setQuote({
            content: 'Honesty is the first chapter in the book of wisdom.',
            author: 'Thomas Jefferson',
          });
          setLoadingQuote(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header flex-between flex-wrap gap-4">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back. Here's what's happening on campus today.</p>
        </div>
        <div className="flex gap-3">
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => onNavigate('report-lost')}
          >
            + Report Lost
          </button>
          <button
            className="btn btn--primary btn--sm"
            onClick={() => onNavigate('report-found')}
          >
            + Report Found
          </button>
        </div>
      </header>

      {/* High-Priority Active Alert Banner on Dashboard */}
      {urgentCount > 0 && (
        <div
          className="card mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.04))',
            border: '1.5px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
          role="alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🚨</span>
            <div>
              <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-danger)', display: 'block' }}>
                {urgentCount} High-Urgency Item{urgentCount > 1 ? 's' : ''} Need Immediate Attention!
              </strong>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)' }}>
                Critical possessions (student IDs, hall tickets, keys, meds) are currently open. Please check if you found them.
              </span>
            </div>
          </div>
          <button
            className="btn btn--danger btn--sm"
            onClick={() => onNavigate('browse')}
          >
            Review Urgent Items →
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <section aria-labelledby="stats-heading" className="mb-8">
        <h2 id="stats-heading" className="sr-only">Statistics</h2>
        <div className="stats-grid">
          {/* Lost Items */}
          <div className="stat-card" style={{ '--card-accent': 'linear-gradient(90deg,#EF4444,#F87171)' }}>
            <div className="stat-card__icon" style={{ background: 'var(--clr-danger-bg)', color: 'var(--clr-danger)' }} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="stat-card__body">
              <div className="stat-card__value" id="stat-lost" aria-label="Lost items count">
                {stats.lostCount}
              </div>
              <div className="stat-card__label">Lost Items Reported</div>
              <div className="stat-card__trend up">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                Active reports
              </div>
            </div>
          </div>

          {/* Found Items */}
          <div className="stat-card" style={{ '--card-accent': 'linear-gradient(90deg,#10B981,#34D399)' }}>
            <div className="stat-card__icon" style={{ background: 'var(--clr-success-bg)', color: 'var(--clr-success)' }} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="stat-card__body">
              <div className="stat-card__value" id="stat-found" aria-label="Found items count">
                {stats.foundCount}
              </div>
              <div className="stat-card__label">Found Items Reported</div>
              <div className="stat-card__trend up">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                Awaiting owners
              </div>
            </div>
          </div>

          {/* Matches */}
          <div className="stat-card" style={{ '--card-accent': 'var(--gradient-brand)' }}>
            <div className="stat-card__icon" style={{ background: 'rgba(var(--clr-primary-rgb),0.10)', color: 'var(--clr-primary)' }} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z" />
              </svg>
            </div>
            <div className="stat-card__body">
              <div className="stat-card__value" id="stat-matches" aria-label="Smart matches count">
                {matchesCount}
              </div>
              <div className="stat-card__label">Smart Matches Found</div>
              <div className="stat-card__trend up">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                Auto-detected
              </div>
            </div>
          </div>

          {/* Total Reports */}
          <div className="stat-card" style={{ '--card-accent': 'linear-gradient(90deg,#F59E0B,#FCD34D)' }}>
            <div className="stat-card__icon" style={{ background: 'var(--clr-warning-bg)', color: 'var(--clr-warning)' }} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div className="stat-card__body">
              <div className="stat-card__value" id="stat-total" aria-label="Total items count">
                {stats.total}
              </div>
              <div className="stat-card__label">Total Reports</div>
              <div className="stat-card__trend">
                All time
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="dashboard-main-grid">
        <div>
          {/* Quick Actions */}
          <section className="card mb-6" aria-labelledby="quick-actions-title">
            <h2 id="quick-actions-title" className="font-semibold mb-4" style={{ fontSize: 'var(--text-base)' }}>
              Quick Actions
            </h2>
            <div className="quick-actions">
              <button
                type="button"
                className="quick-action-card quick-action-card--lost"
                onClick={() => onNavigate('report-lost')}
              >
                <span aria-hidden="true">🔴</span>
                <strong>Report Lost</strong>
              </button>
              <button
                type="button"
                className="quick-action-card quick-action-card--found"
                onClick={() => onNavigate('report-found')}
              >
                <span aria-hidden="true">🟢</span>
                <strong>Report Found</strong>
              </button>
              <button
                type="button"
                className="quick-action-card quick-action-card--browse"
                onClick={() => onNavigate('browse')}
              >
                <span aria-hidden="true">🔍</span>
                <strong>Browse All</strong>
              </button>
              <button
                type="button"
                className="quick-action-card quick-action-card--matches"
                onClick={() => onNavigate('matches')}
              >
                <span aria-hidden="true">⚡</span>
                <strong>View Matches</strong>
              </button>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="card" aria-labelledby="activity-title">
            <div className="flex-between mb-4">
              <h2 id="activity-title" className="font-semibold" style={{ fontSize: 'var(--text-base)' }}>
                Recent Activity
              </h2>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => onNavigate('browse')}
              >
                View All
              </button>
            </div>

            <div id="activity-feed" className="activity-feed" aria-live="polite">
              {recentItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--clr-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  No recent activity found. Report an item to get started!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentItems.map((item) => (
                    <div
                      key={item.id}
                      className="activity-item"
                      onClick={() => onViewDetail(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--clr-bg)',
                        cursor: 'pointer',
                        transition: 'background var(--dur-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--clr-surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--clr-bg)')}
                    >
                      <span style={{ fontSize: '24px', flexShrink: 0 }}>
                        {getCategoryEmoji(item.category)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--clr-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </p>
                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)' }}>
                          📍 {item.locationLost || item.locationFound || 'Campus'} · 📅 {formatDate(item.dateLost || item.dateFound || item.createdAt)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.isUrgent && item.status !== 'resolved' && (
                          <span
                            className="badge"
                            style={{
                              background: 'var(--clr-danger)',
                              color: '#fff',
                              fontSize: '10px',
                              padding: '2px 6px',
                              fontWeight: 700,
                            }}
                          >
                            🚨 Urgent
                          </span>
                        )}
                        {item.type === 'lost' && item.rewardAmount && item.status !== 'resolved' && (
                          <span
                            className="badge"
                            style={{
                              background: '#f59e0b',
                              color: '#fff',
                              fontSize: '10px',
                              padding: '2px 6px',
                              fontWeight: 700,
                            }}
                          >
                            🎁 ₹{item.rewardAmount}
                          </span>
                        )}
                        <span className={`badge badge--${item.type}`}>
                          {item.type === 'lost' ? 'Lost' : 'Found'}
                        </span>
                        {item.status === 'resolved' && (
                          <span className="badge badge--resolved">Resolved</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <aside>
          {/* Quote Widget */}
          <section className="quote-widget mb-6" aria-labelledby="quote-title">
            <h2 id="quote-title" className="sr-only">Daily Inspiration</h2>
            <div id="quote-content">
              {loadingQuote ? (
                <div className="quote-widget__loader">
                  <div className="spinner spinner--sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                  <span>Loading inspiration…</span>
                </div>
              ) : quote ? (
                <div style={{ padding: 'var(--space-4)' }}>
                  <p style={{ fontStyle: 'italic', fontSize: 'var(--text-sm)', marginBottom: '8px', lineHeight: 'var(--lh-relaxed)', color: 'white' }}>
                    "{quote.content}"
                  </p>
                  {quote.author && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.8)', display: 'block', textAlign: 'right' }}>
                      — {quote.author}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </section>

          {/* Recent Items (mini list) */}
          <section className="card" aria-labelledby="recent-title">
            <div className="flex-between mb-4">
              <h2 id="recent-title" className="font-semibold" style={{ fontSize: 'var(--text-base)' }}>
                Recent Items
              </h2>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => onNavigate('browse')}
              >
                All
              </button>
            </div>
            <div id="recent-items-grid" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }} aria-live="polite">
              {recentItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onViewDetail(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--clr-border-light)',
                    background: 'var(--clr-surface)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{getCategoryEmoji(item.category)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--clr-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--clr-text-tertiary)' }}>
                      {truncate(item.locationLost || item.locationFound || '', 24)}
                    </p>
                  </div>
                  <span className={`badge badge--${item.type}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

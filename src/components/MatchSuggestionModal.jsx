/**
 * TraceIt — Match Suggestion Modal Component
 * MatchSuggestionModal.jsx
 *
 * Appears immediately after reporting a lost or found item,
 * surfacing real-time heuristic matches or confirming published report.
 */

import React from 'react';
import { getCategoryEmoji, formatDate } from '../services/utils.js';
import { matchLabel } from '../services/matching.js';

export default function MatchSuggestionModal({
  data, // { type: 'lost'|'found', item, matches }
  onClose,
  onVerifyFoundItem,
  onNavigate,
}) {
  if (!data) return null;

  const { type, item, matches = [] } = data;
  const isLost = type === 'lost';

  // 1. Lost item with matches
  if (isLost && matches.length > 0) {
    return (
      <div
        className="modal-overlay active"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lost-match-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="modal modal--lg">
          <div className="modal__header">
            <h2 className="modal__title" id="lost-match-title">
              ⚡ {matches.length} Potential Smart Match{matches.length > 1 ? 'es' : ''} Found!
            </h2>
            <button className="modal__close" onClick={onClose} aria-label="Close dialog">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="modal__body">
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-4)',
                  fontSize: 'var(--text-sm)',
                  lineHeight: 1.5,
                }}
              >
                🎉 <strong>Instant Match Detected!</strong> We found {matches.length} item{matches.length > 1 ? 's' : ''} in the found catalog that match your lost report for <strong>"{item.name}"</strong>. Check them below:
              </div>

              <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                {matches.slice(0, 5).map((m, idx) => {
                  const { label, color } = matchLabel(m.pct);
                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--clr-bg)',
                        border: '1px solid var(--clr-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-4)',
                        marginBottom: 'var(--space-3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 'var(--space-3)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: '200px' }}>
                        <span style={{ fontSize: '32px' }}>{getCategoryEmoji(m.foundItem.category)}</span>
                        <div>
                          <p style={{ fontWeight: 700, color: 'var(--clr-text-primary)', margin: '0 0 2px' }}>
                            {m.foundItem.name}
                          </p>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)', margin: 0 }}>
                            📍 {m.foundItem.locationFound || 'Campus'} · 📅 Found on {formatDate(m.foundItem.dateFound)}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: `${color}18`,
                              color,
                              border: `1px solid ${color}40`,
                              fontSize: 'var(--text-xs)',
                              fontWeight: 700,
                            }}
                          >
                            {m.pct}% {label}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => {
                            onClose();
                            onVerifyFoundItem(m.foundItem);
                          }}
                        >
                          🛡️ Verify &amp; View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal__footer">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                onClose();
                onNavigate('browse');
              }}
            >
              Browse All Items
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                onClose();
                onNavigate('matches');
              }}
            >
              ⚡ View All in Smart Matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Lost item with no immediate matches
  if (isLost && matches.length === 0) {
    return (
      <div
        className="modal-overlay active"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lost-published-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="modal">
          <div className="modal__header">
            <h2 className="modal__title" id="lost-published-title">
              ⚡ Lost Report Published
            </h2>
            <button className="modal__close" onClick={onClose} aria-label="Close dialog">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="modal__body">
            <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: 'var(--space-3)' }}>🔍</span>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)', color: 'var(--clr-text-primary)' }}>
                No Immediate Matches Found Yet
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-secondary)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
                Your report for <strong>"{item.name}"</strong> is now active in TraceIt. Our smart-matching engine will continuously compare incoming found reports and notify you as soon as a match occurs!
              </p>
            </div>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Stay Here
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                onClose();
                onNavigate('browse');
              }}
            >
              Go to Browse Items
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Found item with matches
  if (!isLost && matches.length > 0) {
    return (
      <div
        className="modal-overlay active"
        role="dialog"
        aria-modal="true"
        aria-labelledby="found-match-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="modal modal--lg">
          <div className="modal__header">
            <h2 className="modal__title" id="found-match-title">
              🎉 {matches.length} Match{matches.length > 1 ? 'es' : ''} Found!
            </h2>
            <button className="modal__close" onClick={onClose} aria-label="Close dialog">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="modal__body">
            <p style={{ color: 'var(--clr-text-secondary)', marginBottom: 'var(--space-4)' }}>
              Your found item matches these lost reports. Please contact the owners!
            </p>
            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {matches.slice(0, 3).map((m, idx) => {
                const { label, color } = matchLabel(m.pct);
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--clr-bg)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-4)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span style={{ fontSize: '32px' }}>{getCategoryEmoji(m.lostItem.category)}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, color: 'var(--clr-text-primary)', margin: '0 0 2px' }}>
                          {m.lostItem.name}
                        </p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)', margin: 0 }}>
                          {m.lostItem.locationLost || ''} · {formatDate(m.lostItem.dateLost)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color, margin: 0 }}>
                          {m.pct}%
                        </p>
                        <p style={{ fontSize: 'var(--text-xs)', color, margin: 0 }}>
                          {label}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                onClose();
                onNavigate('matches');
              }}
            >
              View All Matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

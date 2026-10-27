/**
 * TraceIt — Match Card Component
 * MatchCard.jsx
 *
 * Renders an automated comparison between a lost item and a found item with similarity score.
 */

import React from 'react';
import { getCategoryEmoji, getCategoryLabel, formatDate } from '../services/utils.js';
import { matchLabel } from '../services/matching.js';

export default function MatchCard({ match, index = 0, onVerifyFound, onNavigate }) {
  const { pct, lostItem, foundItem } = match;
  const { label: qualLabel, color: qualColor } = matchLabel(pct);

  return (
    <div
      className="match-card animate-slide-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="match-card__header">
        <div className="match-card__score-group">
          <div
            className="match-card__pct-badge"
            style={{
              background: `${qualColor}18`,
              color: qualColor,
              border: `1px solid ${qualColor}40`,
            }}
          >
            <span>{pct}%</span>
          </div>
          <div className="match-card__score-text">
            <span className="match-card__score-title" style={{ color: qualColor }}>
              {qualLabel}
            </span>
            <span className="match-card__score-subtitle">Calculated Similarity Score</span>
          </div>
        </div>

        <div className="match-card__meter-wrap">
          <div className="progress-bar match-card__meter-bar">
            <div
              className="progress-bar__fill"
              style={{ width: `${pct}%`, background: qualColor }}
            />
          </div>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: qualColor,
              minWidth: '36px',
              textAlign: 'right',
            }}
          >
            {pct}%
          </span>
        </div>
      </div>

      <div className="match-card__items">
        {/* Lost Item Summary */}
        <div className="match-card__item">
          <div className="match-item-type-badge match-item-type-badge--lost">
            <span className="match-item-type-dot" />
            <span>Lost Item</span>
          </div>
          <h3 className="match-card__item-name">{lostItem.name}</h3>
          <div className="match-card__item-meta">
            <div className="match-meta-row">
              <span className="match-meta-icon">{getCategoryEmoji(lostItem.category)}</span>
              <span className="match-meta-text">{getCategoryLabel(lostItem.category)}</span>
            </div>
            {lostItem.locationLost && (
              <div className="match-meta-row">
                <span className="match-meta-icon" aria-hidden="true">📍</span>
                <span className="match-meta-text">{lostItem.locationLost}</span>
              </div>
            )}
            {lostItem.dateLost && (
              <div className="match-meta-row">
                <span className="match-meta-icon" aria-hidden="true">📅</span>
                <span className="match-meta-text">Reported Lost {formatDate(lostItem.dateLost)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Connector */}
        <div className="match-card__connector" aria-hidden="true">
          <div className="match-card__connector-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4m0 0L3 8m4-4l4 4m10 4v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
          <span className="match-card__connector-label">MATCH</span>
        </div>

        {/* Found Item Summary */}
        <div className="match-card__item">
          <div className="match-item-type-badge match-item-type-badge--found">
            <span className="match-item-type-dot" />
            <span>Found Item</span>
          </div>
          <h3 className="match-card__item-name">{foundItem.name}</h3>
          <div className="match-card__item-meta">
            <div className="match-meta-row">
              <span className="match-meta-icon">{getCategoryEmoji(foundItem.category)}</span>
              <span className="match-meta-text">{getCategoryLabel(foundItem.category)}</span>
            </div>
            {foundItem.locationFound && (
              <div className="match-meta-row">
                <span className="match-meta-icon" aria-hidden="true">📍</span>
                <span className="match-meta-text">{foundItem.locationFound}</span>
              </div>
            )}
            {foundItem.dateFound && (
              <div className="match-meta-row">
                <span className="match-meta-icon" aria-hidden="true">📅</span>
                <span className="match-meta-text">Found on {formatDate(foundItem.dateFound)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="match-card__privacy-notice"
        style={{
          padding: '12px 16px',
          margin: '0 20px 16px',
          background: 'rgba(108,99,255,0.06)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(108,99,255,0.2)',
          fontSize: '12px',
          lineHeight: 1.5,
          color: 'var(--clr-text-secondary)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600,
            color: 'var(--clr-primary)',
            marginBottom: '4px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Anti-Fraud Protection: Signal Breakdown Masked</span>
        </div>
        <p style={{ margin: 0 }}>
          Individual field match points (brand, color, location markers) are masked to protect genuine owners against fraudulent claims. Verify ownership to unlock item specifics.
        </p>
      </div>

      <div className="match-card__footer">
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => onNavigate('browse')}
        >
          Browse Items
        </button>
        <button
          type="button"
          className="btn btn--primary btn--sm btn-verify-match"
          onClick={() => onVerifyFound(foundItem)}
        >
          <span>🛡️ Verify Ownership to Contact</span>
        </button>
      </div>
    </div>
  );
}

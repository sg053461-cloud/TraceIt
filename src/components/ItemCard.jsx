/**
 * TraceIt — Item Card Component
 * ItemCard.jsx
 *
 * Renders individual lost or found cards in catalog grids.
 * Includes anti-fraud image blur for found items, badges, metadata, and status tags.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getCategoryEmoji, getCategoryLabel, formatDate, truncate, getCustodyAuthority } from '../services/utils.js';
import { getClaimState } from '../services/storage.js';

export default function ItemCard({ item, onClick }) {
  const { user } = useAuth();
  const claimantId = user?.id || user?.email || 'guest';
  const [, setTick] = useState(0);
  const isLost = item.type === 'lost';

  // Questions (and therefore lock/block) apply to FOUND items only
  const claim = isLost ? null : getClaimState(item.id, claimantId);
  const claimLocked = Boolean(claim && (claim.blocked || claim.locked));
  const lockMM = claim ? String(Math.floor(claim.remainingMs / 60000)).padStart(2, '0') : '00';
  const lockSS = claim ? String(Math.floor(claim.remainingMs / 1000) % 60).padStart(2, '0') : '00';

  // Re-render every second only while this card's timer is running
  const timerRunning = Boolean(claim && claim.locked);
  useEffect(() => {
    if (!timerRunning) return undefined;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [timerRunning]);
  const isResolved = item.status === 'resolved';
  const isUrgent = Boolean(item.isUrgent) && !isResolved;
  const hasReward = isLost && Boolean(item.rewardAmount) && !isResolved;
  const dateVal = item.dateLost || item.dateFound || '';
  const locVal = item.locationLost || item.locationFound || '';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(item);
    }
  };

  return (
    <article
      className={`item-card animate-fade-in ${isUrgent ? 'item-card--urgent' : ''}`}
      data-id={item.id}
      data-type={item.type}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${item.name}${isUrgent ? ' (Urgent Priority)' : ''}`}
      onClick={() => onClick(item)}
      onKeyDown={handleKeyDown}
      style={isUrgent ? { borderColor: 'rgba(239, 68, 68, 0.5)', boxShadow: '0 4px 16px rgba(239, 68, 68, 0.15)' } : {}}
    >
      {/* High-Urgency Red Banner */}
      {isUrgent && (
        <div
          style={{
            background: 'linear-gradient(90deg, #dc2626, #ef4444)',
            color: '#ffffff',
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            textTransform: 'uppercase',
            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
          }}
        >
          <span style={{ fontSize: '13px' }}>🚨</span> High Priority · Urgent
        </div>
      )}

      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {item.image ? (
          <img
            className="item-card__image"
            src={item.image}
            alt={item.name}
            loading="lazy"
            style={
              !isResolved
                ? { filter: 'blur(10px) brightness(0.7)', transform: 'scale(1.05)' }
                : {}
            }
          />
        ) : (
          <div
            className="item-card__image-placeholder"
            aria-hidden="true"
            style={{ fontSize: '48px' }}
          >
            {getCategoryEmoji(item.category)}
          </div>
        )}

        <div className="item-card__badge" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span className={`badge badge--${item.type} badge--dot`}>
            {isLost ? 'Lost' : 'Found'}
          </span>
          {hasReward && (
            <span
              className="badge"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                letterSpacing: '0.02em',
              }}
            >
              🎁 ₹{item.rewardAmount} Reward
            </span>
          )}
        </div>

        {!isResolved && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.25)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
              textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            }}
          >
            🔒 Details Protected
          </div>
        )}
      </div>

      <div className="item-card__body">
        <h3 className="item-card__title" title={item.name}>
          {item.name}
        </h3>

        <div className="item-card__meta">
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}>
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            {getCategoryLabel(item.category)}
          </span>

          {locVal ? (
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {truncate(locVal, 30)}
            </span>
          ) : null}

          {dateVal ? (
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(dateVal)}
            </span>
          ) : null}

          {isUrgent && (
            <span style={{ color: 'var(--clr-danger)', fontWeight: 600 }}>
              🚨 Urgent Priority Item
            </span>
          )}

          {hasReward && (
            <span style={{ color: '#b45309', fontWeight: 600 }}>
              🎁 ₹{item.rewardAmount} Reward Offered
            </span>
          )}

          {item.tips && item.tips.length > 0 && (
            <span style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>
              👁️ {item.tips.length} Sighting Tip{item.tips.length !== 1 ? 's' : ''}
            </span>
          )}

          {!isResolved && claim?.blocked ? (
            <span style={{ color: 'var(--clr-danger)', fontWeight: 700 }}>
              🚫 Permanently Blocked
            </span>
          ) : !isResolved && claim?.locked ? (
            <span style={{ color: '#b45309', fontWeight: 700 }}>
              ⏳ Try again in {lockMM}:{lockSS}
            </span>
          ) : !isResolved ? (
            <span style={{ color: 'var(--clr-primary)', fontWeight: 500 }}>
              {isLost ? '🛡️ Details Protected' : '🛡️ Verification Required'}
            </span>
          ) : (
            isLost && item.color ? <span>🎨 {item.color}</span> : null
          )}
        </div>

        {/* 🎁 Honesty Reward / Bounty Tag Callout */}
        {hasReward && (
          <div
            style={{
              margin: '8px 0 0',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.08))',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '15px' }}>🎁</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span>₹{item.rewardAmount} REWARD OFFERED</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.rewardNote || `Offering ₹${item.rewardAmount} reward for return.`}>
                {item.rewardNote || `Offering ₹${item.rewardAmount} reward for return.`}
              </div>
            </div>
          </div>
        )}

        {/* Custody / "Currently at" banner — only for found items with authority custody */}
        {!isLost && item.custodyMode === 'authority' && item.custodyAuthority && (() => {
          const auth = getCustodyAuthority(item.custodyAuthority);
          return (
            <div
              style={{
                margin: '8px 0 0',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '16px', lineHeight: 1.2 }}>{auth?.icon || '🏛️'}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Currently at
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--clr-text-primary)', marginTop: '1px' }}>
                  {auth?.label || item.custodyAuthority}
                </div>
                {item.custodyRoom && (
                  <div style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', marginTop: '1px' }}>
                    {item.custodyRoom}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <div className="item-card__footer">
          <span className={`badge badge--${item.status === 'resolved' ? 'resolved' : 'pending'}`}>
            {item.status === 'resolved' ? 'Resolved' : 'Active'}
          </span>
          <button
            className="btn btn--secondary btn--sm"
            onClick={(e) => {
              e.stopPropagation();
              onClick(item);
            }}
          >
            {isResolved
              ? 'View'
              : claim?.blocked
                ? 'Blocked'
                : claim?.locked
                  ? `${lockMM}:${lockSS}`
                  : isLost
                    ? 'View'
                    : 'Verify & View'}
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * TraceIt — Matches Page Component
 * MatchesPage.jsx
 *
 * Implements the Smart Matches explorer from matches.html:
 * heuristic match pairs, similarity score tier legend, minimum score threshold filter,
 * live name search, side-by-side card comparison, and anti-fraud verification trigger.
 */

import React, { useState, useMemo } from 'react';
import MatchCard from '../components/MatchCard.jsx';
import { getAllMatches } from '../services/matching.js';

export default function MatchesPage({
  lostItems,
  foundItems,
  onNavigate,
  onVerifyFoundItem,
}) {
  const [search, setSearch] = useState('');
  const [threshold, setThreshold] = useState(20);

  // Compute all matches above the threshold
  const matches = useMemo(() => {
    let all = getAllMatches(lostItems, foundItems, threshold);

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      all = all.filter(
        (m) =>
          m.lostItem.name?.toLowerCase().includes(q) ||
          m.foundItem.name?.toLowerCase().includes(q) ||
          m.lostItem.category?.toLowerCase().includes(q)
      );
    }

    return all;
  }, [lostItems, foundItems, threshold, search]);

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <span style={{ fontSize: '32px' }} aria-hidden="true">⚡</span>
          <h1>Smart Matches</h1>
        </div>
        <p>Our JavaScript engine automatically pairs lost and found items based on shared attributes.</p>
      </header>

      {/* How Scoring Works */}
      <div className="card mb-6" role="note">
        <div className="flex-between flex-wrap gap-4 mb-4">
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', margin: 0 }}>
            Smart Matching Confidence &amp; Privacy
          </h2>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => onNavigate('browse')}
          >
            Browse All Items
          </button>
        </div>

        <div className="score-legend" aria-label="Confidence tiers">
          <div className="score-legend__item">
            <div className="score-legend__dot" style={{ background: '#10B981' }} />
            <span>
              Excellent Match <strong style={{ color: 'var(--clr-text-primary)' }}>80%+</strong>
            </span>
          </div>
          <div className="score-legend__item">
            <div className="score-legend__dot" style={{ background: '#3B82F6' }} />
            <span>
              Good Match <strong style={{ color: 'var(--clr-text-primary)' }}>60%+</strong>
            </span>
          </div>
          <div className="score-legend__item">
            <div className="score-legend__dot" style={{ background: '#F59E0B' }} />
            <span>
              Possible Match <strong style={{ color: 'var(--clr-text-primary)' }}>40%+</strong>
            </span>
          </div>
          <div
            className="score-legend__item"
            style={{ flex: 2, minWidth: '260px', fontSize: '12px', color: 'var(--clr-text-secondary)' }}
          >
            <span>
              🛡️ <strong>Anti-Fraud Protection:</strong> Granular attribute scores are masked to prevent fraudulent claims.
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="filter-bar mb-6">
        <div className="search-bar flex-1" style={{ minWidth: '200px' }}>
          <span className="search-bar__icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="search"
            id="matches-search"
            placeholder="Filter matches by item name…"
            aria-label="Filter matches"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <label
          className="flex items-center gap-2"
          style={{ whiteSpace: 'nowrap', fontSize: 'var(--text-sm)', color: 'var(--clr-text-secondary)' }}
        >
          Min. Score:
          <select
            id="match-threshold"
            className="form-control"
            style={{ width: 'auto' }}
            aria-label="Minimum match score"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value))}
          >
            <option value="20">20% +</option>
            <option value="30">30% +</option>
            <option value="40">40% +</option>
            <option value="50">50% +</option>
            <option value="60">60% +</option>
          </select>
        </label>

        <span id="match-count" className="badge badge--primary" aria-live="polite">
          {matches.length} match{matches.length !== 1 ? 'es' : ''} found
        </span>
      </div>

      {/* Matches Grid */}
      <section aria-label="Match results" aria-live="polite">
        {matches.length === 0 ? (
          <div className="empty-state animate-fade-in" style={{ padding: '48px 0', textAlign: 'center' }}>
            <div className="empty-state__illustration" aria-hidden="true" style={{ fontSize: '80px', marginBottom: '16px' }}>
              🔗
            </div>
            <h3 className="empty-state__title">No matches yet</h3>
            <p className="empty-state__message" style={{ color: 'var(--clr-text-secondary)', marginBottom: '16px' }}>
              Matches are generated automatically when lost and found items share similar attributes.
            </p>
            <button
              className="btn btn--primary"
              onClick={() => onNavigate('report-lost')}
            >
              Report an Item
            </button>
          </div>
        ) : (
          <div id="matches-grid" className="matches-grid">
            {matches.map((m, idx) => (
              <MatchCard
                key={`${m.lostItem.id}-${m.foundItem.id}`}
                match={m}
                index={idx}
                onVerifyFound={onVerifyFoundItem}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

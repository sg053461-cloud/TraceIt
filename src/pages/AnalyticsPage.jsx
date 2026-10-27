/**
 * TraceIt — Analytics Dashboard Page Component
 * AnalyticsPage.jsx
 *
 * Provides deep institutional insight into campus lost & found activity:
 * real-time recovery rate %, category distribution bar charts, resolution donut chart,
 * campus loss hotspots ranking, urgency triage breakdown, and crowdsourced sighting metrics.
 */

import React, { useMemo } from 'react';
import { getAllItems, getStorageStats } from '../services/storage.js';
import { CATEGORIES, getCategoryEmoji } from '../services/utils.js';

export default function AnalyticsPage({ onNavigate, onViewDetail }) {
  const items = useMemo(() => getAllItems(), []);
  const stats = useMemo(() => getStorageStats(), []);

  // Compute KPI metrics
  const totalCount = items.length;
  const lostCount = items.filter((i) => i.type === 'lost').length;
  const foundCount = items.filter((i) => i.type === 'found').length;
  const resolvedCount = items.filter((i) => i.status === 'resolved').length;
  const recoveryRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
  const urgentCount = items.filter((i) => i.isUrgent && i.status !== 'resolved').length;
  const totalTipsCount = items.reduce((acc, i) => acc + (i.tips ? i.tips.length : 0), 0);

  // Category distribution calculation
  const categoryStats = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => {
      map[c.value] = { label: c.label, emoji: c.emoji, lost: 0, found: 0, total: 0 };
    });

    items.forEach((item) => {
      const cat = item.category || 'other';
      if (!map[cat]) {
        map[cat] = { label: cat, emoji: '📦', lost: 0, found: 0, total: 0 };
      }
      if (item.type === 'lost') map[cat].lost++;
      else map[cat].found++;
      map[cat].total++;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [items]);

  const maxCategoryCount = useMemo(() => {
    return Math.max(...categoryStats.map((c) => c.total), 1);
  }, [categoryStats]);

  // Top Campus Hotspots
  const hotspotStats = useMemo(() => {
    const locMap = {};
    items.forEach((item) => {
      const loc = (item.locationLost || item.locationFound || '').trim();
      if (!loc) return;
      locMap[loc] = (locMap[loc] || 0) + 1;
    });

    return Object.entries(locMap)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [items]);

  const maxHotspotCount = useMemo(() => {
    return hotspotStats.length > 0 ? hotspotStats[0].count : 1;
  }, [hotspotStats]);

  // Recently Resolved Success Stories
  const resolvedItems = useMemo(() => {
    return items.filter((i) => i.status === 'resolved').slice(0, 4);
  }, [items]);

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header flex-between flex-wrap gap-4">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '28px' }}>📊</span>
            <h1 style={{ margin: 0 }}>Analytics &amp; Campus Insights</h1>
          </div>
          <p>Real-time data visualization of campus losses, recovery rates, and hotspots.</p>
        </div>

        <div className="flex gap-3">
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => onNavigate('browse')}
          >
            🔍 Browse Catalog
          </button>
          <button
            className="btn btn--primary btn--sm"
            onClick={() => onNavigate('dashboard')}
          >
            🏠 Return to Dashboard
          </button>
        </div>
      </header>

      {/* Top Level KPI Metrics Grid */}
      <section aria-labelledby="kpi-heading" className="mb-8">
        <h2 id="kpi-heading" className="sr-only">Key Performance Indicators</h2>
        <div className="stats-grid">
          {/* Recovery Rate */}
          <div className="stat-card" style={{ '--card-accent': 'linear-gradient(90deg, #10B981, #059669)' }}>
            <div className="stat-card__icon" style={{ background: 'var(--clr-success-bg)', color: 'var(--clr-success)' }}>
              🎯
            </div>
            <div className="stat-card__body">
              <div className="stat-card__value" style={{ color: 'var(--clr-success)' }}>
                {recoveryRate}%
              </div>
              <div className="stat-card__label">Recovery Success Rate</div>
              <div className="stat-card__trend up">
                {resolvedCount} items safely returned
              </div>
            </div>
          </div>

          {/* Active Reports Ratio */}
          <div className="stat-card" style={{ '--card-accent': 'var(--gradient-brand)' }}>
            <div className="stat-card__icon" style={{ background: 'rgba(var(--clr-primary-rgb), 0.12)', color: 'var(--clr-primary)' }}>
              ⚖️
            </div>
            <div className="stat-card__body">
              <div className="stat-card__value">
                {lostCount} <span style={{ fontSize: '18px', fontWeight: 400, opacity: 0.7 }}>vs</span> {foundCount}
              </div>
              <div className="stat-card__label">Lost vs Found Ratio</div>
              <div className="stat-card__trend">
                Total {totalCount} campus reports
              </div>
            </div>
          </div>

          {/* High Urgency Cases */}
          <div className="stat-card" style={{ '--card-accent': 'linear-gradient(90deg, #EF4444, #DC2626)' }}>
            <div className="stat-card__icon" style={{ background: 'var(--clr-danger-bg)', color: 'var(--clr-danger)' }}>
              🚨
            </div>
            <div className="stat-card__body">
              <div className="stat-card__value" style={{ color: 'var(--clr-danger)' }}>
                {urgentCount}
              </div>
              <div className="stat-card__label">High-Urgency Cases</div>
              <div className="stat-card__trend" style={{ color: urgentCount > 0 ? 'var(--clr-danger)' : 'var(--clr-text-secondary)' }}>
                {urgentCount > 0 ? 'Priority items open' : 'All critical items safe'}
              </div>
            </div>
          </div>

          {/* Community Sightings */}
          <div className="stat-card" style={{ '--card-accent': 'linear-gradient(90deg, #3B82F6, #2563EB)' }}>
            <div className="stat-card__icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--clr-primary)' }}>
              👁️
            </div>
            <div className="stat-card__body">
              <div className="stat-card__value">
                {totalTipsCount}
              </div>
              <div className="stat-card__label">Community Sightings</div>
              <div className="stat-card__trend up">
                Crowdsourced tip alerts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Two Column Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {/* Category Breakdown Horizontal Bar Chart */}
        <section className="card">
          <div className="flex-between mb-4">
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 2px' }}>
                📦 Loss Frequency by Category
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)' }}>
                Comparison of lost vs found volume per item classification
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {categoryStats.slice(0, 6).map((cat) => {
              const lostWidth = (cat.lost / maxCategoryCount) * 100;
              const foundWidth = (cat.found / maxCategoryCount) * 100;
              return (
                <div key={cat.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--clr-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{cat.emoji}</span> {cat.label}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--clr-text-secondary)', fontWeight: 700 }}>
                      {cat.total} item{cat.total !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ height: '8px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex', gap: '2px' }}>
                    <div
                      style={{
                        width: `${lostWidth}%`,
                        background: 'var(--clr-danger)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.4s ease',
                      }}
                      title={`Lost: ${cat.lost}`}
                    />
                    <div
                      style={{
                        width: `${foundWidth}%`,
                        background: 'var(--clr-success)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.4s ease',
                      }}
                      title={`Found: ${cat.found}`}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontSize: '10px', color: 'var(--clr-text-tertiary)' }}>
                    <span>🔴 {cat.lost} lost</span>
                    <span>🟢 {cat.found} found</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '16px', justifyContent: 'center', borderTop: '1px solid var(--clr-border-light)', paddingTop: '10px', fontSize: '11px', color: 'var(--clr-text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--clr-danger)', borderRadius: '2px' }} /> Lost Reports
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--clr-success)', borderRadius: '2px' }} /> Found Reports
            </span>
          </div>
        </section>

        {/* Resolution Donut & Success Efficiency */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 2px' }}>
              🎯 Resolution &amp; Recovery Ratio
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)', marginBottom: '16px' }}>
              Proportion of reports successfully closed vs still actively sought
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '190px' }}>
              <svg width="170" height="170" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Track Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="var(--clr-bg)"
                  strokeWidth="12"
                />
                {/* Active Open Slice */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgba(var(--clr-primary-rgb), 0.35)"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset="0"
                />
                {/* Resolved Slice */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - recoveryRate / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>

              {/* Centered Donut Label */}
              <div
                style={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--clr-text-primary)', lineHeight: 1 }}>
                  {recoveryRate}%
                </span>
                <span style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', fontWeight: 600 }}>
                  Resolved
                </span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--clr-bg)', borderRadius: 'var(--radius-md)', padding: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#10B981', display: 'block' }}>
                {resolvedCount}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--clr-text-secondary)' }}>
                ✓ Returned
              </span>
            </div>
            <div style={{ borderLeft: '1px solid var(--clr-border)', paddingLeft: '16px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--clr-primary)', display: 'block' }}>
                {totalCount - resolvedCount}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--clr-text-secondary)' }}>
                ⏳ In Search
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Campus Hotspots & Resolution Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Campus Loss Hotspots */}
        <section className="card">
          <div className="flex-between mb-4">
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 2px' }}>
                📍 Campus Loss Hotspots
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)' }}>
                Areas with highest reported item frequencies
              </p>
            </div>
          </div>

          {hotspotStats.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--clr-text-tertiary)', fontStyle: 'italic' }}>
              No location data accumulated yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {hotspotStats.map((spot, idx) => {
                const pct = (spot.count / maxHotspotCount) * 100;
                return (
                  <div key={spot.location}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '12px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--clr-text-primary)' }}>
                        {idx + 1}. 📍 {spot.location}
                      </span>
                      <span className="badge" style={{ fontSize: '11px', fontWeight: 700 }}>
                        {spot.count} incidents
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: idx === 0 ? 'var(--clr-danger)' : idx === 1 ? 'var(--clr-warning)' : 'var(--clr-primary)',
                          borderRadius: 'var(--radius-full)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Successful Recovery Highlights */}
        <section className="card">
          <div className="flex-between mb-4">
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 2px' }}>
                🎉 Successful Return Highlights
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)' }}>
                Recent verified returns facilitated through TraceIt
              </p>
            </div>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => onNavigate('browse')}
            >
              Browse
            </button>
          </div>

          {resolvedItems.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--clr-text-tertiary)', fontStyle: 'italic' }}>
              No items marked resolved yet. Mark an item resolved to populate recovery stories!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {resolvedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onViewDetail && onViewDetail(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--clr-bg)',
                    cursor: 'pointer',
                    border: '1px solid var(--clr-border-light)',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{getCategoryEmoji(item.category)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: '13px', color: 'var(--clr-text-primary)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--clr-text-secondary)' }}>
                      📍 {item.locationLost || item.locationFound || 'Campus'} · ✓ Safely returned
                    </span>
                  </div>
                  <span className="badge badge--resolved" style={{ fontSize: '11px' }}>
                    Resolved
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

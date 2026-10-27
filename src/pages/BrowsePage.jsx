/**
 * TraceIt — Browse Page Component
 * BrowsePage.jsx
 *
 * Implements the searchable & filterable campus catalog from browse.html:
 * category chips, real-time search, type selector, category selector, sorting,
 * item grid with ItemCard, empty state, and accessible pagination.
 */

import React, { useState, useMemo, useEffect } from 'react';
import ItemCard from '../components/ItemCard.jsx';
import { CATEGORIES } from '../services/utils.js';

const ITEMS_PER_PAGE = 9;

export default function BrowsePage({
  items,
  searchQuery,
  onSearchChange,
  onViewDetail,
  onNavigate,
}) {
  const [selectedType, setSelectedType] = useState(''); // '' | 'lost' | 'found'
  const [selectedCategory, setSelectedCategory] = useState(''); // '' | category
  const [selectedSort, setSelectedSort] = useState('newest'); // 'newest' | 'oldest' | 'name-az' | 'name-za'
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedCategory, selectedSort]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search query filter (matches name, category, brand, description, color, location)
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) =>
        [
          item.name,
          item.category,
          item.brand,
          item.description,
          item.color,
          item.locationLost,
          item.locationFound,
        ].some((val) => val && val.toLowerCase().includes(q))
      );
    }

    // Type filter
    if (selectedType) {
      if (selectedType === 'urgent') {
        result = result.filter((item) => item.isUrgent && item.status !== 'resolved');
      } else if (selectedType === 'reward') {
        result = result.filter((item) => item.type === 'lost' && item.rewardAmount > 0 && item.status !== 'resolved');
      } else {
        result = result.filter((item) => item.type === selectedType);
      }
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // Sorting: Active urgent items always appear pinned at the top
    result.sort((a, b) => {
      const aUrgent = (a.isUrgent && a.status !== 'resolved') ? 1 : 0;
      const bUrgent = (b.isUrgent && b.status !== 'resolved') ? 1 : 0;
      if (bUrgent !== aUrgent) {
        return bUrgent - aUrgent;
      }

      if (selectedSort === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (selectedSort === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (selectedSort === 'name-az') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (selectedSort === 'name-za') {
        return (b.name || '').localeCompare(a.name || '');
      }
      return 0;
    });

    return result;
  }, [items, searchQuery, selectedType, selectedCategory, selectedSort]);

  // Count active high-urgency items
  const activeUrgentCount = useMemo(
    () => items.filter((i) => i.isUrgent && i.status !== 'resolved').length,
    [items]
  );

  // Count active reward items
  const activeRewardCount = useMemo(
    () => items.filter((i) => i.type === 'lost' && i.rewardAmount > 0 && i.status !== 'resolved').length,
    [items]
  );

  // Pagination calculation
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleResetFilters = () => {
    onSearchChange('');
    setSelectedType('');
    setSelectedCategory('');
    setSelectedSort('newest');
    setCurrentPage(1);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header flex-between flex-wrap gap-4">
        <div>
          <h1>Browse Items</h1>
          <p>Search through all lost and found reports on campus.</p>
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

      {/* Category Chips */}
      <div
        id="category-chips"
        className="chip-group mb-6"
        role="group"
        aria-label="Filter by category"
      >
        <button
          type="button"
          className={`chip ${selectedCategory === '' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('')}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            className={`chip ${selectedCategory === c.value ? 'active' : ''}`}
            onClick={() => setSelectedCategory(c.value)}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="filter-bar" role="search" aria-label="Search and filter">
        <div className="search-bar flex-1" style={{ minWidth: '220px' }}>
          <span className="search-bar__icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="search"
            id="browse-search"
            placeholder="Search by name, category, brand…"
            aria-label="Search items"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <select
          id="filter-type"
          className="form-control"
          style={{ width: 'auto', minWidth: '120px' }}
          aria-label="Filter by type"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="lost">🔴 Lost</option>
          <option value="found">🟢 Found</option>
          <option value="urgent">🚨 Urgent Only</option>
          <option value="reward">🎁 With Reward</option>
        </select>

        {/* Quick Urgent Only Filter Button */}
        <button
          type="button"
          className={`btn btn--sm ${selectedType === 'urgent' ? 'btn--danger' : 'btn--ghost'}`}
          style={{
            borderColor: selectedType === 'urgent' ? 'transparent' : 'rgba(239, 68, 68, 0.4)',
            color: selectedType === 'urgent' ? '#ffffff' : 'var(--clr-danger)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          onClick={() => setSelectedType((prev) => (prev === 'urgent' ? '' : 'urgent'))}
          aria-pressed={selectedType === 'urgent'}
          title="Toggle high-priority items only"
        >
          <span>🚨</span> Urgent ({activeUrgentCount})
        </button>

        {/* Quick Reward Only Filter Button */}
        <button
          type="button"
          className={`btn btn--sm ${selectedType === 'reward' ? 'btn--warning' : 'btn--ghost'}`}
          style={{
            borderColor: selectedType === 'reward' ? 'transparent' : 'rgba(245, 158, 11, 0.4)',
            background: selectedType === 'reward' ? '#f59e0b' : 'transparent',
            color: selectedType === 'reward' ? '#ffffff' : '#b45309',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          onClick={() => setSelectedType((prev) => (prev === 'reward' ? '' : 'reward'))}
          aria-pressed={selectedType === 'reward'}
          title="Toggle items offering a return reward"
        >
          <span>🎁</span> Rewards ({activeRewardCount})
        </button>

        <select
          id="filter-category"
          className="form-control"
          style={{ width: 'auto', minWidth: '140px' }}
          aria-label="Filter by category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>

        <select
          id="filter-sort"
          className="form-control"
          style={{ width: 'auto', minWidth: '130px' }}
          aria-label="Sort items"
          value={selectedSort}
          onChange={(e) => setSelectedSort(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name-az">Name A–Z</option>
          <option value="name-za">Name Z–A</option>
        </select>

        <button
          id="filter-reset"
          className="btn btn--ghost btn--sm"
          aria-label="Reset all filters"
          onClick={handleResetFilters}
        >
          Reset
        </button>
      </div>

      {/* Results Info */}
      <div className="flex-between mb-4 flex-wrap gap-2">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <p id="browse-info" style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-secondary)', margin: 0 }} aria-live="polite">
            Showing {paginatedItems.length} of {totalItems} items
          </p>
          {activeUrgentCount > 0 && selectedType !== 'urgent' && (
            <span
              className="badge"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--clr-danger)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
              onClick={() => setSelectedType('urgent')}
              title="Click to view only urgent items"
            >
              🚨 {activeUrgentCount} High-Priority item{activeUrgentCount > 1 ? 's' : ''} pinned at top
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => onNavigate('matches')}
          >
            ⚡ View Smart Matches
          </button>
        </div>
      </div>

      {/* Items Grid */}
      <section aria-label="Items listing">
        {paginatedItems.length === 0 ? (
          <div className="empty-state animate-fade-in" style={{ padding: '48px 0', textAlign: 'center' }}>
            <div className="empty-state__illustration" aria-hidden="true" style={{ fontSize: '80px', marginBottom: '16px' }}>
              🔍
            </div>
            <h3 className="empty-state__title">No items found</h3>
            <p className="empty-state__message" style={{ color: 'var(--clr-text-secondary)', marginBottom: '16px' }}>
              Try adjusting your search or filters.
            </p>
            <button className="btn btn--secondary" onClick={handleResetFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div id="browse-grid" className="grid grid-auto" aria-live="polite">
            {paginatedItems.map((item) => (
              <ItemCard key={item.id} item={item} onClick={onViewDetail} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div id="pagination" className="pagination" role="navigation" aria-label="Pagination" style={{ marginTop: '32px' }}>
            <button
              className="pagination__btn"
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="Previous page"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => {
              const p = i + 1;
              const isCurrent = p === currentPage;
              const show = p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
              if (!show) return null;
              return (
                <button
                  key={p}
                  className={`pagination__btn ${isCurrent ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentPage(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  aria-label={`Page ${p}`}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {p}
                </button>
              );
            })}

            <button
              className="pagination__btn"
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

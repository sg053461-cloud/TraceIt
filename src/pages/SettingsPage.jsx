/**
 * TraceIt — Settings Page Component
 * SettingsPage.jsx
 *
 * Implements the system preferences screen from settings.html:
 * appearance toggles (Dark Mode, Compact View), matching threshold tuning,
 * data management (storage statistics, 10 demo items seeder, JSON export/import, factory reset),
 * keyboard shortcut cheat sheet, and project metadata.
 */

import React, { useState, useEffect, useRef } from 'react';
import ConfirmModal from '../components/ConfirmModal.jsx';
import {
  getSettings,
  saveSettings,
  getStorageStats,
  ensureDemoItems,
  exportData,
  importData,
  clearAllData,
} from '../services/storage.js';
import { downloadJSON, readFileAsJSON } from '../services/utils.js';

export default function SettingsPage({
  theme,
  onToggleTheme,
  showToast,
  onDataChanged,
}) {
  const [settings, setSettingsState] = useState(() => getSettings());
  const [stats, setStats] = useState(() => getStorageStats());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const importFileInputRef = useRef(null);

  useEffect(() => {
    setStats(getStorageStats());
  }, []);

  const handleCompactToggle = (e) => {
    const isChecked = e.target.checked;
    saveSettings({ compactView: isChecked });
    setSettingsState((prev) => ({ ...prev, compactView: isChecked }));
    if (showToast) {
      showToast({ type: 'info', message: `Compact view ${isChecked ? 'enabled' : 'disabled'}.` });
    }
  };

  const handleThresholdChange = (e) => {
    const val = parseInt(e.target.value) || 30;
    saveSettings({ matchThreshold: val });
    setSettingsState((prev) => ({ ...prev, matchThreshold: val }));
  };

  const handleLoadDemoItems = () => {
    ensureDemoItems(true);
    setStats(getStorageStats());
    if (onDataChanged) onDataChanged();
    if (showToast) {
      showToast({ type: 'success', message: '10 demo items (5 Lost, 5 Found) loaded successfully!' });
    }
  };

  const handleExportJSON = () => {
    const data = exportData();
    const dateStr = new Date().toISOString().split('T')[0];
    downloadJSON(data, `traceit-backup-${dateStr}.json`);
    if (showToast) {
      showToast({ type: 'success', message: 'Data exported successfully!' });
    }
  };

  const handleImportFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await readFileAsJSON(file);
      importData(data);
      setStats(getStorageStats());
      if (onDataChanged) onDataChanged();
      if (showToast) {
        showToast({ type: 'success', message: 'Data imported successfully!' });
      }
    } catch (err) {
      if (showToast) {
        showToast({ type: 'error', message: 'Import failed: ' + err.message });
      }
    }
    e.target.value = '';
  };

  const handleConfirmClearAll = () => {
    clearAllData();
    setStats(getStorageStats());
    setShowClearConfirm(false);
    if (onDataChanged) onDataChanged();
    if (showToast) {
      showToast({ type: 'info', message: 'All application data has been cleared.' });
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '860px' }}>
      <header className="page-header">
        <h1>Settings</h1>
        <p>Customize your TraceIt experience and manage your data.</p>
      </header>

      {/* ── Appearance ── */}
      <section className="settings-section" aria-labelledby="appearance-title">
        <div className="settings-section__header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--clr-primary)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <h2 className="settings-section__title" id="appearance-title">Appearance</h2>
        </div>
        <div className="settings-section__body">
          <div className="toggle-switch">
            <div className="toggle-switch__info">
              <div className="toggle-switch__label">Dark Mode</div>
              <div className="toggle-switch__desc">
                Switch between light and dark themes. Preference is saved automatically.
              </div>
            </div>
            <label className="switch" aria-label="Toggle dark mode">
              <input
                type="checkbox"
                id="setting-dark-mode"
                role="switch"
                checked={theme === 'dark'}
                onChange={onToggleTheme}
              />
              <span className="switch__slider" />
            </label>
          </div>

          <div className="toggle-switch">
            <div className="toggle-switch__info">
              <div className="toggle-switch__label">Compact View</div>
              <div className="toggle-switch__desc">
                Show more items by reducing card padding. Useful on smaller screens.
              </div>
            </div>
            <label className="switch" aria-label="Toggle compact view">
              <input
                type="checkbox"
                id="setting-compact"
                role="switch"
                checked={Boolean(settings.compactView)}
                onChange={handleCompactToggle}
              />
              <span className="switch__slider" />
            </label>
          </div>
        </div>
      </section>

      {/* ── Matching ── */}
      <section className="settings-section" aria-labelledby="matching-title">
        <div className="settings-section__header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--clr-primary)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M9 12l2 2 4-4" />
            <path d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z" />
          </svg>
          <h2 className="settings-section__title" id="matching-title">Smart Matching</h2>
        </div>
        <div className="settings-section__body">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="setting-threshold">Minimum Match Score (%)</label>
            <input
              type="number"
              id="setting-threshold"
              className="form-control"
              min="10"
              max="80"
              step="5"
              style={{ maxWidth: '160px' }}
              value={settings.matchThreshold || 30}
              onChange={handleThresholdChange}
              aria-describedby="threshold-hint"
            />
            <p className="form-hint" id="threshold-hint">
              Pairs scoring below this value won't be shown in the Matches page. Lower = more results, Higher = more precise.
            </p>
          </div>
        </div>
      </section>

      {/* ── Data Management ── */}
      <section className="settings-section" aria-labelledby="data-title">
        <div className="settings-section__header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--clr-primary)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12" />
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
          </svg>
          <h2 className="settings-section__title" id="data-title">Data Management</h2>
        </div>
        <div className="settings-section__body">
          {/* Storage Info */}
          <div className="card" style={{ background: 'var(--clr-bg)' }} role="status" aria-label="Storage information">
            <div id="storage-info" style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-secondary)' }}>
              <p style={{ margin: 0 }}>
                <strong>{stats.lostCount}</strong> lost items · <strong>{stats.foundCount}</strong> found items · <strong>{stats.resolved}</strong> resolved
              </p>
            </div>
          </div>

          {/* Demo Items */}
          <div className="toggle-switch" style={{ cursor: 'default', borderColor: 'rgba(var(--clr-primary-rgb),0.25)', background: 'rgba(var(--clr-primary-rgb),0.03)' }}>
            <div className="toggle-switch__info">
              <div className="toggle-switch__label" style={{ color: 'var(--clr-primary)' }}>Load Demo Items</div>
              <div className="toggle-switch__desc">
                Populate 10 realistic lost &amp; found demo item cards (5 Lost, 5 Found) with pre-configured smart matches.
              </div>
            </div>
            <button
              className="btn btn--secondary btn--sm"
              id="btn-demo-load"
              onClick={handleLoadDemoItems}
              aria-label="Load demo items"
            >
              ✨ Load Demo Items
            </button>
          </div>

          {/* Export */}
          <div className="toggle-switch" style={{ cursor: 'default' }}>
            <div className="toggle-switch__info">
              <div className="toggle-switch__label">Export Data</div>
              <div className="toggle-switch__desc">
                Download all lost items, found items, and settings as a JSON file for backup.
              </div>
            </div>
            <button
              className="btn btn--secondary btn--sm"
              id="btn-export"
              onClick={handleExportJSON}
              aria-label="Export all data to JSON"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ marginRight: '6px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Export JSON
            </button>
          </div>

          {/* Import */}
          <div className="toggle-switch" style={{ cursor: 'default' }}>
            <div className="toggle-switch__info">
              <div className="toggle-switch__label">Import Data</div>
              <div className="toggle-switch__desc">
                Restore from a previously exported TraceIt JSON file. This merges with existing data.
              </div>
            </div>
            <button
              className="btn btn--ghost btn--sm"
              id="btn-import"
              onClick={() => importFileInputRef.current?.click()}
              aria-label="Import data from JSON file"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ marginRight: '6px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Import JSON
            </button>
            <input
              type="file"
              ref={importFileInputRef}
              id="import-file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImportFileSelect}
              aria-label="Select JSON file to import"
            />
          </div>

          {/* Clear Data */}
          <div className="toggle-switch" style={{ cursor: 'default', borderColor: 'rgba(239,68,68,0.25)', background: 'var(--clr-danger-bg)' }}>
            <div className="toggle-switch__info">
              <div className="toggle-switch__label" style={{ color: 'var(--clr-danger)' }}>Clear All Data</div>
              <div className="toggle-switch__desc">
                Permanently delete all items, settings, and history from this browser. This cannot be undone.
              </div>
            </div>
            <button
              className="btn btn--danger btn--sm"
              id="btn-clear"
              onClick={() => setShowClearConfirm(true)}
              aria-label="Clear all application data"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ marginRight: '6px' }}>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              Clear All
            </button>
          </div>
        </div>
      </section>

      {/* ── Keyboard Shortcuts ── */}
      <section className="settings-section" aria-labelledby="shortcuts-title">
        <div className="settings-section__header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--clr-primary)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
          </svg>
          <h2 className="settings-section__title" id="shortcuts-title">Keyboard Shortcuts</h2>
        </div>
        <div className="settings-section__body" style={{ padding: 0 }}>
          <table className="shortcut-table" aria-label="Available keyboard shortcuts">
            <thead>
              <tr>
                <th scope="col">Shortcut</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><kbd>/</kbd></td><td>Focus global search bar</td></tr>
              <tr><td><kbd>Alt</kbd> + <kbd>D</kbd></td><td>Go to Dashboard</td></tr>
              <tr><td><kbd>Alt</kbd> + <kbd>L</kbd></td><td>Report Lost Item</td></tr>
              <tr><td><kbd>Alt</kbd> + <kbd>F</kbd></td><td>Report Found Item</td></tr>
              <tr><td><kbd>Alt</kbd> + <kbd>B</kbd></td><td>Browse Items</td></tr>
              <tr><td><kbd>Alt</kbd> + <kbd>M</kbd></td><td>Smart Matches</td></tr>
              <tr><td><kbd>Alt</kbd> + <kbd>S</kbd></td><td>Settings</td></tr>
              <tr><td><kbd>Alt</kbd> + <kbd>T</kbd></td><td>Toggle Dark / Light Mode</td></tr>
              <tr><td><kbd>Escape</kbd></td><td>Close modal / sidebar</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── About ── */}
      <section className="settings-section" aria-labelledby="about-title">
        <div className="settings-section__header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--clr-primary)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <h2 className="settings-section__title" id="about-title">About TraceIt</h2>
        </div>
        <div className="settings-section__body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 'var(--space-3)' }}>
            <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--clr-bg)' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-tertiary)', margin: 0 }}>Version</p>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--clr-text-primary)', margin: '4px 0 0' }}>1.0.0 (React 19 + Vite 8)</p>
            </div>
            <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--clr-bg)' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-tertiary)', margin: 0 }}>Tech Stack</p>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--clr-text-primary)', margin: '4px 0 0' }}>React · JSX · Vite · CSS</p>
            </div>
            <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--clr-bg)' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-tertiary)', margin: 0 }}>Storage</p>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--clr-text-primary)', margin: '4px 0 0' }}>localStorage only</p>
            </div>
            <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--clr-bg)' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-tertiary)', margin: 0 }}>API Used</p>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--clr-text-primary)', margin: '4px 0 0' }}>Quotable (quotes)</p>
            </div>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-secondary)', marginTop: 'var(--space-4)', lineHeight: 1.5 }}>
            TraceIt is an intelligent Lost &amp; Found management system built specifically for educational campuses. Rebuilt in pure React using modular functional components and exact CSS preservation.
          </p>
        </div>
      </section>

      {/* Clear Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear All Data?"
        message="This will permanently delete all lost items, found items, and settings. This cannot be undone."
        confirmText="Yes, Clear Everything"
        dangerMode={true}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}

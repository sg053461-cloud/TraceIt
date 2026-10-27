/**
 * TraceIt — Root React Application Component
 * App.jsx
 *
 * Master shell and navigation coordinator for TraceIt.
 * Handles hash-based routing, authentication guards, theme management,
 * keyboard shortcut handlers, data refreshes, and global modal/toast dialogs.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Toast from './components/Toast.jsx';
import ItemDetailModal from './components/ItemDetailModal.jsx';
import MatchSuggestionModal from './components/MatchSuggestionModal.jsx';

import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import BrowsePage from './pages/BrowsePage.jsx';
import MatchesPage from './pages/MatchesPage.jsx';
import ReportLostPage from './pages/ReportLostPage.jsx';
import ReportFoundPage from './pages/ReportFoundPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';

import {
  getLostItems,
  getFoundItems,
  updateLostItem,
  updateFoundItem,
  deleteLostItem,
  deleteFoundItem,
  getTheme,
  setTheme,
  ensureDemoItems,
  addItemTimelineEvent,
} from './services/storage.js';
import { getAllMatches } from './services/matching.js';

// Ensure default campus items are seeded into localStorage on first load
ensureDemoItems();

/**
 * Main application content component with full routing and state controls.
 */
function MainApp() {
  const { user, isAuthenticated } = useAuth();

  // Helper to extract the active route from the URL hash
  const parseHashRoute = () => {
    const raw = window.location.hash.replace('#/', '').replace('#', '').trim();
    const validAppRoutes = ['landing', 'login', 'dashboard', 'browse', 'matches', 'report-lost', 'report-found', 'settings', 'analytics'];
    if (!raw || raw === '') return 'landing';
    return validAppRoutes.includes(raw) ? raw : 'landing';
  };

  const [activePage, setActivePage] = useState(parseHashRoute);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setThemeState] = useState(() => getTheme() || 'light');
  const [itemsVersion, setItemsVersion] = useState(0);

  // Global Dialog States
  const [selectedItem, setSelectedItem] = useState(null);
  const [matchSuggestionData, setMatchSuggestionData] = useState(null);
  const [toast, setToast] = useState(null);
  const [redirectMessage, setRedirectMessage] = useState('');

  const showToast = useCallback((toastData) => {
    setToast(toastData);
  }, []);

  // Synchronize CSS custom property tokens and HTML attributes on theme change
  useEffect(() => {
    setTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Synchronize browser history / URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const route = parseHashRoute();
      setActivePage(route);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Safe navigation function
  const navigateTo = (page) => {
    setActivePage(page);
    window.location.hash = page === 'landing' ? '#/' : `#/${page}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global Keyboard Shortcuts (Alt+D, Alt+L, Alt+F, Alt+B, Alt+M, Alt+S, Alt+T, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape closes open modals or mobile sidebar
      if (e.key === 'Escape') {
        if (selectedItem) setSelectedItem(null);
        if (matchSuggestionData) setMatchSuggestionData(null);
        if (sidebarOpen) setSidebarOpen(false);
        return;
      }

      // Alt + key shortcuts matching the original project
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        const routes = {
          d: 'dashboard',
          l: 'report-lost',
          f: 'report-found',
          b: 'browse',
          m: 'matches',
          s: 'settings',
          a: 'analytics',
        };

        if (key === 't') {
          e.preventDefault();
          toggleTheme();
        } else if (routes[key]) {
          e.preventDefault();
          navigateTo(routes[key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, matchSuggestionData, sidebarOpen]);

  // Synchronize storage updates across tabs
  useEffect(() => {
    const handleStorage = () => refreshItems();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Load lost and found collections reactively
  const lostItems = useMemo(() => getLostItems(), [itemsVersion, activePage]);
  const foundItems = useMemo(() => getFoundItems(), [itemsVersion, activePage]);

  // Combine items for the browse catalog (sorted newest first)
  const allItems = useMemo(() => {
    const lost = lostItems.map((i) => ({ ...i, type: 'lost' }));
    const found = foundItems.map((i) => ({ ...i, type: 'found' }));
    return [...lost, ...found].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [lostItems, foundItems]);

  const totalItemsCount = allItems.length;

  const matchesCount = useMemo(() => {
    const matches = getAllMatches(lostItems, foundItems, 20);
    return matches.length;
  }, [lostItems, foundItems]);

  const refreshItems = () => {
    setItemsVersion((v) => v + 1);
  };

  // Item status toggle (Resolved / Open)
  const handleToggleStatus = (item) => {
    const newStatus = item.status === 'resolved' ? 'active' : 'resolved';
    const isResolved = newStatus === 'resolved';

    const updatedTimeline = addItemTimelineEvent(item.id, item.type, {
      title: isResolved ? 'Marked Resolved ✅' : 'Report Reopened 🔄',
      description: isResolved
        ? 'Item safely returned to rightful owner. Case closed in campus registry.'
        : 'Report reopened for ongoing campus search & matching.',
      icon: isResolved ? '✅' : '🔄',
    });

    if (item.type === 'lost') {
      updateLostItem(item.id, { status: newStatus, timeline: updatedTimeline });
    } else {
      updateFoundItem(item.id, { status: newStatus, timeline: updatedTimeline });
    }
    refreshItems();
    setSelectedItem((prev) => (prev ? { ...prev, status: newStatus, timeline: updatedTimeline } : null));
    showToast({
      type: 'success',
      message: `Item marked as ${newStatus}. Journey timeline updated!`,
    });
  };

  // Item deletion
  const handleDeleteItem = (item) => {
    if (item.type === 'lost') {
      deleteLostItem(item.id);
    } else {
      deleteFoundItem(item.id);
    }
    refreshItems();
    setSelectedItem(null);
    showToast({
      type: 'info',
      message: 'Item has been deleted.',
    });
  };

  // ── ROUTE 1: Public Landing Page ──────────────────────────────
  if (activePage === 'landing') {
    return (
      <>
        <LandingPage
          onNavigate={(targetPage) => {
            if (targetPage === 'login' || targetPage === 'landing') {
              navigateTo(targetPage);
            } else if (!isAuthenticated) {
              setRedirectMessage('Please log in to access this section.');
              navigateTo('login');
            } else {
              navigateTo(targetPage);
            }
          }}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  // ── ROUTE 2: Authentication Page ──────────────────────────────
  if (activePage === 'login') {
    return (
      <>
        <LoginPage
          onLoginSuccess={() => {
            setRedirectMessage('');
            navigateTo('dashboard');
          }}
          onNavigate={navigateTo}
          theme={theme}
          onToggleTheme={toggleTheme}
          redirectMessage={redirectMessage}
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  // ── ROUTE PROTECTION ──────────────────────────────────────────
  // If user is not authenticated and attempts to view protected routes
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          onLoginSuccess={() => {
            setRedirectMessage('');
            navigateTo(activePage);
          }}
          onNavigate={navigateTo}
          theme={theme}
          onToggleTheme={toggleTheme}
          redirectMessage="Please log in to continue."
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  // ── ROUTE 3: Authenticated Application Chrome (Navbar + Sidebar + View) ─
  return (
    <>
      <Navbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onNavigate={navigateTo}
        theme={theme}
        onToggleTheme={toggleTheme}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (activePage !== 'browse') {
            navigateTo('browse');
          }
        }}
        isSidebarOpen={sidebarOpen}
      />

      <div className="app-wrapper">
        <Sidebar
          activePage={activePage}
          onNavigate={navigateTo}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          totalItemsCount={totalItemsCount}
          matchesCount={matchesCount}
        />

        <main className="main-content with-sidebar" id="main-content">
          {activePage === 'dashboard' && (
            <DashboardPage
              onNavigate={navigateTo}
              onViewDetail={(item) => setSelectedItem(item)}
              itemsVersion={itemsVersion}
              matchesCount={matchesCount}
            />
          )}

          {activePage === 'browse' && (
            <BrowsePage
              items={allItems}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onViewDetail={(item) => setSelectedItem(item)}
              onNavigate={navigateTo}
            />
          )}

          {activePage === 'matches' && (
            <MatchesPage
              lostItems={lostItems}
              foundItems={foundItems}
              onNavigate={navigateTo}
              onVerifyFoundItem={(item) => setSelectedItem(item)}
            />
          )}

          {activePage === 'report-lost' && (
            <ReportLostPage
              onCreated={refreshItems}
              onNavigate={navigateTo}
              showToast={showToast}
              onShowMatchSuggestions={(data) => setMatchSuggestionData(data)}
            />
          )}

          {activePage === 'report-found' && (
            <ReportFoundPage
              onCreated={refreshItems}
              onNavigate={navigateTo}
              showToast={showToast}
              onShowMatchSuggestions={(data) => setMatchSuggestionData(data)}
            />
          )}

          {activePage === 'analytics' && (
            <AnalyticsPage
              onNavigate={navigateTo}
              onViewDetail={(item) => setSelectedItem(item)}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              theme={theme}
              onToggleTheme={toggleTheme}
              showToast={showToast}
              onDataChanged={refreshItems}
            />
          )}
        </main>
      </div>

      {/* Global Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteItem}
          onNavigate={navigateTo}
          showToast={showToast}
        />
      )}

      {/* Global Match Suggestion Modal */}
      {matchSuggestionData && (
        <MatchSuggestionModal
          data={matchSuggestionData}
          onClose={() => setMatchSuggestionData(null)}
          onVerifyFoundItem={(foundItem) => setSelectedItem(foundItem)}
          onNavigate={navigateTo}
        />
      )}

      {/* Global Toast Alert */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

/**
 * Root Application Entry wrapped with AuthProvider.
 */
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

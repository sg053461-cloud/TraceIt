/**
 * TraceIt — Landing Page Component
 * LandingPage.jsx
 *
 * Reproduces the original landing page (index.html) with complete fidelity:
 * navigation bar with auth status, hero section with live counters, feature cards,
 * interactive 4-step workflow, student testimonials, accordion FAQ, and call-to-action.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserInitials } from '../services/auth.js';
import { getStorageStats, getLostItems, getFoundItems } from '../services/storage.js';
import { getAllMatches } from '../services/matching.js';

export default function LandingPage({
  onNavigate,
  theme,
  onToggleTheme,
}) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ lostCount: 0, foundCount: 0, matchesCount: 0 });
  const [openFaq, setOpenFaq] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Load live statistics
  useEffect(() => {
    const s = getStorageStats();
    const lost = getLostItems();
    const found = getFoundItems();
    const matches = getAllMatches(lost, found, 20);
    setStats({
      lostCount: s.lostCount,
      foundCount: s.foundCount,
      matchesCount: matches.length,
    });
  }, []);

  // Scroll listener for the scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const faqItems = [
    {
      q: 'Is TraceIt free to use?',
      a: 'Yes, TraceIt is completely free. There are no accounts, no subscriptions, and no ads. Everything runs in your browser using localStorage.',
    },
    {
      q: 'Where is my data stored?',
      a: "All data is stored in your browser's localStorage. Nothing is sent to any server. This means data is private to your device, but you can export/import it as JSON for backup or sharing.",
    },
    {
      q: 'How does the Smart Matching work?',
      a: 'The matching engine is pure JavaScript. It scores each (lost, found) pair across category (+30), brand (+25), location (+20), color (+15), description keywords (+10), and name word overlap (+5). Scores above 20% are shown as matches.',
    },
    {
      q: 'Can I upload a photo of the item?',
      a: 'Yes! You can upload an image (max 2MB) when reporting an item. You can also drag and drop the file. The image is stored as base64 in localStorage and shown on the item card and detail view.',
    },
    {
      q: 'Is there a mobile version?',
      a: 'TraceIt is fully responsive and works on all screen sizes — from mobile phones to wide desktop monitors. The sidebar collapses on mobile with a hamburger menu.',
    },
    {
      q: 'What keyboard shortcuts are available?',
      a: 'Press / to focus the search bar. Use Alt+D for Dashboard, Alt+L for Report Lost, Alt+F for Report Found, Alt+B for Browse, Alt+M for Matches, Alt+S for Settings, and Alt+T to toggle the theme.',
    },
  ];

  return (
    <div>
      {/* ── Navigation ────────────────────────────────────── */}
      <header>
        <nav className="landing-nav" aria-label="Main navigation">
          <a
            href="#/"
            className="navbar__brand"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label="TraceIt Home"
          >
            <div className="navbar__logo" aria-hidden="true">
              <img src="/images/logo-icon.png" alt="TraceIt" className="navbar__logo-img" width="36" height="36" />
            </div>
            <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>
              Trace<span className="gradient-text">It</span>
            </span>
          </a>

          <div className="landing-nav__links">
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>
              Features
            </a>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>
              How It Works
            </a>
            <a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}>
              Testimonials
            </a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>
              FAQ
            </a>
          </div>

          <div id="landing-nav-actions" style={{ display: 'flex', gap: 'var(--space-3)', marginLeft: 'auto', alignItems: 'center' }}>
            <button
              id="landing-theme"
              onClick={onToggleTheme}
              aria-label="Toggle dark mode"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--clr-text-secondary)',
                border: '1px solid var(--clr-border)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: user.avatarBg || '#2563EB',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                    title={`${user.name} (${user.role})`}
                  >
                    {getUserInitials(user.name)}
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--clr-text-primary)' }}>
                    {user.name.split(' ')[0]}
                  </span>
                </div>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => onNavigate('dashboard')}
                >
                  Dashboard
                </button>
                <button
                  className="navbar__icon-btn"
                  onClick={logout}
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => onNavigate('login')}
                >
                  Sign In
                </button>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => onNavigate('dashboard')}
                >
                  Open App
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main id="main-content">
        {/* ── Hero ───────────────────────────────────────── */}
        <section className="hero" id="hero" aria-label="Hero section">
          <div className="hero-bg-blob hero-bg-blob--1" aria-hidden="true" />
          <div className="hero-bg-blob hero-bg-blob--2" aria-hidden="true" />

          <div className="hero__inner">
            <div className="hero__content animate-slide-up">
              <div className="hero__badge">
                <span>✨</span> Smart Lost &amp; Found for Campuses
              </div>
              <h1 className="hero__title">
                Lost Something?<br />
                <span className="gradient-text">TraceIt Finds It.</span>
              </h1>
              <p className="hero__subtitle">
                A centralized platform where students report lost and found items.
                Our smart matching engine connects owners with finders — automatically.
              </p>
              <div className="hero__cta">
                <button
                  className="btn btn--primary btn--lg"
                  onClick={() => onNavigate('report-lost')}
                >
                  Report Lost Item
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: '8px' }}>
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
                <button
                  className="btn btn--ghost btn--lg"
                  onClick={() => onNavigate('browse')}
                >
                  Browse Items
                </button>
              </div>

              <p className="hero__stats-label">Live Campus Stats</p>
              <div className="hero__stats">
                <div>
                  <div className="hero__stat-num" id="hero-stat-lost">{stats.lostCount}</div>
                  <div className="hero__stat-label">Items Reported Lost</div>
                </div>
                <div>
                  <div className="hero__stat-num" id="hero-stat-found">{stats.foundCount}</div>
                  <div className="hero__stat-label">Items Found</div>
                </div>
                <div>
                  <div className="hero__stat-num" id="hero-stat-match">{stats.matchesCount}</div>
                  <div className="hero__stat-label">Smart Matches</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ───────────────────────────────── */}
        <div className="stats-bar" aria-label="Platform statistics">
          <div className="stats-bar__inner">
            <div>
              <div className="stats-bar__num">100%</div>
              <div className="stats-bar__label">Free to Use</div>
            </div>
            <div>
              <div className="stats-bar__num">24/7</div>
              <div className="stats-bar__label">Always Available</div>
            </div>
            <div>
              <div className="stats-bar__num">&lt;60s</div>
              <div className="stats-bar__label">To Report an Item</div>
            </div>
            <div>
              <div className="stats-bar__num">AI-Free</div>
              <div className="stats-bar__label">Smart JS Matching</div>
            </div>
          </div>
        </div>

        {/* ── Features ───────────────────────────────── */}
        <section id="features" className="padded" aria-labelledby="features-title">
          <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '0 var(--space-8)' }}>
            <header className="section-header">
              <p className="section-label">✦ Features</p>
              <h2 className="section-title" id="features-title">
                Everything You Need to <span className="gradient-text">Recover</span> What's Yours
              </h2>
              <p className="section-subtitle">
                A complete lost-and-found system built specifically for busy campus environments.
              </p>
            </header>

            <div className="features-grid">
              <article className="feature-card reveal visible" aria-label="Report Items feature">
                <div className="feature-card__icon" style={{ background: 'rgba(108,99,255,0.10)' }} aria-hidden="true">
                  📝
                </div>
                <h3 className="feature-card__title">Quick Reporting</h3>
                <p className="feature-card__desc">
                  Report a lost or found item in under 60 seconds. Upload a photo, describe it, and you're done.
                </p>
              </article>

              <article className="feature-card reveal visible delay-1" aria-label="Smart Matching feature">
                <div className="feature-card__icon" style={{ background: 'rgba(255,101,132,0.10)' }} aria-hidden="true">
                  🧠
                </div>
                <h3 className="feature-card__title">Smart Matching</h3>
                <p className="feature-card__desc">
                  Our JS-powered matching engine scores items across category, brand, color, location, and keywords — instantly.
                </p>
              </article>

              <article className="feature-card reveal visible delay-2" aria-label="False Claim Protection feature">
                <div className="feature-card__icon" style={{ background: 'rgba(59,130,246,0.10)' }} aria-hidden="true">
                  🛡️
                </div>
                <h3 className="feature-card__title">False Claim Protection</h3>
                <p className="feature-card__desc">
                  Found item photos and sensitive details remain locked until genuine owners answer verification challenge questions.
                </p>
              </article>

              <article className="feature-card reveal visible delay-3" aria-label="Real-time Search feature">
                <div className="feature-card__icon" style={{ background: 'rgba(16,185,129,0.10)' }} aria-hidden="true">
                  🔍
                </div>
                <h3 className="feature-card__title">Real-Time Search</h3>
                <p className="feature-card__desc">
                  Search and filter items by name, category, location, and date. Results update as you type.
                </p>
              </article>

              <article className="feature-card reveal visible delay-4" aria-label="Dark Mode feature">
                <div className="feature-card__icon" style={{ background: 'rgba(245,158,11,0.10)' }} aria-hidden="true">
                  🌙
                </div>
                <h3 className="feature-card__title">Dark Mode</h3>
                <p className="feature-card__desc">
                  Switch between light and dark themes. Your preference is saved and persists across sessions.
                </p>
              </article>

              <article className="feature-card reveal visible delay-5" aria-label="Data Export feature">
                <div className="feature-card__icon" style={{ background: 'rgba(239,68,68,0.10)' }} aria-hidden="true">
                  📤
                </div>
                <h3 className="feature-card__title">Import / Export</h3>
                <p className="feature-card__desc">
                  Export all your data as JSON for backup. Import it back anytime. Full data portability, no lock-in.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ── How It Works ────────────────────────────── */}
        <section id="how-it-works" className="padded" style={{ background: 'var(--clr-surface)' }} aria-labelledby="steps-title">
          <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '0 var(--space-8)' }}>
            <header className="section-header">
              <p className="section-label">⚡ How It Works</p>
              <h2 className="section-title" id="steps-title">
                Four Steps to <span className="gradient-text">Recover</span> Your Item
              </h2>
              <p className="section-subtitle">
                TraceIt makes the entire process simple, fast, and stress-free.
              </p>
            </header>

            <div className="steps-grid">
              <div className="step step-line reveal visible">
                <div className="step__number" aria-hidden="true">1</div>
                <h3 className="step__title">Report Your Item</h3>
                <p className="step__desc">
                  Fill in the details — name, category, color, location, and a photo. Takes under a minute.
                </p>
              </div>

              <div className="step step-line reveal visible delay-1">
                <div className="step__number" aria-hidden="true">2</div>
                <h3 className="step__title">Get Matched Instantly</h3>
                <p className="step__desc">
                  Our scoring engine automatically compares your report against all existing items and ranks the best matches.
                </p>
              </div>

              <div className="step step-line reveal visible delay-2">
                <div className="step__number" aria-hidden="true">3</div>
                <h3 className="step__title">Contact the Finder</h3>
                <p className="step__desc">
                  Each report includes contact info. Reach out directly to the person who found your item.
                </p>
              </div>

              <div className="step reveal visible delay-3">
                <div className="step__number" aria-hidden="true">4</div>
                <h3 className="step__title">Mark as Resolved</h3>
                <p className="step__desc">
                  Once recovered, mark the item as resolved to keep the platform clean and updated for others.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ────────────────────────────── */}
        <section id="testimonials" className="padded" aria-labelledby="testimonials-title">
          <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '0 var(--space-8)' }}>
            <header className="section-header">
              <p className="section-label">💬 Testimonials</p>
              <h2 className="section-title" id="testimonials-title">
                What <span className="gradient-text">Students</span> Say
              </h2>
              <p className="section-subtitle">
                Real stories from real people who recovered their belongings with TraceIt.
              </p>
            </header>

            <div className="testimonials-grid">
              <article className="testimonial-card reveal visible">
                <div className="testimonial-card__stars" aria-label="5 stars">★★★★★</div>
                <p className="testimonial-card__text">
                  "I lost my ID card before an exam. Someone found it and posted on TraceIt. I got it back within 2 hours. This platform is incredible!"
                </p>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar" aria-hidden="true">P</div>
                  <div>
                    <p className="testimonial-card__name">Priya Sharma</p>
                    <p className="testimonial-card__role">Computer Science, 3rd Year</p>
                  </div>
                </div>
              </article>

              <article className="testimonial-card reveal visible delay-1">
                <div className="testimonial-card__stars" aria-label="5 stars">★★★★★</div>
                <p className="testimonial-card__text">
                  "The smart matching feature is wild. I posted that I found a wallet, and it instantly suggested the matching lost report. 87% score — spot on!"
                </p>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar" aria-hidden="true">R</div>
                  <div>
                    <p className="testimonial-card__name">Rahul Verma</p>
                    <p className="testimonial-card__role">Electronics Engineering, 2nd Year</p>
                  </div>
                </div>
              </article>

              <article className="testimonial-card reveal visible delay-2">
                <div className="testimonial-card__stars" aria-label="4 stars">★★★★★</div>
                <p className="testimonial-card__text">
                  "My AirPods were lost in the cafeteria. A classmate found them and TraceIt connected us automatically. Zero effort on my end. Brilliant!"
                </p>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar" aria-hidden="true">A</div>
                  <div>
                    <p className="testimonial-card__name">Anika Patel</p>
                    <p className="testimonial-card__role">Business Administration, 4th Year</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────── */}
        <section id="faq" className="padded" style={{ background: 'var(--clr-surface)' }} aria-labelledby="faq-title">
          <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '0 var(--space-8)' }}>
            <header className="section-header">
              <p className="section-label">❓ FAQ</p>
              <h2 className="section-title" id="faq-title">
                Frequently Asked <span className="gradient-text">Questions</span>
              </h2>
            </header>

            <div className="faq-list" role="list">
              {faqItems.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`} role="listitem">
                    <button
                      className="faq-question"
                      aria-expanded={isOpen}
                      onClick={() => toggleFaq(idx)}
                    >
                      {item.q}
                      <span className="faq-icon" aria-hidden="true">+</span>
                    </button>
                    <div className={`faq-answer ${isOpen ? 'open' : ''}`} role="region">
                      <p>{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────── */}
        <section className="padded" aria-label="Call to action">
          <div className="cta-section">
            <div
              className="hero-bg-blob"
              style={{
                width: '300px',
                height: '300px',
                background: 'rgba(255,255,255,0.15)',
                top: '-50px',
                right: '-50px',
                animationDelay: '0s',
              }}
              aria-hidden="true"
            />
            <div
              className="hero-bg-blob"
              style={{
                width: '200px',
                height: '200px',
                background: 'rgba(255,255,255,0.10)',
                bottom: '-30px',
                left: '-30px',
                animationDelay: '-3s',
              }}
              aria-hidden="true"
            />
            <h2
              style={{
                fontSize: 'var(--text-4xl)',
                fontWeight: 'var(--fw-extrabold)',
                color: 'white',
                marginBottom: 'var(--space-4)',
                position: 'relative',
              }}
            >
              Lost Something Today?
            </h2>
            <p
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: 'var(--text-lg)',
                maxWidth: '480px',
                margin: '0 auto var(--space-8)',
                lineHeight: 'var(--lh-relaxed)',
                position: 'relative',
              }}
            >
              Join thousands of students who've already recovered their belongings through TraceIt.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-4)',
                justifyContent: 'center',
                flexWrap: 'wrap',
                position: 'relative',
              }}
            >
              <button
                className="btn btn--lg"
                style={{ background: 'white', color: 'var(--clr-primary)', fontWeight: 'var(--fw-bold)' }}
                onClick={() => onNavigate('report-lost')}
              >
                Report Lost Item
              </button>
              <button
                className="btn btn--lg"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '2px solid rgba(255,255,255,0.40)' }}
                onClick={() => onNavigate('report-found')}
              >
                Report Found Item
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer>
        <div className="footer-inner">
          <div className="footer-col">
            <a
              href="#/"
              className="navbar__brand"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}
            >
              <div className="navbar__logo" style={{ width: '32px', height: '32px' }} aria-hidden="true">
                <img src="/images/logo-icon.png" alt="TraceIt" className="navbar__logo-img" width="32" height="32" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 'var(--text-lg)' }}>
                Trace<span className="gradient-text">It</span>
              </span>
            </a>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-secondary)', maxWidth: '240px', lineHeight: 'var(--lh-relaxed)' }}>
              A centralized Lost &amp; Found platform for educational campuses. Built with ❤️ using Vanilla HTML, CSS, and JavaScript.
            </p>
          </div>

          <div className="footer-col">
            <p className="footer-col__title">App</p>
            <nav className="footer-col__links" aria-label="App links">
              <a href="#/dashboard" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>Dashboard</a>
              <a href="#/browse" onClick={(e) => { e.preventDefault(); onNavigate('browse'); }}>Browse Items</a>
              <a href="#/matches" onClick={(e) => { e.preventDefault(); onNavigate('matches'); }}>Smart Matches</a>
              <a href="#/settings" onClick={(e) => { e.preventDefault(); onNavigate('settings'); }}>Settings</a>
              <a href="#/login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }}>Sign In / Register</a>
            </nav>
          </div>

          <div className="footer-col">
            <p className="footer-col__title">Report</p>
            <nav className="footer-col__links" aria-label="Report links">
              <a href="#/report-lost" onClick={(e) => { e.preventDefault(); onNavigate('report-lost'); }}>Report Lost Item</a>
              <a href="#/report-found" onClick={(e) => { e.preventDefault(); onNavigate('report-found'); }}>Report Found Item</a>
            </nav>
          </div>

          <div className="footer-col">
            <p className="footer-col__title">Project</p>
            <nav className="footer-col__links" aria-label="Project links">
              <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
              <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>How It Works</a>
              <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>FAQ</a>
              <a href="#/login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }}>Campus Portal</a>
            </nav>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 TraceIt. Built for educational purposes.</p>
          <p>No backend · No frameworks · 100% client-side</p>
        </div>
      </footer>

      {/* Scroll-to-top button */}
      {showScrollTop && (
        <button
          id="scroll-to-top"
          className="visible"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}
    </div>
  );
}

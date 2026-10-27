/**
 * TraceIt — Report Found Page Component
 * ReportFoundPage.jsx
 *
 * Implements the found item reporting form from report-found.html:
 * presentation quick-fill presets, anti-fraud ownership verification questions builder,
 * drag-and-drop photo upload with client validation, and instant smart match suggestions.
 */

import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  CATEGORIES,
  COLORS,
  LOCATIONS,
  CUSTODY_AUTHORITIES,
  todayISO,
  generateId,
  readFileAsDataURL,
} from '../services/utils.js';
import { addFoundItem, getLostItems, updateFoundItem } from '../services/storage.js';
import { getMatchesForFound } from '../services/matching.js';

const FOUND_DEMO_PRESETS = [
  {
    name: 'MacBook Pro Laptop in Sleeve',
    category: 'electronics',
    color: 'Gray',
    colorCustom: '',
    location: 'Library',
    locationCustom: '',
    brand: 'Apple',
    description: 'Space Gray Apple MacBook laptop left on 2nd floor library study desk near window.',
    contactName: 'Sarah Chen (Library Circulation)',
    contactEmail: 'library.desk@campus.edu',
    contactPhone: '+91 98765 43211',
    questions: [
      { id: 'q_demo_1', question: 'What stickers or unique markings are on the laptop lid?', answer: 'GitHub Octocat and React logo stickers' },
      { id: 'q_demo_2', question: 'What specific cable or accessory was in the sleeve pocket?', answer: 'White braided USB-C charging cable' },
    ],
  },
  {
    name: 'Casio Scientific Calculator',
    category: 'electronics',
    color: 'Black',
    colorCustom: '',
    location: 'Turing Block',
    locationCustom: '',
    brand: 'Casio',
    description: 'Found black Casio scientific calculator on front row desk in Turing Block Room 302.',
    contactName: 'Pooja Nair (Lab Assistant)',
    contactEmail: 'pooja.n@campus.edu',
    contactPhone: '+91 98765 43214',
    questions: [
      { id: 'q_demo_3', question: 'What specific model number is printed on the top right?', answer: 'fx-991EX Classwiz' },
      { id: 'q_demo_4', question: 'What initials are written on the inside of the sliding cover?', answer: 'AS' },
    ],
  },
  {
    name: 'Sony Wireless Earbuds in Case',
    category: 'electronics',
    color: 'Black',
    colorCustom: '',
    location: 'Dice Lab',
    locationCustom: '',
    brand: 'Sony',
    description: 'Found black Sony wireless earbuds charging case under workstation #12 in Dice Lab.',
    contactName: 'Vikram Mehta (Dice Lab TA)',
    contactEmail: 'vikram.m@campus.edu',
    contactPhone: '+91 98765 43215',
    questions: [
      { id: 'q_demo_5', question: 'What color or type of protective sleeve covers the case?', answer: 'Red silicone protective sleeve' },
      { id: 'q_demo_6', question: 'What is the exact battery indicator LED behavior when opened?', answer: 'Orange blinking amber light' },
    ],
  },
  {
    name: 'Hydro Flask Insulated Sports Bottle',
    category: 'accessories',
    color: 'Blue',
    colorCustom: '',
    location: 'Sportorium',
    locationCustom: '',
    brand: 'Hydro Flask',
    description: 'Found cobalt blue metal sports water bottle left on lower bleachers in Sportorium.',
    contactName: 'Coach Rajesh Kumar',
    contactEmail: 'rajesh.k@campus.edu',
    contactPhone: '+91 98765 43216',
    questions: [
      { id: 'q_demo_7', question: 'What color is the silicone protective boot at the bottom?', answer: 'Black silicone boot base' },
      { id: 'q_demo_8', question: 'What type of cap or lid is attached?', answer: 'Wide mouth straw lid' },
    ],
  },
];

export default function ReportFoundPage({
  onCreated,
  onNavigate,
  showToast,
  onShowMatchSuggestions,
}) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [colorCustom, setColorCustom] = useState('');
  const [description, setDescription] = useState('');
  const [dateFound, setDateFound] = useState(todayISO());
  const [locationFound, setLocationFound] = useState('');
  const [locationFoundCustom, setLocationFoundCustom] = useState('');
  const [currentlyWith, setCurrentlyWith] = useState('');
  // Structured custody state
  const [custodyMode, setCustodyMode] = useState('with_me'); // 'with_me' | 'authority'
  const [custodyAuthority, setCustodyAuthority] = useState('');
  const [custodyRoom, setCustodyRoom] = useState('');
  const [imageData, setImageData] = useState(null);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [isUrgent, setIsUrgent] = useState(false);

  // Validation Errors
  const [errors, setErrors] = useState({});

  // Preset filler
  const handleApplyPreset = (index) => {
    const p = FOUND_DEMO_PRESETS[index];
    if (!p) return;
    setName(p.name);
    setCategory(p.category);
    setBrand(p.brand);
    setColor(p.color);
    setColorCustom(p.colorCustom || '');
    setDescription(p.description);
    setDateFound(todayISO());
    setLocationFound(p.location);
    setLocationFoundCustom(p.locationCustom || '');
    setCurrentlyWith('With me / Front desk');
    setCustomQuestions(p.questions ? [...p.questions] : []);
    setContactName(p.contactName);
    setContactEmail(p.contactEmail);
    setContactPhone(p.contactPhone);
    setErrors({});
    if (showToast) {
      showToast({ type: 'info', message: `Applied preset: ${p.name}` });
    }
  };

  const handleClearForm = () => {
    setName('');
    setCategory('');
    setBrand('');
    setColor('');
    setColorCustom('');
    setDescription('');
    setDateFound(todayISO());
    setLocationFound('');
    setLocationFoundCustom('');
    setCurrentlyWith('');
    setCustodyMode('with_me');
    setCustodyAuthority('');
    setCustodyRoom('');
    setImageData(null);
    setCustomQuestions([]);
    setContactName(user?.name || '');
    setContactEmail(user?.email || '');
    setContactPhone(user?.phone || '');
    setIsUrgent(false);
    setErrors({});
  };

  // Add a new custom question row
  const handleAddQuestion = () => {
    setCustomQuestions((prev) => [
      ...prev,
      { id: `custom_q_${Date.now()}_${prev.length}`, question: '', answer: '' },
    ]);
  };

  // Update a custom question row
  const handleUpdateQuestion = (id, field, value) => {
    setCustomQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  // Remove a custom question row
  const handleRemoveQuestion = (id) => {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // Image Upload Handlers
  const handleFileProcess = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (showToast) showToast({ type: 'error', message: 'Only image files (PNG, JPG, WEBP) are supported.' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      if (showToast) showToast({ type: 'error', message: 'Image must be under 2MB.' });
      return;
    }

    try {
      const dataUrl = await readFileAsDataURL(file);
      setImageData(dataUrl);
      if (showToast) showToast({ type: 'success', message: 'Image uploaded successfully!' });
    } catch {
      if (showToast) showToast({ type: 'error', message: 'Failed to process image file.' });
    }
  };

  // Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Item name is required.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Item name must be at least 2 characters.';
    }

    if (!category) {
      newErrors.category = 'Please select a category.';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required.';
    } else {
      const words = description.trim().split(/\s+/).filter(Boolean);
      if (words.length < 5) {
        newErrors.description = 'Please write at least 5 words describing what was found.';
      }
    }

    if (!dateFound) {
      newErrors.dateFound = 'Date found is required.';
    }

    if (!locationFound) {
      newErrors.locationFound = 'Please select a location.';
    } else if (locationFound === 'Other' && !locationFoundCustom.trim()) {
      newErrors.locationFoundCustom = 'Please specify the custom location.';
    }

    if (!contactName.trim()) {
      newErrors.contactName = 'Your name is required.';
    }

    if (!contactEmail.trim()) {
      newErrors.contactEmail = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      newErrors.contactEmail = 'Please enter a valid email address.';
    }

    if (!contactPhone.trim()) {
      newErrors.contactPhone = 'Phone number is required.';
    } else if (!/^[+]?[\d\s-]{7,15}$/.test(contactPhone.trim())) {
      newErrors.contactPhone = 'Please enter a valid phone number.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (showToast) showToast({ type: 'error', message: 'Please fix the errors in the form.' });
      return;
    }

    const effectiveColor = color === 'Other' ? (colorCustom.trim() || 'Other') : (color || '');
    const effectiveLocation = locationFound === 'Other' ? (locationFoundCustom.trim() || 'Other') : locationFound;

    // Filter valid custom questions
    const validQuestions = customQuestions.filter((q) => q.question.trim() && q.answer.trim());

    const newItem = {
      id: generateId('found'),
      type: 'found',
      name: name.trim(),
      category,
      brand: brand.trim(),
      color: effectiveColor,
      description: description.trim(),
      dateFound,
      locationFound: effectiveLocation,
      // Custody: derive a readable string + store structured fields
      currentlyWith: custodyMode === 'authority' && custodyAuthority
        ? [
            CUSTODY_AUTHORITIES.find((a) => a.value === custodyAuthority)?.label || custodyAuthority,
            custodyRoom.trim() ? `— ${custodyRoom.trim()}` : '',
          ].filter(Boolean).join(' ')
        : currentlyWith.trim() || 'With me',
      custodyMode,
      custodyAuthority: custodyMode === 'authority' ? custodyAuthority : '',
      custodyRoom: custodyMode === 'authority' ? custodyRoom.trim() : '',
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      image: imageData,
      verificationQuestions: validQuestions.length ? validQuestions : undefined,
      isUrgent: Boolean(isUrgent),
      status: 'active',
      timeline: [
        {
          id: `tl_${Date.now()}`,
          date: new Date().toISOString(),
          title: `Reported found by ${contactName.trim().split(' ')[0]}`,
          description: `Registered at ${effectiveLocation}. Verification challenge configured.`,
          icon: '📝',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    // Save to storage
    addFoundItem(newItem);
    if (onCreated) onCreated();

    // Check for matches immediately against lost reports
    const lostItems = getLostItems();
    const matches = getMatchesForFound(newItem, lostItems, 25);

    if (matches.length > 0) {
      const topMatch = matches[0];
      newItem.timeline.push({
        id: `tl_match_${Date.now()}`,
        date: new Date().toISOString(),
        title: `Match found (${topMatch.pct}% score)`,
        description: `Automated match detected with lost report: "${topMatch.lostItem?.name}".`,
        icon: '⚡',
      });
      updateFoundItem(newItem.id, { timeline: newItem.timeline });
    }

    if (onShowMatchSuggestions) {
      onShowMatchSuggestions({
        type: 'found',
        item: newItem,
        matches,
      });
    }

    if (matches.length > 0) {
      if (showToast) {
        showToast({
          type: 'success',
          message: `Found item reported! ${matches.length} potential match${matches.length > 1 ? 'es' : ''} detected!`,
          duration: 6000,
        });
      }
    } else {
      if (showToast) {
        showToast({
          type: 'success',
          message: `"${newItem.name}" reported as found! We'll look for a match.`,
          duration: 5000,
        });
      }
    }

    // Reset form
    handleClearForm();
  };

  return (
    <div className="page-container" style={{ maxWidth: '860px' }}>
      <header className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <span style={{ fontSize: '32px' }} aria-hidden="true">🟢</span>
          <h1>Report Found Item</h1>
        </div>
        <p>Found something on campus? Report it here. Our system will instantly look for a matching lost report.</p>
      </header>

      {/* Tip Banner */}
      <div
        className="card mb-6"
        style={{ background: 'var(--clr-success-bg)', borderColor: 'rgba(16,185,129,0.25)' }}
        role="note"
        aria-label="Tip"
      >
        <p style={{ color: 'var(--clr-success)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', margin: 0 }}>
          💡 <strong>Smart Matching Active:</strong> After you submit, our engine will immediately compare this item against all lost reports and show you the best matches!
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-label="Report found item form">
        {/* Presentation Demo Quick Fill Banner */}
        <div
          className="card mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08))',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
          }}
          role="region"
          aria-label="Presentation Demo Quick Fill"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>⚡</span>
              <div>
                <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-success)', display: 'block' }}>
                  Presentation Demo Mode (Pre-filled for Teachers)
                </strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)' }}>
                  Inputs &amp; Security Questions are auto-filled for instant testing.
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              style={{ fontSize: 'var(--text-xs)', padding: '4px 10px', borderRadius: 'var(--radius-md)' }}
              onClick={handleClearForm}
            >
              🔄 Clear Form
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              style={{ fontSize: 'var(--text-xs)', padding: '6px 12px', borderRadius: 'var(--radius-md)' }}
              onClick={() => handleApplyPreset(0)}
            >
              💻 MacBook Pro 14 (Matches Library)
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              style={{ fontSize: 'var(--text-xs)', padding: '6px 12px', borderRadius: 'var(--radius-md)' }}
              onClick={() => handleApplyPreset(1)}
            >
              🧮 Casio Calculator (Matches Turing Block)
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              style={{ fontSize: 'var(--text-xs)', padding: '6px 12px', borderRadius: 'var(--radius-md)' }}
              onClick={() => handleApplyPreset(2)}
            >
              🎧 Sony Earbuds (Matches Dice Lab)
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              style={{ fontSize: 'var(--text-xs)', padding: '6px 12px', borderRadius: 'var(--radius-md)' }}
              onClick={() => handleApplyPreset(3)}
            >
              🍶 Hydro Flask Bottle (Matches Sportorium)
            </button>
          </div>
        </div>

        {/* Item Information */}
        <div className="form-section">
          <h2 className="form-section__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            Item Information
          </h2>

          {/* High Urgency Priority Flag Toggle */}
          <div
            style={{
              background: isUrgent ? 'rgba(239, 68, 68, 0.08)' : 'var(--clr-bg)',
              border: `1.5px solid ${isUrgent ? 'var(--clr-danger)' : 'var(--clr-border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px',
              marginBottom: 'var(--space-4)',
              transition: 'all var(--dur-fast) ease',
            }}
          >
            <label
              htmlFor="found-is-urgent"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                margin: 0,
              }}
            >
              <input
                type="checkbox"
                id="found-is-urgent"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  marginTop: '2px',
                  accentColor: 'var(--clr-danger)',
                  cursor: 'pointer',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 'var(--text-sm)', color: isUrgent ? 'var(--clr-danger)' : 'var(--clr-text-primary)' }}>
                    🚨 Mark as High-Urgency Priority
                  </strong>
                  <span
                    className="badge"
                    style={{
                      background: isUrgent ? 'var(--clr-danger)' : 'rgba(239, 68, 68, 0.12)',
                      color: isUrgent ? '#fff' : 'var(--clr-danger)',
                      fontSize: '10px',
                      padding: '2px 6px',
                      fontWeight: 700,
                    }}
                  >
                    Priority Item
                  </span>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>
                  Check this for critical items (passport, vital medicine, exam admit card, room/bike keys, wallet/govt ID). Urgent reports display a red alert banner and are pinned to the top of campus feeds.
                </p>
              </div>
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="item-name">
                Item Name <span className="required" aria-label="required">*</span>
              </label>
              <input
                type="text"
                id="item-name"
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                placeholder="e.g. Blue Backpack"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                autoComplete="off"
              />
              {errors.name && <span className="form-error visible">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="category">
                Category <span className="required" aria-label="required">*</span>
              </label>
              <select
                id="category"
                className={`form-control ${errors.category ? 'is-invalid' : ''}`}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                }}
              >
                <option value="">Select category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
              {errors.category && <span className="form-error visible">{errors.category}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="brand">Brand / Make</label>
              <input
                type="text"
                id="brand"
                className="form-control"
                placeholder="e.g. Dell, Adidas"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="color">Color</label>
              <select
                id="color"
                className="form-control"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              >
                <option value="">Select color…</option>
                {COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div
                id="color-custom-wrap"
                className={`custom-input-wrap ${color === 'Other' ? 'is-visible' : ''}`}
              >
                <input
                  type="text"
                  id="color-custom"
                  className="form-control"
                  placeholder="Enter custom color (e.g. Rose Gold, Lavender)"
                  value={colorCustom}
                  onChange={(e) => setColorCustom(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Description <span className="required" aria-label="required">*</span>
            </label>
            <textarea
              id="description"
              className={`form-control ${errors.description ? 'is-invalid' : ''}`}
              rows={4}
              placeholder="Describe what you found — condition, contents (if bag/wallet), any identifiers…"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
            />
            {errors.description && <span className="form-error visible">{errors.description}</span>}
          </div>
        </div>

        {/* Found Details */}
        <div className="form-section">
          <h2 className="form-section__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            When &amp; Where Found
          </h2>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="date-found">
                Date Found <span className="required" aria-label="required">*</span>
              </label>
              <input
                type="date"
                id="date-found"
                max={todayISO()}
                className={`form-control ${errors.dateFound ? 'is-invalid' : ''}`}
                value={dateFound}
                onChange={(e) => {
                  setDateFound(e.target.value);
                  if (errors.dateFound) setErrors((prev) => ({ ...prev, dateFound: '' }));
                }}
              />
              {errors.dateFound && <span className="form-error visible">{errors.dateFound}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="location-found">
                Location Found <span className="required" aria-label="required">*</span>
              </label>
              <select
                id="location-found"
                className={`form-control ${errors.locationFound ? 'is-invalid' : ''}`}
                value={locationFound}
                onChange={(e) => {
                  setLocationFound(e.target.value);
                  if (errors.locationFound) setErrors((prev) => ({ ...prev, locationFound: '' }));
                }}
              >
                <option value="">Select location…</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <div
                id="location-found-custom-wrap"
                className={`custom-input-wrap ${locationFound === 'Other' ? 'is-visible' : ''}`}
              >
                <input
                  type="text"
                  id="location-found-custom"
                  className={`form-control ${errors.locationFoundCustom ? 'is-invalid' : ''}`}
                  placeholder="Enter custom location (e.g. Room 304, Basketball Court)"
                  value={locationFoundCustom}
                  onChange={(e) => {
                    setLocationFoundCustom(e.target.value);
                    if (errors.locationFoundCustom) setErrors((prev) => ({ ...prev, locationFoundCustom: '' }));
                  }}
                  autoComplete="off"
                />
                {errors.locationFoundCustom && <span className="form-error visible">{errors.locationFoundCustom}</span>}
              </div>
              {errors.locationFound && <span className="form-error visible">{errors.locationFound}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              📦 Where is this item right now?
              <span style={{ color: 'var(--clr-danger)', marginLeft: '4px' }}>*</span>
            </label>

            {/* Radio toggle: With me vs Handed to authority */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '12px',
                flexWrap: 'wrap',
              }}
            >
              {[
                { value: 'with_me', label: '🤝 I still have it with me', desc: 'You are personally holding the item' },
                { value: 'authority', label: '🏛️ I handed it to an authority', desc: 'Item is deposited at a campus office' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    flex: '1 1 200px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${custodyMode === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                    background: custodyMode === opt.value ? 'rgba(108,99,255,0.06)' : 'var(--clr-surface)',
                    cursor: 'pointer',
                    transition: 'border-color 0.18s, background 0.18s',
                  }}
                >
                  <input
                    type="radio"
                    name="custodyMode"
                    value={opt.value}
                    checked={custodyMode === opt.value}
                    onChange={() => setCustodyMode(opt.value)}
                    style={{ marginTop: '3px', accentColor: 'var(--clr-primary)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--clr-text-primary)' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--clr-text-tertiary)', marginTop: '2px' }}>
                      {opt.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* If "With me" — plain optional note */}
            {custodyMode === 'with_me' && (
              <div>
                <input
                  type="text"
                  id="currently-with"
                  className="form-control"
                  placeholder="Optional note, e.g. in my bag, at front desk"
                  value={currentlyWith}
                  onChange={(e) => setCurrentlyWith(e.target.value)}
                  autoComplete="off"
                />
                <p className="form-hint">The owner will know to contact you directly.</p>
              </div>
            )}

            {/* If "Handed to authority" — structured selector */}
            {custodyMode === 'authority' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label className="form-label" htmlFor="custody-authority" style={{ fontSize: '13px', marginBottom: '6px' }}>
                    Which authority?
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                      gap: '8px',
                    }}
                  >
                    {CUSTODY_AUTHORITIES.map((auth) => (
                      <label
                        key={auth.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '9px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${custodyAuthority === auth.value ? 'var(--clr-primary)' : 'var(--clr-border-light)'}`,
                          background: custodyAuthority === auth.value ? 'rgba(108,99,255,0.08)' : 'var(--clr-bg)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: custodyAuthority === auth.value ? 600 : 400,
                          color: 'var(--clr-text-primary)',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                      >
                        <input
                          type="radio"
                          name="custodyAuthority"
                          value={auth.value}
                          checked={custodyAuthority === auth.value}
                          onChange={() => setCustodyAuthority(auth.value)}
                          style={{ accentColor: 'var(--clr-primary)' }}
                        />
                        <span>{auth.icon}</span>
                        <span>{auth.label}</span>
                      </label>
                    ))}
                  </div>
                  {custodyAuthority && (
                    <p className="form-hint" style={{ marginTop: '6px' }}>
                      💡 {CUSTODY_AUTHORITIES.find((a) => a.value === custodyAuthority)?.hint}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label" htmlFor="custody-room" style={{ fontSize: '13px', marginBottom: '6px' }}>
                    Room / Desk / Counter <span style={{ fontWeight: 400, color: 'var(--clr-text-tertiary)' }}>(Optional but very helpful)</span>
                  </label>
                  <input
                    type="text"
                    id="custody-room"
                    className="form-control"
                    placeholder="e.g. Room 101, Ground Floor Counter, Block A Office"
                    value={custodyRoom}
                    onChange={(e) => setCustodyRoom(e.target.value)}
                    autoComplete="off"
                  />
                  <p className="form-hint">
                    The owner can walk directly there with their ID — no need to call anyone.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Upload */}
        <div className="form-section">
          <h2 className="form-section__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Item Photo <span style={{ fontWeight: 400, color: 'var(--clr-text-tertiary)', fontSize: 'var(--text-sm)' }}>(Recommended)</span>
          </h2>

          <div
            className="drop-zone"
            role="button"
            tabIndex={0}
            aria-label="Upload image area. Click or drag and drop an image file."
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) {
                handleFileProcess(e.dataTransfer.files[0]);
              }
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              id="found-image"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />
            <div className="drop-zone__icon" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
            </div>
            <p className="drop-zone__text">Upload a clear photo of the item</p>
            <p className="drop-zone__subtext">PNG, JPG, WEBP up to 2MB · Drag &amp; drop supported</p>
          </div>

          {imageData && (
            <div id="found-image-preview" className="mt-4" aria-live="polite">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={imageData}
                  alt="Preview"
                  style={{ maxHeight: '160px', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}
                />
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px' }}
                  onClick={() => setImageData(null)}
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Verification Questions */}
        <div className="form-section">
          <div className="flex-between flex-wrap gap-2 mb-2">
            <h2 className="form-section__title" style={{ marginBottom: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Ownership Verification Questions (Anti-Fraud Protection)
            </h2>
            <button
              type="button"
              id="btn-add-question"
              className="btn btn--secondary btn--sm"
              onClick={handleAddQuestion}
            >
              + Add Additional Question
            </button>
          </div>

          <p className="form-hint mb-3">
            Default questions about <strong>Brand</strong> and <strong>Color</strong> are automatically included to verify genuine ownership. You can add extra security questions on top (e.g. stickers, contents, scratches). Claimants must achieve at least 50% correct answers to unlock details.
          </p>

          {/* Default Questions Preview Box */}
          <div className="flex flex-col gap-2 mb-3">
            <div style={{ padding: '8px 12px', background: 'var(--clr-bg)', border: '1px solid var(--clr-border-light)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <div>
                <span className="badge badge--secondary" style={{ fontSize: '10px', marginRight: '6px' }}>Default Q1</span>
                <strong>Brand:</strong> What is the brand or manufacturer of this item?
              </div>
              <span style={{ color: 'var(--clr-text-tertiary)', fontStyle: 'italic', fontSize: '11px' }}>
                (auto from Brand)
              </span>
            </div>
            <div style={{ padding: '8px 12px', background: 'var(--clr-bg)', border: '1px solid var(--clr-border-light)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <div>
                <span className="badge badge--secondary" style={{ fontSize: '10px', marginRight: '6px' }}>Default Q2</span>
                <strong>Color:</strong> What is the primary color of this item?
              </div>
              <span style={{ color: 'var(--clr-text-tertiary)', fontStyle: 'italic', fontSize: '11px' }}>
                (auto from Color)
              </span>
            </div>
          </div>

          {/* Custom Questions List */}
          <div id="verification-questions-list" className="flex flex-col gap-3">
            {customQuestions.length === 0 ? (
              <p
                id="questions-empty-hint"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--clr-text-tertiary)',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '10px',
                  background: 'rgba(108,99,255,0.04)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed rgba(108,99,255,0.25)',
                }}
              >
                No additional custom questions added. Click <strong>"+ Add Additional Question"</strong> above to add more questions on top of Brand and Color.
              </p>
            ) : (
              customQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="verification-question-row"
                  style={{
                    padding: '12px',
                    background: 'var(--clr-surface)',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--clr-primary)' }}>
                      Custom Security Question #{idx + 1}
                    </span>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      style={{ padding: '2px 8px', fontSize: '11px' }}
                      onClick={() => handleRemoveQuestion(q.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Question (e.g. What sticker is on the back? What was inside?)"
                    value={q.question}
                    onChange={(e) => handleUpdateQuestion(q.id, 'question', e.target.value)}
                    style={{ fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Expected Answer (keywords for verification)"
                    value={q.answer}
                    onChange={(e) => handleUpdateQuestion(q.id, 'answer', e.target.value)}
                    style={{ fontSize: '13px' }}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h2 className="form-section__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Your Contact Details
          </h2>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="contact-name">
                Your Name <span className="required" aria-label="required">*</span>
              </label>
              <input
                type="text"
                id="contact-name"
                className={`form-control ${errors.contactName ? 'is-invalid' : ''}`}
                placeholder="Full name"
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value);
                  if (errors.contactName) setErrors((prev) => ({ ...prev, contactName: '' }));
                }}
                autoComplete="name"
              />
              {errors.contactName && <span className="form-error visible">{errors.contactName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contact-email">
                Email Address <span className="required" aria-label="required">*</span>
              </label>
              <input
                type="email"
                id="contact-email"
                className={`form-control ${errors.contactEmail ? 'is-invalid' : ''}`}
                placeholder="you@university.edu"
                value={contactEmail}
                onChange={(e) => {
                  setContactEmail(e.target.value);
                  if (errors.contactEmail) setErrors((prev) => ({ ...prev, contactEmail: '' }));
                }}
                autoComplete="email"
              />
              {errors.contactEmail && <span className="form-error visible">{errors.contactEmail}</span>}
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: '320px' }}>
            <label className="form-label" htmlFor="contact-phone">
              Phone Number <span className="required" aria-label="required">*</span>
            </label>
            <input
              type="tel"
              id="contact-phone"
              className={`form-control ${errors.contactPhone ? 'is-invalid' : ''}`}
              placeholder="+91 98765 43210"
              value={contactPhone}
              onChange={(e) => {
                setContactPhone(e.target.value);
                if (errors.contactPhone) setErrors((prev) => ({ ...prev, contactPhone: '' }));
              }}
              autoComplete="tel"
            />
            {errors.contactPhone && <span className="form-error visible">{errors.contactPhone}</span>}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 flex-wrap">
          <button type="submit" className="btn btn--primary btn--lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ marginRight: '8px' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Submit Found Report
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--lg"
            onClick={handleClearForm}
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
}

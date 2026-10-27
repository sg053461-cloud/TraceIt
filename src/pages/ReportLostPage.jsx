/**
 * TraceIt — Report Lost Page Component
 * ReportLostPage.jsx
 *
 * Implements the lost item reporting form from report-lost.html:
 * presentation quick-fill demo presets, client-side validation, custom color/location inputs,
 * drag-and-drop image upload (2MB limit, Base64 preview), and immediate smart match detection.
 */

import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  CATEGORIES,
  COLORS,
  LOCATIONS,
  todayISO,
  generateId,
  readFileAsDataURL,
} from '../services/utils.js';
import { addLostItem, getFoundItems, updateLostItem } from '../services/storage.js';
import { getMatchesForLost } from '../services/matching.js';

// Pre-configured presentation presets matching the original app.js
const LOST_DEMO_PRESETS = [
  {
    name: 'MacBook Pro Laptop in Sleeve',
    category: 'electronics',
    color: 'Gray',
    colorCustom: '',
    location: 'Library',
    locationCustom: '',
    brand: 'Apple',
    description: 'Space Gray Apple MacBook laptop left on 2nd floor library study desk with GitHub and React stickers.',
    contactName: 'Aman Sharma',
    contactEmail: 'aman.sharma@campus.edu',
    contactPhone: '+91 98765 43210',
    offerReward: true,
    rewardAmount: '200',
    rewardNote: 'Offering ₹200 reward for return.',
  },
  {
    name: 'Casio Scientific Calculator',
    category: 'electronics',
    color: 'Black',
    colorCustom: '',
    location: 'Turing Block',
    locationCustom: '',
    brand: 'Casio',
    description: 'Lost Casio fx-991EX Classwiz calculator on desk in Turing Block Room 302 with silver initials AS on sliding cover.',
    contactName: 'Aditya Sharma',
    contactEmail: 'aditya.s@campus.edu',
    contactPhone: '+91 98765 43217',
  },
  {
    name: 'Sony Wireless Earbuds in Case',
    category: 'electronics',
    color: 'Black',
    colorCustom: '',
    location: 'Dice Lab',
    locationCustom: '',
    brand: 'Sony',
    description: 'Lost black Sony wireless earbuds inside red silicone protective sleeve near workstation #12 in Dice Lab.',
    contactName: 'Rohan Verma',
    contactEmail: 'rohan.v@campus.edu',
    contactPhone: '+91 98765 43218',
  },
  {
    name: 'Hydro Flask Insulated Sports Bottle',
    category: 'accessories',
    color: 'Blue',
    colorCustom: '',
    location: 'Sportorium',
    locationCustom: '',
    brand: 'Hydro Flask',
    description: 'Cobalt blue insulated metal sports flask with rubber boot base, left near basketball bleachers in Sportorium.',
    contactName: 'Riya Patel',
    contactEmail: 'riya.p@campus.edu',
    contactPhone: '+91 98765 43212',
  },
  {
    name: 'Hostel Room Keys & Exam Admit Card',
    category: 'wallet',
    color: 'Black',
    colorCustom: '',
    location: 'Turing Block',
    locationCustom: '',
    brand: 'Campus Exam Cell',
    description: 'Urgent: Transparent pouch containing Semester End Exam Admit Card, student roll number slip, and hostel room 204 keys with brass keychain.',
    contactName: 'Aman Sharma',
    contactEmail: 'aman.sharma@campus.edu',
    contactPhone: '+91 98765 43210',
    isUrgent: true,
  },
];

export default function ReportLostPage({
  onCreated,
  onNavigate: _onNavigate,
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
  const [dateLost, setDateLost] = useState(todayISO());
  const [locationLost, setLocationLost] = useState('');
  const [locationLostCustom, setLocationLostCustom] = useState('');
  const [imageData, setImageData] = useState(null);
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [isUrgent, setIsUrgent] = useState(false);

  // 🎁 Reward / Bounty state
  const [offerReward, setOfferReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardNote, setRewardNote] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState({});

  // Preset filler
  const handleApplyPreset = (index) => {
    const p = LOST_DEMO_PRESETS[index];
    if (!p) return;
    setName(p.name);
    setCategory(p.category);
    setBrand(p.brand);
    setColor(p.color);
    setColorCustom(p.colorCustom || '');
    setDescription(p.description);
    setDateLost(todayISO());
    setLocationLost(p.location);
    setLocationLostCustom(p.locationCustom || '');
    setContactName(p.contactName);
    setContactEmail(p.contactEmail);
    setContactPhone(p.contactPhone);
    setIsUrgent(Boolean(p.isUrgent));
    setOfferReward(Boolean(p.offerReward));
    setRewardAmount(p.rewardAmount ? String(p.rewardAmount) : '');
    setRewardNote(p.rewardNote || '');
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
    setDateLost(todayISO());
    setLocationLost('');
    setLocationLostCustom('');
    setImageData(null);
    setContactName(user?.name || '');
    setContactEmail(user?.email || '');
    setContactPhone(user?.phone || '');
    setIsUrgent(false);
    setOfferReward(false);
    setRewardAmount('');
    setRewardNote('');
    setErrors({});
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

  // Form Submission & Validation
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
        newErrors.description = 'Please write at least 5 words describing the item.';
      }
    }

    if (!dateLost) {
      newErrors.dateLost = 'Date lost is required.';
    }

    if (!locationLost) {
      newErrors.locationLost = 'Please select a location.';
    } else if (locationLost === 'Other' && !locationLostCustom.trim()) {
      newErrors.locationLostCustom = 'Please specify the custom location.';
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
    const effectiveLocation = locationLost === 'Other' ? (locationLostCustom.trim() || 'Other') : locationLost;

    let finalRewardAmount = null;
    let finalRewardNote = '';
    if (offerReward && rewardAmount && Number(rewardAmount) > 0) {
      finalRewardAmount = Math.round(Number(rewardAmount));
      finalRewardNote = rewardNote.trim() || `Offering ₹${finalRewardAmount} reward for return.`;
    }

    const newItem = {
      id: generateId('lost'),
      type: 'lost',
      name: name.trim(),
      category,
      brand: brand.trim(),
      color: effectiveColor,
      description: description.trim(),
      dateLost,
      locationLost: effectiveLocation,
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      image: imageData,
      isUrgent: Boolean(isUrgent),
      rewardAmount: finalRewardAmount,
      rewardNote: finalRewardNote,
      status: 'active',
      timeline: [
        {
          id: `tl_${Date.now()}`,
          date: new Date().toISOString(),
          title: `Reported lost by ${contactName.trim().split(' ')[0]}`,
          description: `Registered at ${effectiveLocation}.${finalRewardAmount ? ` Declared honesty reward: ₹${finalRewardAmount}.` : ''} Anti-fraud security active.`,
          icon: '📝',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    // Save to storage
    addLostItem(newItem);
    if (onCreated) onCreated();

    // Check for smart matches immediately
    const foundItems = getFoundItems();
    const matches = getMatchesForLost(newItem, foundItems, 20);

    if (matches.length > 0) {
      const topMatch = matches[0];
      newItem.timeline.push({
        id: `tl_match_${Date.now()}`,
        date: new Date().toISOString(),
        title: `Match found (${topMatch.pct}% score)`,
        description: `Automated match detected with found report: "${topMatch.foundItem?.name}".`,
        icon: '⚡',
      });
      updateLostItem(newItem.id, { timeline: newItem.timeline });
    }

    // Show suggestion modal
    if (onShowMatchSuggestions) {
      onShowMatchSuggestions({
        type: 'lost',
        item: newItem,
        matches,
      });
    }

    if (matches.length > 0) {
      if (showToast) {
        showToast({
          type: 'success',
          message: `Lost report published! ${matches.length} potential smart match${matches.length > 1 ? 'es' : ''} detected!`,
          duration: 6000,
        });
      }
    } else {
      if (showToast) {
        showToast({
          type: 'success',
          message: `"${newItem.name}" reported as lost. We'll notify you of any matches!`,
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
          <span style={{ fontSize: '32px' }} aria-hidden="true">🔴</span>
          <h1>Report Lost Item</h1>
        </div>
        <p>Provide as much detail as possible to help our matching engine find your item faster.</p>
      </header>

      {/* Tip Banner */}
      <div
        className="card mb-6"
        style={{ background: 'var(--clr-success-bg)', borderColor: 'rgba(16,185,129,0.25)' }}
        role="note"
        aria-label="Tip"
      >
        <p style={{ color: 'var(--clr-success)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', margin: 0 }}>
          💡 <strong>Smart Matching Active:</strong> After you submit, our engine will immediately compare this item against all found reports and show you the best matches!
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-label="Report lost item form">
        {/* Presentation Demo Quick Fill Banner */}
        <div
          className="card mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(99,102,241,0.08))',
            border: '1px solid rgba(37,99,235,0.25)',
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
                <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-primary)', display: 'block' }}>
                  Presentation Demo Mode (Pre-filled for Teachers)
                </strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)' }}>
                  Inputs are auto-filled for instant testing. Click presets to switch.
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
              💻 MacBook Pro 14 (🎁 ₹200 Reward Demo)
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
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              style={{
                fontSize: 'var(--text-xs)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                borderColor: 'var(--clr-danger)',
                color: 'var(--clr-danger)',
                fontWeight: 600,
              }}
              onClick={() => handleApplyPreset(4)}
            >
              🚨 Exam Admit Card &amp; Keys (Urgent Demo)
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
              htmlFor="lost-is-urgent"
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
                id="lost-is-urgent"
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

          {/* 🎁 Honesty Reward / Bounty Tag Toggle */}
          <div
            style={{
              background: offerReward ? 'rgba(245, 158, 11, 0.08)' : 'var(--clr-bg)',
              border: `1.5px solid ${offerReward ? 'var(--clr-warning, #f59e0b)' : 'var(--clr-border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px',
              marginBottom: 'var(--space-4)',
              transition: 'all var(--dur-fast) ease',
            }}
          >
            <label
              htmlFor="lost-offer-reward"
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
                id="lost-offer-reward"
                checked={offerReward}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setOfferReward(checked);
                  if (checked && !rewardAmount) {
                    setRewardAmount('200');
                    if (!rewardNote) setRewardNote('Offering ₹200 reward for return.');
                  }
                }}
                style={{
                  width: '18px',
                  height: '18px',
                  marginTop: '2px',
                  accentColor: '#f59e0b',
                  cursor: 'pointer',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 'var(--text-sm)', color: offerReward ? '#b45309' : 'var(--clr-text-primary)' }}>
                    🎁 Offer Return Reward / Bounty
                  </strong>
                  <span
                    className="badge"
                    style={{
                      background: offerReward ? '#f59e0b' : 'rgba(245, 158, 11, 0.15)',
                      color: offerReward ? '#fff' : '#b45309',
                      fontSize: '10px',
                      padding: '2px 6px',
                      fontWeight: 700,
                    }}
                  >
                    Honesty System
                  </span>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>
                  Incentivise honest finders to report and return your item. Shown as an eye-catching badge on your item card. No upfront payment required — you pay the finder directly upon safe return.
                </p>
              </div>
            </label>

            {/* Expanded Reward Configuration */}
            {offerReward && (
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px dashed rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Quick Select Reward Amount
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['100', '200', '500', '1000'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className="btn btn--sm"
                        style={{
                          background: rewardAmount === amt ? '#f59e0b' : 'var(--clr-surface)',
                          color: rewardAmount === amt ? '#fff' : 'var(--clr-text-primary)',
                          border: `1px solid ${rewardAmount === amt ? '#f59e0b' : 'var(--clr-border)'}`,
                          fontWeight: 600,
                          fontSize: '12px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-md)',
                        }}
                        onClick={() => {
                          setRewardAmount(amt);
                          setRewardNote(`Offering ₹${amt} reward for return.`);
                        }}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row" style={{ margin: 0 }}>
                  <div className="form-group" style={{ flex: '1', minWidth: '130px', margin: 0 }}>
                    <label className="form-label" htmlFor="lost-reward-amount" style={{ fontSize: '12px' }}>
                      Reward Amount (₹) <span className="required">*</span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '10px', fontWeight: 700, color: '#f59e0b' }}>₹</span>
                      <input
                        type="number"
                        id="lost-reward-amount"
                        className="form-control"
                        placeholder="200"
                        min="50"
                        max="50000"
                        step="50"
                        value={rewardAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRewardAmount(val);
                          if (val) setRewardNote(`Offering ₹${val} reward for return.`);
                        }}
                        style={{ paddingLeft: '26px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ flex: '2', minWidth: '220px', margin: 0 }}>
                    <label className="form-label" htmlFor="lost-reward-note" style={{ fontSize: '12px' }}>
                      Declaration Note / Tagline
                    </label>
                    <input
                      type="text"
                      id="lost-reward-note"
                      className="form-control"
                      placeholder="Offering ₹200 reward for return."
                      value={rewardNote}
                      onChange={(e) => setRewardNote(e.target.value)}
                    />
                  </div>
                </div>

                {/* Live Card Badge Preview */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    fontSize: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ color: 'var(--clr-text-secondary)', fontWeight: 600 }}>
                    Card Badge Preview:
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)',
                    }}
                  >
                    🎁 ₹{rewardAmount || '200'} Reward
                  </span>
                  <span style={{ color: '#b45309', fontSize: '11px', fontStyle: 'italic' }}>
                    "{rewardNote || `Offering ₹${rewardAmount || '200'} reward for return.`}"
                  </span>
                </div>
              </div>
            )}
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
                placeholder="e.g. Apple AirPods Pro"
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
                placeholder="e.g. Apple, Samsung, Nike"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                autoComplete="off"
              />
              <p className="form-hint">Leave blank if unknown or not applicable.</p>
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
              placeholder="Describe the item in detail — distinguishing marks, serial number, what was inside, etc."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
            />
            {errors.description && <span className="form-error visible">{errors.description}</span>}
            <p className="form-hint">More detail = better matching. Mention any unique features.</p>
          </div>
        </div>

        {/* Loss Details */}
        <div className="form-section">
          <h2 className="form-section__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            When &amp; Where
          </h2>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="date-lost">
                Date Lost <span className="required" aria-label="required">*</span>
              </label>
              <input
                type="date"
                id="date-lost"
                max={todayISO()}
                className={`form-control ${errors.dateLost ? 'is-invalid' : ''}`}
                value={dateLost}
                onChange={(e) => {
                  setDateLost(e.target.value);
                  if (errors.dateLost) setErrors((prev) => ({ ...prev, dateLost: '' }));
                }}
              />
              {errors.dateLost && <span className="form-error visible">{errors.dateLost}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="location-lost">
                Location Lost <span className="required" aria-label="required">*</span>
              </label>
              <select
                id="location-lost"
                className={`form-control ${errors.locationLost ? 'is-invalid' : ''}`}
                value={locationLost}
                onChange={(e) => {
                  setLocationLost(e.target.value);
                  if (errors.locationLost) setErrors((prev) => ({ ...prev, locationLost: '' }));
                }}
              >
                <option value="">Select location…</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <div
                id="location-lost-custom-wrap"
                className={`custom-input-wrap ${locationLost === 'Other' ? 'is-visible' : ''}`}
              >
                <input
                  type="text"
                  id="location-lost-custom"
                  className={`form-control ${errors.locationLostCustom ? 'is-invalid' : ''}`}
                  placeholder="Enter custom location (e.g. Room 304, Basketball Court)"
                  value={locationLostCustom}
                  onChange={(e) => {
                    setLocationLostCustom(e.target.value);
                    if (errors.locationLostCustom) setErrors((prev) => ({ ...prev, locationLostCustom: '' }));
                  }}
                  autoComplete="off"
                />
                {errors.locationLostCustom && <span className="form-error visible">{errors.locationLostCustom}</span>}
              </div>
              {errors.locationLost && <span className="form-error visible">{errors.locationLost}</span>}
            </div>
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
            Item Photo <span style={{ fontWeight: 400, color: 'var(--clr-text-tertiary)', fontSize: 'var(--text-sm)' }}>(Optional)</span>
          </h2>

          <div
            className="drop-zone"
            id="lost-drop-zone"
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
              id="lost-image"
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
            <p className="drop-zone__text">Click to upload or drag &amp; drop an image</p>
            <p className="drop-zone__subtext">PNG, JPG, WEBP up to 2MB</p>
          </div>

          {imageData && (
            <div id="lost-image-preview" className="mt-4" aria-live="polite">
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

        {/* Contact Information */}
        <div className="form-section">
          <h2 className="form-section__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Contact Information
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Submit Lost Report
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

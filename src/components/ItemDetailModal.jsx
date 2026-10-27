/**
 * TraceIt — Item Detail Modal Component
 * ItemDetailModal.jsx
 *
 * Full-view modal displaying complete item attributes, blurred photo protection for found items,
 * interactive Ownership Verification Challenge form, possible smart match suggestions,
 * status resolution toggling, and item deletion.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getCategoryEmoji,
  formatDate,
  formatWhatsAppPhone,
  getCustodyAuthority,
} from '../services/utils.js';
import {
  getItemVerificationQuestions,
  verifyOwnershipAnswers,
  getLostItems,
  getFoundItems,
  getItemTimeline,
  addItemTimelineEvent,
  getItemTips,
  addItemTip,
  getClaimState,
  recordFailedClaim,
  clearClaimState,
  CLAIM_MAX_ATTEMPTS,
  CLAIM_MAX_ROUNDS,
} from '../services/storage.js';
import { getAllMatches, matchLabel } from '../services/matching.js';

export default function ItemDetailModal({
  item,
  onClose,
  onToggleStatus,
  onDelete,
  onNavigate,
  showToast,
}) {
  const { user } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeAnswers, setChallengeAnswers] = useState({});
  const [challengeError, setChallengeError] = useState('');

  // Attempt limiter (3 tries -> 15 min lock, 3 rounds -> permanent block)
  const claimantId = user?.id || user?.email || 'guest';
  const [claim, setClaim] = useState(() => getClaimState(item?.id, claimantId));

  useEffect(() => {
    if (item) setClaim(getClaimState(item.id, claimantId));
  }, [item?.id, claimantId]);

  // Tick every second while locked so the countdown updates and unlocks itself
  useEffect(() => {
    if (!claim.locked || !item) return undefined;
    const t = setInterval(() => setClaim(getClaimState(item.id, claimantId)), 1000);
    return () => clearInterval(t);
  }, [claim.locked, item?.id, claimantId]);
  const [timelineEntries, setTimelineEntries] = useState(() => getItemTimeline(item));
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  // 👁️ "I Saw It" Community Sighting Tips state
  const [tips, setTips] = useState(() => getItemTips(item));
  const [showTipForm, setShowTipForm] = useState(false);
  const [tipLocation, setTipLocation] = useState('');
  const [tipNotes, setTipNotes] = useState('');
  const [tipReporter, setTipReporter] = useState(user?.name || '');

  // Synchronize journey timeline & sighting tips whenever the item updates
  useEffect(() => {
    if (item) {
      setTimelineEntries(getItemTimeline(item));
      setTips(getItemTips(item));
    }
  }, [item]);

  const handleTipSubmit = (e) => {
    e.preventDefault();
    if (!tipLocation.trim() || !tipNotes.trim()) return;
    const updatedTips = addItemTip(item.id, item.type, {
      location: tipLocation.trim(),
      notes: tipNotes.trim(),
      reporterName: tipReporter.trim() || user?.name || 'Anonymous Student',
    });
    setTips(updatedTips);
    setTimelineEntries(getItemTimeline(item));
    setTipLocation('');
    setTipNotes('');
    setShowTipForm(false);
    if (showToast) {
      showToast({
        type: 'success',
        message: '👁️ Sighting tip published! Thank you for helping the campus search.',
        duration: 5000,
      });
    }
  };

  const isLost = item?.type === 'lost';
  const isResolved = item?.status === 'resolved';

  // Check if current user is the founder / creator of this item
  const isCreator = Boolean(
    user && item && (
      (user.email && item.contactEmail && user.email.toLowerCase() === item.contactEmail.toLowerCase()) ||
      (user.name && item.contactName && user.name.toLowerCase() === item.contactName.toLowerCase())
    )
  );

  // Unlocked if: already resolved, or user is the creator/owner, or user solved the challenge
  const unlocked = isResolved || isCreator || isUnlocked;

  // Retrieve verification questions (default Brand & Color + any custom ones)
  const questions = item ? getItemVerificationQuestions(item) : [];

  // Find candidate matches for this item
  const candidateMatches = useMemo(() => {
    if (!item || !unlocked) return [];
    if (isLost) {
      const foundItems = getFoundItems();
      return getAllMatches([item], foundItems, 20);
    } else {
      const lostItems = getLostItems();
      return getAllMatches(lostItems, [item], 20);
    }
  }, [item, unlocked, isLost]);

  if (!item) return null;

  const claimLocked = claim.blocked || claim.locked;
  const lockMM = String(Math.floor(claim.remainingMs / 60000)).padStart(2, '0');
  const lockSS = String(Math.floor(claim.remainingMs / 1000) % 60).padStart(2, '0');

  // Handle ownership challenge form submit
  const handleChallengeSubmit = (e) => {
    e.preventDefault();
    const current = getClaimState(item.id, claimantId);
    if (current.blocked || current.locked) {
      setClaim(current);
      setShowChallengeForm(false);
      return;
    }
    const result = verifyOwnershipAnswers(item, challengeAnswers);

    if (result.passed) {
      clearClaimState(item.id, claimantId);
      setClaim(getClaimState(item.id, claimantId));
      setIsUnlocked(true);
      setShowChallengeForm(false);
      setChallengeError('');

      // Record in journey timeline
      const updatedTimeline = addItemTimelineEvent(item.id, item.type, {
        title: 'Ownership verified',
        description: `Verified by claimant (${result.score}% challenge score). Full details unlocked.`,
        icon: '🛡️',
      });
      setTimelineEntries(updatedTimeline);

      if (showToast) {
        showToast({
          type: 'success',
          message: `🎉 Ownership verified (${result.score}%)! Full details unlocked.`,
          duration: 5000,
        });
      }
    } else {
      const next = recordFailedClaim(item.id, claimantId);
      setClaim(next);
      setChallengeAnswers({});
      let errorText = `❌ Verification failed (${result.score}%): ${result.correctCount}/${result.totalQuestions} correct.`;
      if (next.blocked) {
        errorText = '🚫 Too many failed attempts. You are permanently blocked from claiming this item.';
        setShowChallengeForm(false);
      } else if (next.locked) {
        errorText = '⏳ 3 wrong attempts. Try again in 15 minutes.';
        setShowChallengeForm(false);
      } else {
        errorText += ` ${next.attemptsLeft} attempt(s) left in this round.`;
      }
      setChallengeError(errorText);
      if (showToast) {
        showToast({
          type: 'error',
          message: `Verification failed (${result.score}%). Full details remain locked.`,
        });
      }
    }
  };

  // Handle posting a custom update/note to the activity log
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    const author = user?.name ? user.name.split(' ')[0] : 'Campus User';
    const updated = addItemTimelineEvent(item.id, item.type, {
      title: `Update from ${author}`,
      description: noteText.trim(),
      icon: '💬',
    });
    setTimelineEntries(updated);
    setNoteText('');
    setShowAddNote(false);
    if (showToast) {
      showToast({ type: 'success', message: 'Activity note added to item history!' });
    }
  };

  const dateLabel = isLost ? 'Date Lost' : 'Date Found';
  const locLabel = isLost ? 'Location Lost' : 'Location Found';
  const dateVal = item.dateLost || item.dateFound || '—';
  const locVal = item.locationLost || item.locationFound || '—';

  return (
    <div
      className="modal-overlay active"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal modal--lg">
        {/* Modal Header */}
        <div className="modal__header">
          <h2 className="modal__title" id="detail-modal-title">
            {item.name}
          </h2>
          <button className="modal__close" onClick={onClose} aria-label="Close dialog">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal__body">
          {/* High Urgency Notification Banner */}
          {item.isUrgent && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                color: 'var(--clr-danger)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <span style={{ fontSize: '24px' }}>🚨</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: 'var(--text-sm)', display: 'block', color: 'var(--clr-danger)' }}>
                  High-Urgency Campus Alert — Critical Item
                </strong>
                <span style={{ fontSize: 'var(--text-xs)', opacity: 0.9, lineHeight: 1.4, display: 'block' }}>
                  This item has been flagged as critical (passport, exam permit, room/bike keys, or vital medication). If you found it, please contact or hand over to campus authority immediately.
                </span>
              </div>
            </div>
          )}

          {/* 🎁 Honesty Reward / Bounty Tag Banner */}
          {isLost && item.rewardAmount && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.08))',
                border: '1.5px solid rgba(245, 158, 11, 0.4)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <span style={{ fontSize: '28px' }}>🎁</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 'var(--text-base)', color: '#b45309' }}>
                    Offering ₹{item.rewardAmount} Reward for Return
                  </strong>
                  <span
                    className="badge"
                    style={{
                      background: '#f59e0b',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '10px',
                      padding: '2px 7px',
                    }}
                  >
                    Honesty Bounty
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)', lineHeight: 1.4 }}>
                  "{item.rewardNote || `Offering ₹${item.rewardAmount} reward for return.`}"
                </p>
                <span style={{ display: 'block', marginTop: '3px', fontSize: '11px', color: '#b45309', fontWeight: 500 }}>
                  ℹ️ Campus Honesty System: No upfront platform payment. Reward is given directly to the finder upon safe hand-over.
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
            {/* Image Box */}
            <div
              style={{
                flex: '1',
                minWidth: '200px',
                position: 'relative',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                maxHeight: '260px',
                background: '#000',
              }}
            >
              {item.image ? (
                <>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: !unlocked ? 'blur(14px) brightness(0.65)' : 'none',
                      transform: !unlocked ? 'scale(1.08)' : 'none',
                    }}
                  />
                  {!unlocked && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        textAlign: 'center',
                        padding: '12px',
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                      }}
                    >
                      <span style={{ fontSize: '28px', marginBottom: '4px' }}>🔒</span>
                      <p style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 2px' }}>Photo Protected</p>
                      <p style={{ fontSize: '11px', margin: 0, opacity: 0.9 }}>Verify ownership to view</p>
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '200px',
                    background: 'var(--gradient-card)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '64px',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  {getCategoryEmoji(item.category)}
                </div>
              )}
            </div>

            {/* Details Table */}
            <div style={{ flex: '2', minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <span className={`badge badge--${item.type}`}>
                  {isLost ? 'Lost' : 'Found'}
                </span>
                {item.isUrgent && (
                  <span
                    className="badge"
                    style={{
                      background: 'linear-gradient(90deg, #dc2626, #ef4444)',
                      color: '#ffffff',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(220, 38, 38, 0.35)',
                    }}
                  >
                    🚨 Urgent Priority
                  </span>
                )}
                {isLost && item.rewardAmount && (
                  <span
                    className="badge"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#ffffff',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(217, 119, 6, 0.35)',
                    }}
                  >
                    🎁 ₹{item.rewardAmount} Bounty
                  </span>
                )}
                {item.status === 'resolved' && (
                  <span className="badge badge--resolved">Resolved</span>
                )}
                {!unlocked && (
                  <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--clr-danger)' }}>
                    🔒 Protected (Anti-Fraud)
                  </span>
                )}
                {unlocked && !isLost && (
                  <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                    ✓ Ownership Verified
                  </span>
                )}
              </div>

              <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 0', color: 'var(--clr-text-secondary)', width: '40%', fontWeight: 500 }}>
                      Category
                    </td>
                    <td style={{ padding: '8px 0', color: 'var(--clr-text-primary)', fontWeight: 600 }}>
                      {item.category ? `${getCategoryEmoji(item.category)} ${item.category}` : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', color: 'var(--clr-text-secondary)', width: '40%', fontWeight: 500 }}>
                      Brand
                    </td>
                    <td style={{ padding: '8px 0', color: 'var(--clr-text-primary)', fontWeight: 600 }}>
                      {unlocked ? item.brand || '—' : '🔒 Protected'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', color: 'var(--clr-text-secondary)', width: '40%', fontWeight: 500 }}>
                      Color
                    </td>
                    <td style={{ padding: '8px 0', color: 'var(--clr-text-primary)', fontWeight: 600 }}>
                      {unlocked ? item.color || '—' : '🔒 Protected'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', color: 'var(--clr-text-secondary)', width: '40%', fontWeight: 500 }}>
                      {dateLabel}
                    </td>
                    <td style={{ padding: '8px 0', color: 'var(--clr-text-primary)', fontWeight: 600 }}>
                      {formatDate(dateVal)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', color: 'var(--clr-text-secondary)', width: '40%', fontWeight: 500 }}>
                      {locLabel}
                    </td>
                    <td style={{ padding: '8px 0', color: 'var(--clr-text-primary)', fontWeight: 600 }}>
                      {locVal}
                    </td>
                  </tr>
                  {isLost && item.rewardAmount && (
                    <tr>
                      <td style={{ padding: '8px 0', color: '#b45309', width: '40%', fontWeight: 600 }}>
                        🎁 Declared Bounty
                      </td>
                      <td style={{ padding: '8px 0', color: '#b45309', fontWeight: 700 }}>
                        ₹{item.rewardAmount} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>({item.rewardNote || 'Upon return'})</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Custody / Handed-to-Authority Panel — shown for found items, always visible */}
              {!isLost && item.currentlyWith && (
                <div
                  style={{
                    marginTop: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: item.custodyMode === 'authority'
                      ? '1.5px solid rgba(16,185,129,0.35)'
                      : '1.5px solid var(--clr-border-light)',
                  }}
                >
                  {/* Header bar */}
                  <div
                    style={{
                      padding: '8px 14px',
                      background: item.custodyMode === 'authority'
                        ? 'rgba(16,185,129,0.1)'
                        : 'var(--clr-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>📦</span>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 700,
                        color: item.custodyMode === 'authority' ? '#059669' : 'var(--clr-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {item.custodyMode === 'authority' ? 'Item Deposited — Go Collect It' : 'Current Location of Item'}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '12px 14px', background: 'var(--clr-surface)' }}>
                    {item.custodyMode === 'authority' && item.custodyAuthority ? (
                      (() => {
                        const auth = getCustodyAuthority(item.custodyAuthority);
                        return (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <span style={{ fontSize: '32px', lineHeight: 1 }}>{auth?.icon || '🏛️'}</span>
                            <div>
                              <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--clr-text-primary)' }}>
                                {auth?.label || item.custodyAuthority}
                              </div>
                              {item.custodyRoom && (
                                <div
                                  style={{
                                    display: 'inline-block',
                                    marginTop: '4px',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'rgba(16,185,129,0.12)',
                                    color: '#059669',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                  }}
                                >
                                  📍 {item.custodyRoom}
                                </div>
                              )}
                              <p
                                style={{
                                  margin: '6px 0 0',
                                  fontSize: '12px',
                                  color: 'var(--clr-text-secondary)',
                                  lineHeight: 1.5,
                                }}
                              >
                                Walk there with your ID and show this report. No need to call anyone.
                              </p>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-primary)', fontWeight: 500 }}>
                        🤝 {item.currentlyWith}
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--clr-text-secondary)' }}>
                          Contact the finder directly to arrange pickup.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {unlocked ? (
                item.description && (
                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--clr-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 'var(--space-2)' }}>
                      Description
                    </p>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-secondary)' }}>
                      {item.description}
                    </p>
                  </div>
                )
              ) : (
                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(108,99,255,0.06)', border: '1px dashed var(--clr-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)', lineHeight: 1.5 }}>
                  🛡️ <strong>Anti-False Claim Protection:</strong> Description and distinguishing markings are hidden until ownership verification is completed.
                </div>
              )}

              {/* Contact Information */}
              <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--clr-bg)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--clr-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 'var(--space-2)' }}>
                  Contact
                </p>
                {unlocked ? (
                  <>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--clr-text-primary)', margin: '0 0 2px' }}>
                      {item.contactName || '—'}
                    </p>
                    {item.contactEmail && (
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-secondary)', margin: '0 0 2px' }}>
                        {item.contactEmail}
                      </p>
                    )}
                    {item.contactPhone && (
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-secondary)', margin: 0 }}>
                        {item.contactPhone}
                      </p>
                    )}
                    {item.contactPhone && (
                      <div style={{ marginTop: '10px' }}>
                        <a
                          href={`https://wa.me/${formatWhatsAppPhone(item.contactPhone)}?text=${encodeURIComponent(
                            isLost && item.rewardAmount
                              ? `Hi ${item.contactName || ''}, I saw your TraceIt report offering ₹${item.rewardAmount} reward for the lost item "${item.name}". I have information / may have found it! Can we coordinate?`
                              : `Hi ${item.contactName || ''}, I found your report on TraceIt regarding the ${item.type} item "${item.name}". Can we coordinate to return it?`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn--sm"
                          style={{
                            background: '#25D366',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 600,
                            fontSize: '12px',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-md)',
                            textDecoration: 'none',
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                          </svg>
                          Chat on WhatsApp
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-tertiary)', fontStyle: 'italic', margin: 0 }}>
                    🔒 Founder contact details are protected to safeguard against fraudulent claims.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Lost items: details stay protected, but there are no questions */}
          {!unlocked && isLost && (
            <div
              style={{
                marginTop: 'var(--space-4)',
                padding: '16px',
                background: 'var(--clr-bg)',
                border: '1px solid var(--clr-primary)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '28px' }}>🛡️</span>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--clr-primary)', margin: '6px 0' }}>
                Owner details are protected
              </h4>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Found this item? Use <strong>Report Found</strong>. Our matching system will link your report to this one and notify the owner.
              </p>
            </div>
          )}

          {/* Verification Challenge Section (Found items only) */}
          {!unlocked && !isLost && (
            <div
              style={{
                marginTop: 'var(--space-4)',
                padding: '16px',
                background: 'var(--clr-bg)',
                border: '1px solid var(--clr-primary)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              {!showChallengeForm ? (
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '28px' }}>🛡️</span>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--clr-primary)', margin: '6px 0' }}>
                    Ownership Verification Challenge
                  </h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                    To prevent false claims and protect campus property, sensitive details are restricted. Answer the verification questions (minimum 50% correct required) to unlock full details and contact information.
                  </p>
                  {claim.blocked && (
                    <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: 'var(--clr-danger)', borderRadius: 'var(--radius-md)', marginBottom: '10px', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                      🚫 Permanently blocked after {CLAIM_MAX_ROUNDS} failed rounds. You can no longer claim this item.
                    </div>
                  )}
                  {claim.locked && (
                    <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.12)', color: '#B45309', borderRadius: 'var(--radius-md)', marginBottom: '10px', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                      ⏳ Too many wrong attempts. Try again in {lockMM}:{lockSS} (round {claim.rounds} of {CLAIM_MAX_ROUNDS} used).
                    </div>
                  )}
                  {!claimLocked && claim.rounds > 0 && (
                    <p style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', marginBottom: '8px' }}>
                      Round {claim.rounds + 1} of {CLAIM_MAX_ROUNDS} · {CLAIM_MAX_ATTEMPTS - claim.fails} attempt(s) left
                    </p>
                  )}
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    disabled={claimLocked}
                    onClick={() => setShowChallengeForm(true)}
                  >
                    {claim.blocked ? 'Blocked' : claim.locked ? `Try again in ${lockMM}:${lockSS}` : 'Verify Ownership to Unlock Details'}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--clr-primary)', margin: 0 }}>
                      🛡️ Security Verification Questions
                    </h4>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      style={{ fontSize: '11px' }}
                      onClick={() => setShowChallengeForm(false)}
                    >
                      Back
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', marginBottom: '10px' }}>
                    Score at least 50% to verify genuine ownership and unlock item details.
                  </p>

                  {challengeError && (
                    <div
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(239,68,68,0.1)',
                        color: 'var(--clr-danger)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '12px',
                        fontSize: 'var(--text-xs)',
                      }}
                    >
                      {challengeError}
                    </div>
                  )}

                  <form onSubmit={handleChallengeSubmit}>
                    {questions.map((q, idx) => (
                      <div key={q.id} style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--clr-text-primary)', marginBottom: '4px' }}>
                          Question {idx + 1}: {q.question}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter your answer…"
                          required
                          style={{ fontSize: '13px' }}
                          value={challengeAnswers[q.id] || ''}
                          onChange={(e) =>
                            setChallengeAnswers((prev) => ({
                              ...prev,
                              [q.id]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setShowChallengeForm(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn--primary btn--sm">
                        Submit Answers &amp; Unlock
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Possible Matches Section */}
          {unlocked && candidateMatches.length > 0 && (
            <div style={{ marginTop: 'var(--space-6)' }}>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--clr-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 'var(--space-3)' }}>
                Possible Matches ({candidateMatches.length})
              </h4>
              {candidateMatches.slice(0, 3).map((m, idx) => {
                const other = isLost ? m.foundItem : m.lostItem;
                const { color } = matchLabel(m.pct);
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--clr-bg)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3)',
                      marginBottom: 'var(--space-2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div style={{ fontSize: '28px' }}>{getCategoryEmoji(other.category)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--clr-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 2px' }}>
                        {other.name}
                      </p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)', margin: 0 }}>
                        {other.locationFound || other.locationLost || ''}
                      </p>
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color, whiteSpace: 'nowrap' }}>
                      {m.pct}%
                    </span>
                  </div>
                );
              })}
              {candidateMatches.length > 3 && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  style={{ color: 'var(--clr-primary)', fontWeight: 600, padding: 0 }}
                  onClick={() => {
                    onClose();
                    if (onNavigate) onNavigate('matches');
                  }}
                >
                  View all {candidateMatches.length} matches →
                </button>
              )}
            </div>
          )}

          {/* 👁️ "I Saw It" Community Sighting Tips Section */}
          <div
            style={{
              marginTop: 'var(--space-6)',
              borderTop: '1px solid var(--clr-border-light)',
              paddingTop: 'var(--space-4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 700,
                    color: 'var(--clr-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    margin: 0,
                  }}
                >
                  👁️ Community Sighting Tips
                </h4>
                <span
                  className="badge"
                  style={{
                    background: tips.length > 0 ? 'rgba(59, 130, 246, 0.12)' : 'var(--clr-bg)',
                    color: tips.length > 0 ? 'var(--clr-primary)' : 'var(--clr-text-tertiary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                  }}
                >
                  {tips.length} Sighting{tips.length !== 1 ? 's' : ''}
                </span>
              </div>

              <button
                type="button"
                className="btn btn--sm"
                style={{
                  background: showTipForm ? 'var(--clr-surface-hover)' : 'rgba(59, 130, 246, 0.1)',
                  color: 'var(--clr-primary)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                onClick={() => setShowTipForm((prev) => !prev)}
              >
                {showTipForm ? '✕ Close Tip Form' : '👁️ I Saw This Item (Drop Tip)'}
              </button>
            </div>

            <div
              style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px dashed rgba(59, 130, 246, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                marginBottom: 'var(--space-4)',
                fontSize: '12px',
                color: 'var(--clr-text-secondary)',
                lineHeight: 1.4,
              }}
            >
              💡 <strong>Crowdsourced Search:</strong> Spotted this somewhere on campus? Drop a location tip below. Even if you didn't pick it up, sighting reports help owners locate their items fast!
            </div>

            {/* Tip submission form */}
            {showTipForm && (
              <form
                onSubmit={handleTipSubmit}
                style={{
                  background: 'var(--clr-bg)',
                  border: '1.5px solid var(--clr-primary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <h5 style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--clr-primary)', fontWeight: 700 }}>
                  👁️ Drop a Location Sighting Tip
                </h5>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--clr-text-primary)', marginBottom: '4px' }}>
                    Where did you spot it? <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Canteen Table 4, Library 2nd Floor, Sports Bleachers…"
                    value={tipLocation}
                    onChange={(e) => setTipLocation(e.target.value)}
                    required
                    style={{ fontSize: '12px' }}
                    autoFocus
                  />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--clr-text-primary)', marginBottom: '4px' }}>
                    What did you see? Description / Notes <span className="required">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="e.g. Left on the bench near water dispenser yesterday around 4 PM..."
                    value={tipNotes}
                    onChange={(e) => setTipNotes(e.target.value)}
                    required
                    style={{ fontSize: '12px' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--clr-text-primary)', marginBottom: '4px' }}>
                    Your Name or Dept (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Rahul (ECE Dept)"
                    value={tipReporter}
                    onChange={(e) => setTipReporter(e.target.value)}
                    style={{ fontSize: '12px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setShowTipForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--primary btn--sm">
                    Submit Sighting Tip
                  </button>
                </div>
              </form>
            )}

            {/* Tips list */}
            {tips.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--clr-text-tertiary)', fontStyle: 'italic', margin: '4px 0 0' }}>
                No community sightings logged yet. If you have seen this item, click "I Saw This Item" to drop a tip!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tips.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    style={{
                      background: 'var(--clr-bg)',
                      border: '1px solid var(--clr-border-light)',
                      borderLeft: '3px solid var(--clr-primary)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-primary)' }}>
                        📍 {t.location}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--clr-text-tertiary)' }}>
                        {formatDate(t.date)}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--clr-text-secondary)', margin: '0 0 4px', lineHeight: 1.4 }}>
                      "{t.notes}"
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--clr-primary)', fontWeight: 500 }}>
                      Reported by {t.reporterName || 'Anonymous Student'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 📜 Item Journey & Activity History Log */}
          <div
            style={{
              marginTop: 'var(--space-6)',
              borderTop: '1px solid var(--clr-border-light)',
              paddingTop: 'var(--space-4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 700,
                    color: 'var(--clr-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    margin: 0,
                  }}
                >
                  📜 Item Journey &amp; Activity Log
                </h4>
                <span
                  className="badge"
                  style={{
                    background: 'rgba(var(--clr-primary-rgb), 0.1)',
                    color: 'var(--clr-primary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                  }}
                >
                  {timelineEntries.length} Event{timelineEntries.length !== 1 ? 's' : ''}
                </span>
              </div>

              <button
                type="button"
                className="btn btn--ghost btn--sm"
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--clr-border)',
                }}
                onClick={() => setShowAddNote((prev) => !prev)}
              >
                {showAddNote ? '✕ Cancel Note' : '💬 + Add Update Note'}
              </button>
            </div>

            {/* Quick Add Update Note Box */}
            {showAddNote && (
              <form
                onSubmit={handleAddNote}
                style={{
                  background: 'var(--clr-bg)',
                  border: '1px solid var(--clr-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--clr-text-primary)',
                    marginBottom: '4px',
                  }}
                >
                  Post Activity Note or Status Update
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Checked with security office, handed to library desk…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  style={{ fontSize: '12px', marginBottom: '8px' }}
                  autoFocus
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    style={{ fontSize: '11px' }}
                    onClick={() => setShowAddNote(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--primary btn--sm" style={{ fontSize: '11px' }}>
                    Post to History
                  </button>
                </div>
              </form>
            )}

            {/* Timeline Vertical Stepper */}
            <div
              className="item-timeline"
              style={{
                position: 'relative',
                paddingLeft: '28px',
              }}
            >
              {/* Connecting vertical line */}
              <div
                style={{
                  position: 'absolute',
                  left: '11px',
                  top: '12px',
                  bottom: '16px',
                  width: '2px',
                  background: 'var(--clr-border)',
                  zIndex: 1,
                }}
              />

              {timelineEntries.map((entry, idx) => {
                const isLatest = idx === timelineEntries.length - 1;
                return (
                  <div
                    key={entry.id || idx}
                    style={{
                      position: 'relative',
                      marginBottom: idx === timelineEntries.length - 1 ? 0 : '16px',
                      zIndex: 2,
                    }}
                  >
                    {/* Stepper node circle */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-28px',
                        top: '4px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isLatest ? 'var(--clr-primary)' : 'var(--clr-surface)',
                        border: `2px solid ${isLatest ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        boxShadow: isLatest ? '0 0 0 4px rgba(var(--clr-primary-rgb), 0.16)' : 'none',
                        color: isLatest ? '#fff' : 'var(--clr-text-secondary)',
                      }}
                      title={entry.title}
                    >
                      {entry.icon || '📌'}
                    </div>

                    {/* Timeline card */}
                    <div
                      style={{
                        background: 'var(--clr-bg)',
                        border: `1px solid ${isLatest ? 'rgba(var(--clr-primary-rgb), 0.35)' : 'var(--clr-border-light)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        boxShadow: isLatest ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          flexWrap: 'wrap',
                          marginBottom: '3px',
                        }}
                      >
                        <strong
                          style={{
                            fontSize: '13px',
                            color: isLatest ? 'var(--clr-primary)' : 'var(--clr-text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          {entry.title}
                          {isLatest && (
                            <span
                              style={{
                                fontSize: '10px',
                                background: 'rgba(var(--clr-primary-rgb), 0.12)',
                                color: 'var(--clr-primary)',
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-full)',
                                fontWeight: 700,
                              }}
                            >
                              Latest
                            </span>
                          )}
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--clr-text-tertiary)', whiteSpace: 'nowrap' }}>
                          {formatDate(entry.date)}
                        </span>
                      </div>
                      {entry.description && (
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--clr-text-secondary)', lineHeight: 1.45 }}>
                          {entry.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal__footer" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onToggleStatus && (
              <button
                type="button"
                className={`btn btn--sm ${item.status === 'resolved' ? 'btn--ghost' : 'btn--secondary'}`}
                onClick={() => onToggleStatus(item)}
              >
                {item.status === 'resolved' ? 'Reopen Report' : '✓ Mark Resolved'}
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => onDelete(item)}
              >
                Delete
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn--ghost" onClick={onClose}>
              Close
            </button>
            {unlocked ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {item.contactPhone && (
                  <a
                    href={`https://wa.me/${formatWhatsAppPhone(item.contactPhone)}?text=${encodeURIComponent(
                      `Hi ${item.contactName || ''}, I am contacting you regarding your ${isLost ? 'lost' : 'found'} item "${item.name}" on TraceIt.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      background: '#25D366',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 600,
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
                {item.contactEmail && (
                  <a
                    href={`mailto:${item.contactEmail}?subject=TraceIt: Regarding ${encodeURIComponent(item.name)}`}
                    className="btn btn--primary"
                  >
                    Email {isLost ? 'Owner to Help' : 'Founder to Claim'}
                  </a>
                )}
              </div>
            ) : !isLost ? (
              <button
                type="button"
                className="btn btn--primary"
                disabled={claimLocked}
                onClick={() => setShowChallengeForm(true)}
              >
                {claim.blocked ? 'Blocked' : claim.locked ? `Try again in ${lockMM}:${lockSS}` : 'Verify Ownership & Claim'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

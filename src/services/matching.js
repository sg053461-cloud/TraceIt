/**
 * TraceIt — Smart Matching Engine
 * matching.js
 *
 * Pure JavaScript heuristic scoring algorithm for correlating lost and found reports.
 * Evaluates 6 weighted signals without requiring external AI/ML services:
 * 1. Category exact match (30 pts)
 * 2. Brand equality / substring match (25 pts)
 * 3. Location token overlap ratio (20 pts)
 * 4. Color equality / substring match (15 pts)
 * 5. Description keyword intersection via Jaccard similarity (10 pts)
 * 6. Item name word token overlap ratio (5 pts)
 *
 * Total maximum raw score: 105 points.
 * Normalized to a 0% - 100% confidence scale.
 *
 * @module MatchingEngine
 */

import { extractKeywords } from './utils.js';

/**
 * @typedef {Object} Item
 * @property {string} id - Unique item identifier
 * @property {'lost'|'found'} type - Item report type
 * @property {string} name - Title or name of the item
 * @property {string} category - Category taxonomy key
 * @property {string} [brand] - Manufacturer or brand name
 * @property {string} color - Primary color
 * @property {string} [locationLost] - Location where lost
 * @property {string} [locationFound] - Location where found
 * @property {string} [dateLost] - Date lost (YYYY-MM-DD)
 * @property {string} [dateFound] - Date found (YYYY-MM-DD)
 * @property {string} description - Detailed item description
 * @property {string} contactName - Reporter contact name
 * @property {string} contactPhone - Reporter contact phone
 * @property {string} contactEmail - Reporter contact email
 * @property {string} [image] - Base64 encoded image data URL
 * @property {'active'|'resolved'|'claimed'} status - Item lifecycle status
 * @property {string} createdAt - ISO 8601 timestamp
 */

/**
 * @typedef {Object} ScoreBreakdown
 * @property {number} category - Points scored for category match (0 or 30)
 * @property {number} brand - Points scored for brand match (0, 15, or 25)
 * @property {number} color - Points scored for color match (0, 8, or 15)
 * @property {number} location - Points scored for location overlap (0 to 20)
 * @property {number} keywords - Points scored for description keyword overlap (0 to 10)
 * @property {number} nameWords - Points scored for title word overlap (0 to 5)
 */

/**
 * @typedef {Object} MatchResult
 * @property {Item} lostItem - Full lost item record
 * @property {Item} foundItem - Full found item record
 * @property {number} score - Raw cumulative score (0 to 105)
 * @property {number} pct - Normalized confidence percentage (0 to 100)
 * @property {ScoreBreakdown} breakdown - Individual score components
 */

// ── Scoring Weights ────────────────────────────────────────
/**
 * Point distribution across all 6 heuristic signals.
 * @constant {Object<string, number>}
 */
const WEIGHTS = {
  category:    30,
  brand:       25,
  location:    20,
  color:       15,
  keywords:    10,  // per shared keyword (max 1 full point)
  nameWords:    5,
};

/**
 * Maximum possible raw score attainable across all signals.
 * @constant {number}
 */
const MAX_SCORE = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); // 105

// ── Normalise Helper ───────────────────────────────────────
/**
 * Normalizes a string by trimming, lowercasing, and collapsing whitespace.
 *
 * @param {string} [str=''] - Raw input string
 * @returns {string} Normalized lowercase string
 */
const norm = (str = '') => str.toLowerCase().trim().replace(/\s+/g, ' ');

/**
 * Splits a string into normalized word tokens with length > 1.
 *
 * @param {string} str - Raw input text
 * @returns {string[]} Array of word tokens
 */
function wordsOf(str) {
  return norm(str).split(/\s+/).filter(w => w.length > 1);
}

// ── Field Matchers ─────────────────────────────────────────

/**
 * Evaluates exact match between item categories.
 *
 * @param {Item} lost - Lost item entity
 * @param {Item} found - Found item entity
 * @returns {number} 30 points if categories match exactly; 0 otherwise
 */
function categoryScore(lost, found) {
  if (!lost.category || !found.category) return 0;
  return norm(lost.category) === norm(found.category) ? WEIGHTS.category : 0;
}

/**
 * Evaluates brand equality or substring inclusion.
 *
 * @param {Item} lost - Lost item entity
 * @param {Item} found - Found item entity
 * @returns {number} 25 for exact match, 15 for partial/substring match, 0 otherwise
 */
function brandScore(lost, found) {
  if (!lost.brand || !found.brand) return 0;
  const l = norm(lost.brand);
  const f = norm(found.brand);
  if (!l || !f || l === 'n/a' || f === 'n/a') return 0;
  if (l === f) return WEIGHTS.brand;
  // Partial: one contains the other
  if (l.includes(f) || f.includes(l)) return Math.round(WEIGHTS.brand * 0.6);
  return 0;
}

/**
 * Evaluates color equality or substring inclusion.
 *
 * @param {Item} lost - Lost item entity
 * @param {Item} found - Found item entity
 * @returns {number} 15 for exact match, 8 for partial match, 0 otherwise
 */
function colorScore(lost, found) {
  if (!lost.color || !found.color) return 0;
  const l = norm(lost.color);
  const f = norm(found.color);
  if (!l || !f) return 0;
  if (l === f) return WEIGHTS.color;
  if (l.includes(f) || f.includes(l)) return Math.round(WEIGHTS.color * 0.5);
  return 0;
}

/**
 * Calculates location overlap by comparing tokenized campus location strings.
 *
 * @param {Item} lost - Lost item entity
 * @param {Item} found - Found item entity
 * @returns {number} Score scaled from 0 to 20 based on shared location words
 */
function locationScore(lost, found) {
  if (!lost.locationLost || !found.locationFound) return 0;
  const lWords = wordsOf(lost.locationLost);
  const fWords = wordsOf(found.locationFound);
  if (!lWords.length || !fWords.length) return 0;

  const lStr = norm(lost.locationLost);
  const fStr = norm(found.locationFound);
  if (lStr === fStr) return WEIGHTS.location;

  // Count shared location words
  const shared = lWords.filter(w => fWords.includes(w)).length;
  if (shared === 0) return 0;
  const ratio = shared / Math.max(lWords.length, fWords.length);
  return Math.round(WEIGHTS.location * ratio);
}

/**
 * Calculates description similarity using Jaccard coefficient on extracted keywords.
 *
 * @param {Item} lost - Lost item entity
 * @param {Item} found - Found item entity
 * @returns {number} Score from 0 to 10 based on keyword intersection
 */
function keywordScore(lost, found) {
  const lText = [lost.name, lost.description, lost.brand].join(' ');
  const fText = [found.name, found.description, found.brand].join(' ');

  const lKw = new Set(extractKeywords(lText));
  const fKw = new Set(extractKeywords(fText));

  if (lKw.size === 0 || fKw.size === 0) return 0;

  const shared = [...lKw].filter(k => fKw.has(k)).length;
  if (shared === 0) return 0;

  // Jaccard-like ratio, capped at WEIGHTS.keywords
  const union  = new Set([...lKw, ...fKw]).size;
  const jaccard = shared / union;
  return Math.min(Math.round(WEIGHTS.keywords * jaccard * 3), WEIGHTS.keywords);
}

/**
 * Computes token overlap ratio between item names.
 *
 * @param {Item} lost - Lost item entity
 * @param {Item} found - Found item entity
 * @returns {number} Score from 0 to 5 based on title token overlap
 */
function nameWordScore(lost, found) {
  if (!lost.name || !found.name) return 0;
  const lWords = wordsOf(lost.name);
  const fWords = wordsOf(found.name);
  const shared = lWords.filter(w => fWords.includes(w)).length;
  if (shared === 0) return 0;
  const ratio = shared / Math.max(lWords.length, fWords.length);
  return Math.round(WEIGHTS.nameWords * ratio);
}

// ── Core Scoring Function ──────────────────────────────────

/**
 * Scores a single (lostItem, foundItem) pair across all 6 heuristic signals.
 *
 * @param {Item} lostItem - The lost item entity
 * @param {Item} foundItem - The found item entity
 * @returns {{ raw: number, pct: number, breakdown: ScoreBreakdown }} Score object
 * @example
 * const result = scoreMatch(lostWatch, foundWatch);
 * console.log(`Confidence: ${result.pct}% (Raw: ${result.raw}/105)`);
 */
export function scoreMatch(lostItem, foundItem) {
  const breakdown = {
    category: categoryScore(lostItem, foundItem),
    brand:    brandScore(lostItem, foundItem),
    color:    colorScore(lostItem, foundItem),
    location: locationScore(lostItem, foundItem),
    keywords: keywordScore(lostItem, foundItem),
    nameWords:nameWordScore(lostItem, foundItem),
  };

  const raw = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const pct = Math.min(Math.round((raw / MAX_SCORE) * 100), 100);

  return { raw, pct, breakdown };
}

/**
 * Alias for scoreMatch to maintain backwards compatibility.
 */
export const calculateMatchScore = scoreMatch;

// ── Get All Matches ────────────────────────────────────────

/**
 * Compares a single found item against all lost items in the database.
 * Used to provide instant feedback upon submitting a found report.
 *
 * @param {Item}   foundItem - Newly registered found item
 * @param {Item[]} lostItems - List of all registered lost items
 * @param {number} [threshold=20] - Minimum percentage confidence to include
 * @returns {MatchResult[]} Array of match results sorted descending by confidence score
 */
export function getMatchesForFound(foundItem, lostItems, threshold = 20) {
  return lostItems
    .map(lostItem => {
      const { raw, pct, breakdown } = scoreMatch(lostItem, foundItem);
      return { lostItem, foundItem, score: raw, pct, breakdown };
    })
    .filter(m => m.pct >= threshold)
    .sort((a, b) => b.pct - a.pct);
}

/**
 * Compares a single lost item against all found items in the database.
 *
 * @param {Item}   lostItem - Newly registered lost item
 * @param {Item[]} foundItems - List of all registered found items
 * @param {number} [threshold=20] - Minimum percentage confidence to include
 * @returns {MatchResult[]} Array of match results sorted descending by confidence score
 */
export function getMatchesForLost(lostItem, foundItems, threshold = 20) {
  return foundItems
    .map(foundItem => {
      const { raw, pct, breakdown } = scoreMatch(lostItem, foundItem);
      return { lostItem, foundItem, score: raw, pct, breakdown };
    })
    .filter(m => m.pct >= threshold)
    .sort((a, b) => b.pct - a.pct);
}

/**
 * Computes all match pairs across all active lost × found items.
 * Deduplicates results and returns pairs sorted descending by confidence.
 *
 * @param {Item[]} lostItems - Array of all lost items
 * @param {Item[]} foundItems - Array of all found items
 * @param {number} [threshold=20] - Minimum percentage cutoff
 * @returns {MatchResult[]} Array of deduplicated match pairs
 */
export function getAllMatches(lostItems, foundItems, threshold = 20) {
  const pairs = [];

  for (const lostItem of lostItems) {
    for (const foundItem of foundItems) {
      const { raw, pct, breakdown } = scoreMatch(lostItem, foundItem);
      if (pct >= threshold) {
        pairs.push({ lostItem, foundItem, score: raw, pct, breakdown });
      }
    }
  }

  // Sort descending by pct, deduplicate by pair id
  const seen = new Set();
  return pairs
    .sort((a, b) => b.pct - a.pct)
    .filter(pair => {
      const key = `${pair.lostItem.id}|${pair.foundItem.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

// ── Match Quality Label ────────────────────────────────────

/**
 * Generates a human-friendly label and brand color for a given match percentage.
 *
 * @param {number} pct - Match confidence percentage (0 - 100)
 * @returns {{ label: string, color: string }} Badge label and hex color
 */
export function matchLabel(pct) {
  if (pct >= 80) return { label: 'Excellent Match', color: '#10B981' };
  if (pct >= 60) return { label: 'Good Match',      color: '#3B82F6' };
  if (pct >= 40) return { label: 'Possible Match',  color: '#F59E0B' };
  return              { label: 'Low Match',          color: '#EF4444' };
}

// ── Breakdown Row Renderer (returns HTML string) ──────────

/**
 * Renders a privacy-safe indicator for score breakdown to prevent leaking sensitive matching attributes.
 *
 * @param {ScoreBreakdown} breakdown - Individual signal score values
 * @returns {string} HTML markup representing the privacy notice
 */
export function renderBreakdown(breakdown) {
  return `
    <div style="padding:10px 12px;background:rgba(108,99,255,0.06);border-radius:var(--radius-md);border:1px dashed var(--clr-primary);font-size:var(--text-xs);color:var(--clr-text-secondary);line-height:1.5;">
      <div style="display:flex;align-items:center;gap:6px;font-weight:600;color:var(--clr-primary);margin-bottom:4px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        <span>Anti-Fraud Protection: Signal Breakdown Masked</span>
      </div>
      <p style="margin:0;">Individual field match points are masked to prevent fraudulent claims. Complete the ownership verification questionnaire to unlock item specifics.</p>
    </div>
  `;
}

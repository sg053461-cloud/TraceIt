/**
 * TraceIt — Utility Functions
 * utils.js
 *
 * Core helper utilities for formatting, sanitization, string manipulation,
 * DOM query shortcuts, file readers, debouncing, animations, and shared taxonomy constants.
 *
 * @module Utilities
 */

// ── ID Generation ──────────────────────────────────────────
/**
 * Generates a unique alphanumeric identifier with a prefix, timestamp, and random suffix.
 *
 * @param {string} [prefix='item'] - Key prefix (e.g. 'lost', 'found', 'user')
 * @returns {string} Formatted ID string (e.g. 'lost_l8z8q1_9x8ab')
 */
export function generateId(prefix = 'item') {
  const ts    = Date.now().toString(36);
  const rand  = Math.random().toString(36).slice(2, 7);
  return `${prefix}_${ts}_${rand}`;
}

// ── Date Helpers ───────────────────────────────────────────
/**
 * Formats a date string into an Indian English localized format (e.g., '14 Sep 2026').
 *
 * @param {string|Date} dateStr - Date string or Date object
 * @param {Intl.DateTimeFormatOptions} [options={}] - Optional formatting overrides
 * @returns {string} Formatted date string or '—' if null/undefined
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '—';
  const defaults = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-IN', { ...defaults, ...options });
}

/**
 * Converts a date string into a relative human-readable time-ago string (e.g. '2 hours ago').
 *
 * @param {string|Date} dateStr - Target timestamp
 * @returns {string} Human-friendly relative time
 */
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  const intervals = [
    [31536000, 'year'],
    [2592000,  'month'],
    [86400,    'day'],
    [3600,     'hour'],
    [60,       'minute'],
    [1,        'second'],
  ];
  for (const [secs, unit] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

/**
 * Normalizes a date into a standard ISO 8601 string.
 *
 * @param {string|Date} [dateStr] - Input date or null for current timestamp
 * @returns {string} ISO 8601 formatted string
 */
export function toISODate(dateStr) {
  return dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
}

/**
 * Returns today's calendar date as a YYYY-MM-DD string.
 *
 * @returns {string} Current date string
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ── Text Helpers ───────────────────────────────────────────
/**
 * Converts a string into a URL-friendly slug.
 *
 * @param {string} str - Raw string
 * @returns {string} Hyphenated lowercase slug
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Sanitizes arbitrary text strings for safe injection into the DOM, preventing XSS.
 *
 * @param {string} str - User-supplied string
 * @returns {string} HTML-escaped string
 */
export function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

/**
 * Truncates a string to a maximum length and appends an ellipsis if truncated.
 *
 * @param {string} str - Source string
 * @param {number} [maxLength=80] - Character threshold
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength = 80) {
  if (!str) return '';
  return str.length > maxLength ? str.slice(0, maxLength).trimEnd() + '…' : str;
}

/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} str - Input text
 * @returns {string} Capitalized text
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Converts a string to Title Case.
 *
 * @param {string} str - Input text
 * @returns {string} Title-cased text
 */
export function titleCase(str) {
  return str?.split(' ').map(capitalize).join(' ') ?? '';
}

/**
 * Extracts normalized, stop-word-free keyword tokens longer than 2 characters.
 *
 * @param {string} text - Source text corpus
 * @returns {string[]} Array of unique significant keywords
 */
export function extractKeywords(text) {
  if (!text) return [];
  // Remove stop words and short tokens
  const stopWords = new Set([
    'a','an','the','is','it','in','on','at','of','to','for',
    'and','or','but','this','that','was','are','be','my','i',
    'he','she','they','with','from','by','as','so','if','its',
    'has','have','had','not','do','did','does','can','will',
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

/**
 * Cleans and formats phone numbers for WhatsApp wa.me links.
 * E.g. "+91 98765 43210" -> "919876543210", "9876543210" -> "919876543210"
 *
 * @param {string} phone
 * @returns {string} Clean digits string suitable for wa.me
 */
export function formatWhatsAppPhone(phone) {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.substring(1)}`;
  }
  return digits;
}

// ── Function Helpers ───────────────────────────────────────
/**
 * Creates a debounced version of a function that delays execution until after
 * wait milliseconds have elapsed since the last time it was invoked.
 *
 * @template {Function} T
 * @param {T} fn - Target function
 * @param {number} [wait=300] - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, wait = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Creates a throttled version of a function that only invokes once per limit period.
 *
 * @template {Function} T
 * @param {T} fn - Target function
 * @param {number} [limit=300] - Throttle duration in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit = 300) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= limit) { last = now; fn(...args); }
  };
}

/**
 * Wraps a function so that it can only be called exactly once.
 * Subsequent calls return the original result.
 *
 * @template {Function} T
 * @param {T} fn - Function to guard
 * @returns {Function} Once-executable function
 */
export function once(fn) {
  let called = false, result;
  return (...args) => {
    if (!called) { called = true; result = fn(...args); }
    return result;
  };
}

// ── DOM Helpers ────────────────────────────────────────────
/**
 * Query selector shortcut returning the first matching element.
 *
 * @param {string} selector - CSS selector
 * @param {ParentNode} [parent=document] - Container element
 * @returns {HTMLElement|null}
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Query selector shortcut returning an array of all matching elements.
 *
 * @param {string} selector - CSS selector
 * @param {ParentNode} [parent=document] - Container element
 * @returns {HTMLElement[]}
 */
export function $$(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

/**
 * Helper to construct an HTML DOM element with classes, text, HTML, and attributes.
 *
 * @param {string} tag - Tag name
 * @param {Object} [options={}] - Configuration
 * @param {string} [options.className] - CSS class list
 * @param {string} [options.text] - Text content
 * @param {string} [options.html] - Raw HTML content
 * @param {Object<string, string>} [options.attrs={}] - Key-value attribute map
 * @param {Node[]} [options.children=[]] - Child nodes to append
 * @returns {HTMLElement} Newly created element
 */
export function createElement(tag, { className, text, html, attrs = {}, children = [] } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  if (html !== undefined) el.innerHTML = html;
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  children.forEach(c => el.append(c));
  return el;
}

/**
 * Sets inner HTML of an element safely if the element exists.
 *
 * @param {HTMLElement|null} el - Target element
 * @param {string} html - HTML markup string
 */
export function setContent(el, html) {
  if (el) el.innerHTML = html;
}

/**
 * Reveals an element by removing the 'hidden' CSS class.
 * @param {HTMLElement|null} el
 */
export function show(el) { el?.classList.remove('hidden'); }

/**
 * Hides an element by appending the 'hidden' CSS class.
 * @param {HTMLElement|null} el
 */
export function hide(el) { el?.classList.add('hidden'); }

/**
 * Toggles an element's visibility based on a boolean condition.
 * @param {HTMLElement|null} el
 * @param {boolean} condition
 */
export function toggle(el, condition) {
  el?.classList.toggle('hidden', !condition);
}

// ── File Helpers ───────────────────────────────────────────
/**
 * Triggers a browser file download of arbitrary serializable data as a JSON file.
 *
 * @param {*} data - Serializable payload
 * @param {string} [filename='traceit-export.json'] - Target download filename
 */
export function downloadJSON(data, filename = 'traceit-export.json') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = createElement('a', { attrs: { href: url, download: filename } });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Reads a File object and parses its content as JSON.
 *
 * @param {File} file - Target file
 * @returns {Promise<any>} Parsed JSON payload
 */
export function readFileAsJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => { try { resolve(JSON.parse(e.target.result)); } catch { reject(new Error('Invalid JSON')); } };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}

/**
 * Reads a File object and converts it into a Base64 data URL string.
 *
 * @param {File} file - Target image file
 * @returns {Promise<string>} Base64 Data URL
 */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

// ── Scroll Helpers ─────────────────────────────────────────
/**
 * Scrolls window smoothly to the top of the viewport.
 *
 * @param {boolean} [smooth=true] - Smooth scrolling behavior
 */
export function scrollToTop(smooth = true) {
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' });
}

/**
 * Checks if a DOM element is currently within the visible viewport bounds.
 *
 * @param {HTMLElement} el - Element to inspect
 * @returns {boolean} True if visible
 */
export function isInViewport(el) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

// ── Device Helpers ─────────────────────────────────────────
/**
 * Checks if current viewport width is below 768px (tablet/mobile breakpoint).
 *
 * @returns {boolean} True if viewport is mobile width
 */
export function isMobile() {
  return window.innerWidth < 768;
}

// ── Category Config ────────────────────────────────────────
/**
 * Master catalog of item categories, labels, and emojis.
 * @constant {Array<{ value: string, label: string, emoji: string }>}
 */
export const CATEGORIES = [
  { value: 'electronics',  label: 'Electronics',  emoji: '💻' },
  { value: 'wallet',       label: 'Wallet',        emoji: '👛' },
  { value: 'id-card',      label: 'ID / Card',     emoji: '🪪' },
  { value: 'keys',         label: 'Keys',          emoji: '🔑' },
  { value: 'bag',          label: 'Bag / Backpack', emoji: '🎒' },
  { value: 'clothing',     label: 'Clothing',      emoji: '👕' },
  { value: 'jewelry',      label: 'Jewelry / Watch', emoji: '⌚' },
  { value: 'books',        label: 'Books / Notes',  emoji: '📚' },
  { value: 'documents',    label: 'Documents',     emoji: '📄' },
  { value: 'sports',       label: 'Sports Item',   emoji: '⚽' },
  { value: 'accessories',  label: 'Accessories',   emoji: '🕶️' },
  { value: 'other',        label: 'Other',         emoji: '📦' },
];

/**
 * Retrieves the representative emoji for a given category value key.
 *
 * @param {string} value - Category identifier
 * @returns {string} Emoji symbol
 */
export function getCategoryEmoji(value) {
  return CATEGORIES.find(c => c.value === value)?.emoji ?? '📦';
}

/**
 * Retrieves the human-readable display label for a category key.
 *
 * @param {string} value - Category identifier
 * @returns {string} Display label
 */
export function getCategoryLabel(value) {
  return CATEGORIES.find(c => c.value === value)?.label ?? titleCase(value);
}

// ── Color Palette for picker ───────────────────────────────
/**
 * Standard selectable colors for item attributes.
 * @constant {string[]}
 */
export const COLORS = [
  'Black', 'White', 'Gray', 'Silver', 'Brown', 'Red', 'Orange',
  'Yellow', 'Green', 'Blue', 'Purple', 'Pink', 'Gold', 'Beige',
  'Navy', 'Maroon', 'Teal', 'Multicolor', 'Other',
];

// ── Campus Locations ───────────────────────────────────────
/**
 * Common campus landmark and facility locations for report auto-suggestions.
 * @constant {string[]}
 */
export const LOCATIONS = [
  'Square 1',
  'Square 2',
  'Main Gate',
  'Gate 2',
  'Gate 3',
  'Gate 4',
  'Sportorium',
  'Exploretorium',
  'Turing Block',
  'Tesla Block',
  'Galileo Block',
  'Flemming Block',
  'Dice Lab',
  'Einstein Block',
  'De Morgan Block',
  'Turing Extension',
  'Alpha Zone',
  'Beta Zone',
  'Gamma Zone',
  'Zero Ground',
  'Library',
  'Archemedes A',
  'Archemedes B',
  'Pi A',
  'Pi B',
  'Pi C',
  'Franklin A/B',
  'Alfred Noble A/B',
  'Neil Armstrong A/B',
  'Marco Pollo',
  'Aristotle',
  'Megallen',
  'IBN Batuta A/B',
  'Nightingale A/B',
  'Columbus',
  'Martin Luther',
  'Rockfeller',
  'Newton Block',
  'Cafeteria',
  'Auditorium',
  'Parking Area',
  'Other',
];

// ── Custody / Handed-to-Authority Config ─────────────────────────────────────
/**
 * Structured list of campus authorities an item can be handed over to.
 * Each entry has a value (storage key), label (display name), icon (emoji), and
 * an optional hint shown in the form.
 *
 * @constant {Array<{ value: string, label: string, icon: string, hint: string }>}
 */
export const CUSTODY_AUTHORITIES = [
  { value: 'security',       label: 'Security Office',        icon: '🏛️', hint: 'Main campus security desk / guard room' },
  { value: 'library',        label: 'Library Desk',           icon: '📚', hint: 'Library information or circulation counter' },
  { value: 'hostel_warden',  label: 'Hostel Warden',          icon: '🏠', hint: 'Hostel warden office or reception' },
  { value: 'dept_office',    label: 'Department Office',      icon: '🏢', hint: 'Academic department admin office' },
  { value: 'admin_office',   label: 'Admin / College Office', icon: '🗂️', hint: 'Main administrative or student affairs office' },
  { value: 'cafeteria',      label: 'Cafeteria / Canteen',    icon: '☕', hint: 'Cafeteria counter or manager' },
  { value: 'sports_office',  label: 'Sports Office',          icon: '🏅', hint: 'Sports complex or PE department office' },
  { value: 'other_authority',label: 'Other Authority',        icon: '📋', hint: 'Any other official campus authority' },
];

/**
 * Retrieves display metadata for a custody authority value key.
 *
 * @param {string} value - Authority identifier
 * @returns {{ value: string, label: string, icon: string, hint: string } | null}
 */
export function getCustodyAuthority(value) {
  return CUSTODY_AUTHORITIES.find((a) => a.value === value) || null;
}

// ── Animated Counter ───────────────────────────────────────
/**
 * Smoothly animates a numeric element counter from current value to target number.
 *
 * @param {HTMLElement} el - Element whose textContent will update
 * @param {number} target - Destination integer
 * @param {number} [duration=1500] - Animation time in milliseconds
 */
export function animateCounter(el, target, duration = 1500) {
  if (!el) return;
  const start     = parseInt(el.textContent) || 0;
  const startTime = performance.now();
  const update = (currentTime) => {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    el.textContent = Math.round(start + (target - start) * ease);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

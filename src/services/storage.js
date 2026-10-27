/**
 * TraceIt — Storage Module
 * storage.js
 *
 * Provides a pure, robust abstraction layer over the browser's localStorage.
 * Handles CRUD operations for lost and found reports, user accounts, active sessions,
 * search history, UI preferences, and full JSON backup import/export.
 *
 * @module StorageService
 */

/**
 * @typedef {Object} Item
 * @property {string} id - Unique item identifier (e.g., 'lost_1710000000_abcde')
 * @property {'lost'|'found'} type - Discriminator between lost and found items
 * @property {string} name - Title or name of the item
 * @property {string} category - Category identifier
 * @property {string} [brand] - Brand or manufacturer name
 * @property {string} color - Primary color of the item
 * @property {string} [locationLost] - Location where lost (type === 'lost')
 * @property {string} [locationFound] - Location where found (type === 'found')
 * @property {string} [dateLost] - Date lost in YYYY-MM-DD format
 * @property {string} [dateFound] - Date found in YYYY-MM-DD format
 * @property {string} description - Detailed description
 * @property {string} contactName - Contact name of reporting party
 * @property {string} contactEmail - Contact email of reporting party
 * @property {string} contactPhone - Contact phone number
 * @property {'open'|'resolved'|'claimed'} status - Current resolution status
 * @property {boolean} [isUrgent] - Whether marked as high-urgency/priority (e.g. passport, keys, ID, meds)
 * @property {number} [rewardAmount] - Declared honesty bounty/reward amount in INR (e.g. 200)
 * @property {string} [rewardNote] - Declaration note (e.g. 'Offering ₹200 reward for return')
 * @property {string} createdAt - ISO 8601 creation timestamp
 * @property {string} [updatedAt] - ISO 8601 last modified timestamp
 * @property {string|null} [image] - Base64 Data URL or null
 * @property {Array<{id: string, date: string, title: string, description: string, icon?: string}>} [timeline] - Chronological activity & status history log
 * @property {Array<{id: string, date: string, location: string, notes: string, reporterName?: string}>} [tips] - Community crowdsourced sighting tips
 * @property {Array<{id: string, question: string, answer: string}>} [verificationQuestions] - Security verification questions set by finder to prevent false claims
 */

/**
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} name - Full user name
 * @property {string} email - Campus email address
 * @property {string} [password] - User password (demo sandbox)
 * @property {'Student'|'Faculty'|'Staff'} role - Campus role
 * @property {string} studentId - Student or employee ID badge number
 * @property {string} phone - Contact phone number
 * @property {string} avatarBg - Hex color code for user avatar
 * @property {string} createdAt - ISO 8601 timestamp
 */

/**
 * @typedef {Object} Settings
 * @property {'light'|'dark'} theme - Active visual theme
 * @property {boolean} notificationsEnabled - Whether UI notifications are enabled
 * @property {number} matchThreshold - Minimum percentage cutoff for matches
 * @property {number} itemsPerPage - Number of items displayed per catalog page
 * @property {boolean} compactView - Whether compact density mode is enabled
 */

/**
 * @typedef {Object} StorageStats
 * @property {number} lostCount - Count of registered lost items
 * @property {number} foundCount - Count of registered found items
 * @property {number} total - Sum of all lost and found items
 * @property {number} resolved - Count of resolved items
 * @property {number} active - Count of open/unresolved items
 */

// ── Storage Keys ───────────────────────────────────────────
/**
 * LocalStorage key namespace mapping.
 * @enum {string}
 */
export const StorageKeys = Object.freeze({
  LOST_ITEMS:     'traceit_lost_items',
  FOUND_ITEMS:    'traceit_found_items',
  SETTINGS:       'traceit_settings',
  SEARCH_HISTORY: 'traceit_search_history',
  RECENT_VIEWED:  'traceit_recent_viewed',
  THEME:          'traceit_theme',
  CURRENT_USER:   'traceit_current_user',
  USERS:          'traceit_users',
});

// ── Default Settings ───────────────────────────────────────
/**
 * Default fallback user preferences.
 * @constant {Settings}
 */
const DEFAULT_SETTINGS = {
  theme: 'light',
  notificationsEnabled: true,
  matchThreshold: 30,
  itemsPerPage: 9,
  compactView: false,
};

// ── Generic Helpers ────────────────────────────────────────
/**
 * Reads and deserializes a JSON value from localStorage safely.
 *
 * @template T
 * @param {string} key - The localStorage key to retrieve
 * @param {T} [fallback=null] - Default value if key is missing or parsing fails
 * @returns {T} The parsed object or fallback
 */
function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Serializes and writes a JavaScript value to localStorage safely.
 *
 * @param {string} key - The localStorage target key
 * @param {*} value - The value to JSON serialize
 * @returns {boolean} True if successfully written, false on quota/serialization error
 */
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`[Storage] Failed to write key "${key}":`, e);
    return false;
  }
}

// ── Lost Items ─────────────────────────────────────────────
/**
 * Retrieves all registered lost items from storage.
 *
 * @returns {Item[]} Array of lost items
 */
export function getLostItems() {
  return readJSON(StorageKeys.LOST_ITEMS, []);
}

/**
 * Persists the lost items array into storage.
 *
 * @param {Item[]} items - Array of lost items to save
 * @returns {boolean} True on success
 */
export function saveLostItems(items) {
  return writeJSON(StorageKeys.LOST_ITEMS, items);
}

/**
 * Adds a new lost item to the top of the lost items list.
 *
 * @param {Item} item - New item object
 * @returns {Item} The stored item
 */
export function addLostItem(item) {
  const items = getLostItems();
  items.unshift(item); // newest first
  saveLostItems(items);
  return item;
}

/**
 * Updates an existing lost item by ID with partial changes.
 *
 * @param {string} id - The unique ID of the lost item
 * @param {Partial<Item>} updates - Fields to merge into the existing item
 * @returns {boolean} True if item was found and updated, false otherwise
 */
export function updateLostItem(id, updates) {
  const items = getLostItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return false;
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  return saveLostItems(items);
}

/**
 * Deletes a lost item from storage by ID.
 *
 * @param {string} id - The unique ID of the lost item to delete
 * @returns {boolean} True on success
 */
export function deleteLostItem(id) {
  const items = getLostItems().filter(i => i.id !== id);
  return saveLostItems(items);
}

/**
 * Finds a single lost item by its ID.
 *
 * @param {string} id - The ID to look up
 * @returns {Item|null} The item object or null if not found
 */
export function getLostItemById(id) {
  return getLostItems().find(i => i.id === id) ?? null;
}

// ── Found Items ────────────────────────────────────────────
/**
 * Retrieves all registered found items from storage.
 *
 * @returns {Item[]} Array of found items
 */
export function getFoundItems() {
  return readJSON(StorageKeys.FOUND_ITEMS, []);
}

/**
 * Persists the found items array into storage.
 *
 * @param {Item[]} items - Array of found items to save
 * @returns {boolean} True on success
 */
export function saveFoundItems(items) {
  return writeJSON(StorageKeys.FOUND_ITEMS, items);
}

/**
 * Adds a new found item to the top of the found items list.
 *
 * @param {Item} item - New found item object
 * @returns {Item} The stored item
 */
export function addFoundItem(item) {
  const items = getFoundItems();
  items.unshift(item);
  saveFoundItems(items);
  return item;
}

/**
 * Updates an existing found item by ID with partial changes.
 *
 * @param {string} id - The unique ID of the found item
 * @param {Partial<Item>} updates - Fields to merge into the existing item
 * @returns {boolean} True if item was found and updated, false otherwise
 */
export function updateFoundItem(id, updates) {
  const items = getFoundItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return false;
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  return saveFoundItems(items);
}

/**
 * Deletes a found item from storage by ID.
 *
 * @param {string} id - The unique ID of the found item to delete
 * @returns {boolean} True on success
 */
export function deleteFoundItem(id) {
  const items = getFoundItems().filter(i => i.id !== id);
  return saveFoundItems(items);
}

/**
 * Finds a single found item by its ID.
 *
 * @param {string} id - The ID to look up
 * @returns {Item|null} The item object or null if not found
 */
export function getFoundItemById(id) {
  return getFoundItems().find(i => i.id === id) ?? null;
}

// ── Combined Items ─────────────────────────────────────────
/**
 * Retrieves both lost and found items in a single list, sorted newest first.
 *
 * @returns {Item[]} Combined array of lost and found items
 */
export function getAllItems() {
  const lost  = getLostItems().map(i => ({ ...i, type: 'lost' }));
  const found = getFoundItems().map(i => ({ ...i, type: 'found' }));
  return [...lost, ...found].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

/**
 * Retrieves the N most recently created items across both lost and found categories.
 *
 * @param {number} [count=6] - Number of items to retrieve
 * @returns {Item[]} Array of recent items
 */
export function getRecentItems(count = 6) {
  return getAllItems().slice(0, count);
}

// ── Settings ───────────────────────────────────────────────
/**
 * Retrieves the current settings merged with default fallback values.
 *
 * @returns {Settings} Current application settings
 */
export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...readJSON(StorageKeys.SETTINGS, {}) };
}

/**
 * Merges partial settings into stored user preferences.
 *
 * @param {Partial<Settings>} partial - Settings object to merge
 * @returns {boolean} True on success
 */
export function saveSettings(partial) {
  const current = getSettings();
  return writeJSON(StorageKeys.SETTINGS, { ...current, ...partial });
}

// ── Theme ──────────────────────────────────────────────────
/**
 * Retrieves the active UI theme ('light' or 'dark').
 *
 * @returns {'light'|'dark'} The current theme
 */
export function getTheme() {
  return localStorage.getItem(StorageKeys.THEME) ?? 'light';
}

/**
 * Sets the active theme in localStorage and applies it to the document element.
 *
 * @param {'light'|'dark'} theme - The theme identifier
 */
export function setTheme(theme) {
  localStorage.setItem(StorageKeys.THEME, theme);
  document.documentElement.setAttribute('data-theme', theme);
}

// ── Search History ─────────────────────────────────────────
/**
 * Retrieves the stored recent search query strings.
 *
 * @returns {string[]} List of search queries
 */
export function getSearchHistory() {
  return readJSON(StorageKeys.SEARCH_HISTORY, []);
}

/**
 * Adds a search term to history, deduplicating and limiting to 15 entries.
 *
 * @param {string} term - The search query to record
 */
export function addSearchTerm(term) {
  if (!term?.trim()) return;
  const history = getSearchHistory();
  const cleaned = term.trim().toLowerCase();
  const updated = [cleaned, ...history.filter(t => t !== cleaned)].slice(0, 15);
  writeJSON(StorageKeys.SEARCH_HISTORY, updated);
}

/**
 * Clears all stored search history entries.
 */
export function clearSearchHistory() {
  localStorage.removeItem(StorageKeys.SEARCH_HISTORY);
}

// ── Recently Viewed ────────────────────────────────────────
/**
 * Retrieves the list of recently opened/viewed item objects.
 *
 * @returns {Item[]} Array of recently viewed items
 */
export function getRecentlyViewed() {
  return readJSON(StorageKeys.RECENT_VIEWED, []);
}

/**
 * Appends an item to the recently viewed stack (max 10 items).
 *
 * @param {Item} item - The viewed item entity
 */
export function addRecentlyViewed(item) {
  const list   = getRecentlyViewed();
  const updated = [item, ...list.filter(i => i.id !== item.id)].slice(0, 10);
  writeJSON(StorageKeys.RECENT_VIEWED, updated);
}

// ── Data Management ────────────────────────────────────────
/**
 * Clears all TraceIt data stored in localStorage.
 */
export function clearAllData() {
  Object.values(StorageKeys).forEach(key => localStorage.removeItem(key));
}

/**
 * Aggregates statistics for reports across both lost and found collections.
 *
 * @returns {StorageStats} Metric counters
 */
export function getStorageStats() {
  const lostItems  = getLostItems();
  const foundItems = getFoundItems();
  const resolved   = [...lostItems, ...foundItems].filter(i => i.status === 'resolved').length;
  return {
    lostCount:  lostItems.length,
    foundCount: foundItems.length,
    total:      lostItems.length + foundItems.length,
    resolved,
    active:     lostItems.length + foundItems.length - resolved,
  };
}

/**
 * Exports all application state as a structured backup object.
 *
 * @returns {{ version: string, exportedAt: string, lostItems: Item[], foundItems: Item[], settings: Settings }}
 */
export function exportData() {
  return {
    version:    '1.0',
    exportedAt: new Date().toISOString(),
    lostItems:  getLostItems(),
    foundItems: getFoundItems(),
    settings:   getSettings(),
  };
}

/**
 * Restores application state from a parsed backup object.
 *
 * @param {Object} data - Parsed backup object
 * @throws {Error} When data format is malformed
 */
export function importData(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid data format');
  if (data.lostItems  && Array.isArray(data.lostItems))  saveLostItems(data.lostItems);
  if (data.foundItems && Array.isArray(data.foundItems)) saveFoundItems(data.foundItems);
  if (data.settings   && typeof data.settings === 'object') {
    writeJSON(StorageKeys.SETTINGS, data.settings);
  }
}

// ── User Authentication Storage ────────────────────────────
/**
 * Retrieves the array of registered user accounts.
 *
 * @returns {User[]} Array of registered users
 */
export function getStoredUsers() {
  return readJSON(StorageKeys.USERS, []);
}

/**
 * Saves registered users array to localStorage.
 *
 * @param {User[]} users - Array of users
 * @returns {boolean} True on success
 */
export function saveStoredUsers(users) {
  return writeJSON(StorageKeys.USERS, users);
}

/**
 * Retrieves the currently active user session from storage.
 *
 * @returns {User|null} The current session user, or null if logged out
 */
export function getCurrentUserSession() {
  return readJSON(StorageKeys.CURRENT_USER, null);
}

/**
 * Persists the active session user to storage.
 *
 * @param {User} user - User to set as active session
 * @returns {boolean} True on success
 */
export function saveCurrentUserSession(user) {
  return writeJSON(StorageKeys.CURRENT_USER, user);
}

/**
 * Terminates the active session by removing the user from storage.
 */
export function clearCurrentUserSession() {
  localStorage.removeItem(StorageKeys.CURRENT_USER);
}

// ── Demo Seed Data ─────────────────────────────────────────
/**
 * Default realistic demo seed data for Lost items.
 * @constant {Item[]}
 */
export const DEFAULT_DEMO_LOST_ITEMS = [
  {
    id: 'lost_demo_01',
    type: 'lost',
    name: 'MacBook Pro 14" Space Gray',
    category: 'electronics',
    brand: 'Apple',
    color: 'Gray',
    locationLost: 'Central Library, 2nd Floor',
    dateLost: '2026-09-12',
    description: 'Space Gray Apple MacBook Pro M2 left near 2nd floor reading carrels in black padded sleeve.',
    contactName: 'Alex Johnson',
    contactEmail: 'alex.j@campus.edu',
    contactPhone: '+91 98765 43210',
    status: 'open',
    rewardAmount: 200,
    rewardNote: 'Offering ₹200 reward for return.',
    createdAt: '2026-09-12T10:30:00.000Z',
    image: null,
    timeline: [
      {
        id: 'tl_demo_01_1',
        date: '2026-09-12T10:30:00.000Z',
        title: 'Reported lost by Alex',
        description: 'Case registered with details: Central Library, 2nd Floor. Anti-fraud protection active.',
        icon: '📝',
      },
      {
        id: 'tl_demo_01_2',
        date: '2026-09-14T11:45:00.000Z',
        title: 'Match found (82% score)',
        description: 'Smart match engine identified candidate: "Laptop in Black Padded Sleeve" reported by Sarah Chen.',
        icon: '⚡',
      },
    ],
    tips: [
      {
        id: 'tip_demo_01',
        date: '2026-09-13T15:30:00.000Z',
        location: 'Library 2nd Floor Study Carrel #14',
        notes: 'Spotted a black laptop sleeve on the carrel desk near the south window around 3 PM yesterday.',
        reporterName: 'Neha (CS Dept)',
      },
    ],
  },
  {
    id: 'lost_demo_02',
    type: 'lost',
    name: 'Hydro Flask Water Bottle (32oz)',
    category: 'accessories',
    brand: 'Hydro Flask',
    color: 'Blue',
    locationLost: 'Sports Complex Basketball Court',
    dateLost: '2026-09-13',
    description: 'Cobalt blue 32oz wide mouth insulated bottle with university stickers on the side.',
    contactName: 'David Miller',
    contactEmail: 'david.m@campus.edu',
    contactPhone: '+91 98765 43212',
    status: 'open',
    createdAt: '2026-09-13T14:15:00.000Z',
    image: null,
    tips: [
      {
        id: 'tip_demo_02',
        date: '2026-09-14T16:20:00.000Z',
        location: 'Sportorium Bleachers, Court 2',
        notes: 'Saw a cobalt blue insulated bottle resting near the scorer bench after evening tournament.',
        reporterName: 'Kunal (Sports Secretary)',
      },
    ],
  },
  {
    id: 'lost_demo_03',
    type: 'lost',
    name: 'Campus Student ID Card',
    category: 'id-card',
    brand: 'Campus ID',
    color: 'White',
    locationLost: 'Main Cafeteria Food Court',
    dateLost: '2026-09-14',
    description: 'Official campus student identification card belonging to Sagar Verma (Dept of CS, Roll #2024CS104). Needed urgently for upcoming mid-semester examinations.',
    contactName: 'Sagar Verma',
    contactEmail: 'sagar@campus.edu',
    contactPhone: '+91 98765 43214',
    status: 'open',
    isUrgent: true,
    createdAt: '2026-09-14T09:00:00.000Z',
    image: null,
  },
  {
    id: 'lost_demo_04',
    type: 'lost',
    name: 'Casio FX-991EX Scientific Calculator',
    category: 'electronics',
    brand: 'Casio',
    color: 'Black',
    locationLost: 'Physics Lab Block A (Room 301)',
    dateLost: '2026-09-11',
    description: 'ClassWiz scientific calculator in black slip-on cover. Left on front lab bench.',
    contactName: 'Priya Sharma',
    contactEmail: 'priya.s@campus.edu',
    contactPhone: '+91 98765 43216',
    status: 'open',
    createdAt: '2026-09-11T16:45:00.000Z',
    image: null,
  },
  {
    id: 'lost_demo_05',
    type: 'lost',
    name: 'Wildhorn Brown Leather Wallet',
    category: 'wallet',
    brand: 'Wildhorn',
    color: 'Brown',
    locationLost: 'Student Activity Center',
    dateLost: '2026-09-10',
    description: 'Genuine brown bifold leather wallet containing metro pass, room key, and gym membership card.',
    contactName: 'Karan Patel',
    contactEmail: 'karan.p@campus.edu',
    contactPhone: '+91 98765 43218',
    status: 'open',
    isUrgent: true,
    rewardAmount: 500,
    rewardNote: 'Offering ₹500 reward for safe return.',
    createdAt: '2026-09-10T18:20:00.000Z',
    image: null,
  },
];

/**
 * Default realistic demo seed data for Found items.
 * @constant {Item[]}
 */
export const DEFAULT_DEMO_FOUND_ITEMS = [
  {
    id: 'found_demo_01',
    type: 'found',
    name: 'Laptop in Black Padded Sleeve',
    category: 'electronics',
    brand: 'Apple',
    color: 'Gray',
    locationFound: 'Central Library, 2nd Floor',
    dateFound: '2026-09-12',
    description: 'Laptop found on study desk in 2nd floor library. Safely handed over to library circulation desk.',
    contactName: 'Sarah Chen (Librarian)',
    contactEmail: 'library.desk@campus.edu',
    contactPhone: '+91 98765 43211',
    status: 'open',
    createdAt: '2026-09-12T11:45:00.000Z',
    image: null,
    verificationQuestions: [
      { id: 'q_stickers', question: 'What stickers or unique markings are on the laptop lid?', answer: 'GitHub Octocat and React logo stickers' },
      { id: 'q_location', question: 'Near which specific desk or corner was this item located?', answer: 'Library 2nd floor, study carrel #14 by the south windows' },
    ],
  },
  {
    id: 'found_demo_02',
    type: 'found',
    name: 'Insulated Sports Water Bottle',
    category: 'accessories',
    brand: 'Hydro Flask',
    color: 'Blue',
    locationFound: 'Sports Complex Basketball Court',
    dateFound: '2026-09-13',
    description: 'Found insulated metal water bottle on court 2 bleachers after evening tournament.',
    contactName: 'Coach Rahul',
    contactEmail: 'sports@campus.edu',
    contactPhone: '+91 98765 43213',
    status: 'open',
    createdAt: '2026-09-13T17:30:00.000Z',
    image: null,
    verificationQuestions: [
      { id: 'q_spot', question: 'Near which specific court or bleachers was it left?', answer: 'Sports Complex Basketball Court bleachers' },
    ],
  },
  {
    id: 'found_demo_03',
    type: 'found',
    name: 'Campus Student ID Card',
    category: 'id-card',
    brand: 'Campus ID',
    color: 'White',
    locationFound: 'Main Cafeteria Food Court',
    dateFound: '2026-09-14',
    description: 'Found white student identification card near food counter table 14. Kept at lost-and-found cafeteria register.',
    contactName: 'Cafeteria Admin',
    contactEmail: 'dining@campus.edu',
    contactPhone: '+91 98765 43215',
    status: 'open',
    isUrgent: true,
    createdAt: '2026-09-14T10:15:00.000Z',
    image: null,
    verificationQuestions: [
      { id: 'q_student_name', question: 'What is the student name printed on the card?', answer: 'Sagar Verma' },
      { id: 'q_roll_no', question: 'What department or roll number is shown?', answer: 'Computer Science CS 2024CS104' },
    ],
  },
  {
    id: 'found_demo_04',
    type: 'found',
    name: 'Compact Rain Umbrella',
    category: 'other',
    brand: 'Generic',
    color: 'Black',
    locationFound: 'Main Auditorium, Row F',
    dateFound: '2026-09-09',
    description: 'Automatic umbrella with curved handle found under row F seat after seminar.',
    contactName: 'Auditorium Caretaker',
    contactEmail: 'facilities@campus.edu',
    contactPhone: '+91 98765 43217',
    status: 'open',
    createdAt: '2026-09-09T15:00:00.000Z',
    image: null,
    verificationQuestions: [
      { id: 'q_handle', question: 'Describe the handle material or style.', answer: 'Curved wooden handle' },
    ],
  },
  {
    id: 'found_demo_05',
    type: 'found',
    name: 'Designer Sunglasses in Case',
    category: 'accessories',
    brand: 'Ray-Ban',
    color: 'Black',
    locationFound: 'Central Lawn Benches',
    dateFound: '2026-09-08',
    description: 'Polarized sunglasses in textured leather case. Safely kept at campus security office.',
    contactName: 'Campus Security',
    contactEmail: 'security@campus.edu',
    contactPhone: '+91 98765 43219',
    status: 'resolved',
    createdAt: '2026-09-08T12:00:00.000Z',
    image: null,
    timeline: [
      {
        id: 'tl_demo_05_1',
        date: '2026-09-08T12:00:00.000Z',
        title: 'Reported found by Campus Security',
        description: 'Deposited safely at campus security office (found at Central Lawn Benches).',
        icon: '📝',
      },
      {
        id: 'tl_demo_05_2',
        date: '2026-09-09T14:30:00.000Z',
        title: 'Ownership verified',
        description: 'Owner successfully answered verification question identifying the textured leather case.',
        icon: '🛡️',
      },
      {
        id: 'tl_demo_05_3',
        date: '2026-09-10T10:15:00.000Z',
        title: 'Marked Resolved ✅',
        description: 'Item safely collected and handed over in person. Case officially closed.',
        icon: '✅',
      },
    ],
    verificationQuestions: [
      { id: 'q_case', question: 'What kind of case were they kept in?', answer: 'Textured leather case' },
    ],
  },
];

/**
 * Seeds initial demo items into storage if the existing collections are empty.
 *
 * @param {boolean} [force=false] - If true, unconditionally overwrites existing data with seed demo items
 * @returns {boolean} True if items were seeded, false if existing items were retained
 */
export function ensureDemoItems(force = false) {
  const currentLost = getLostItems();
  const currentFound = getFoundItems();
  const needsRefresh = currentFound.some(i =>
    i.id === 'found_demo_01' && (
      !i.verificationQuestions ||
      i.verificationQuestions.some(q => q.id === 'q1' || q.id === 'q2') ||
      i.name.includes('Apple') ||
      i.name.includes('MacBook')
    )
  );
  if (force || (currentLost.length === 0 && currentFound.length === 0) || needsRefresh) {
    saveLostItems(DEFAULT_DEMO_LOST_ITEMS);
    saveFoundItems(DEFAULT_DEMO_FOUND_ITEMS);
    return true;
  }

  // Ensure urgent flags exist on existing demo items if not present
  let lostUpdated = false;
  const migratedLost = currentLost.map(item => {
    if ((item.id === 'lost_demo_03' || item.id === 'lost_demo_05') && item.isUrgent === undefined) {
      lostUpdated = true;
      return { ...item, isUrgent: true };
    }
    return item;
  });
  if (lostUpdated) saveLostItems(migratedLost);

  let foundUpdated = false;
  const migratedFound = currentFound.map(item => {
    if (item.id === 'found_demo_03' && item.isUrgent === undefined) {
      foundUpdated = true;
      return { ...item, isUrgent: true };
    }
    return item;
  });
  if (foundUpdated) saveFoundItems(migratedFound);
  return false;
}

// ── Ownership Verification Security Helpers ────────────────

/**
 * Retrieves the verification questions for a found item.
 * Default questions are ALWAYS about Brand and Color, and any custom questions
 * added by the founder are included on top.
 *
 * @param {Item} item - Found item entity
 * @returns {Array<{id: string, question: string, answer: string, isDefault?: boolean}>}
 */
export function getItemVerificationQuestions(item) {
  if (!item) return [];

  const questions = [];

  // Default Question 1: Brand / Manufacturer
  const brandVal = (item.brand && item.brand.trim() && item.brand.toLowerCase() !== 'generic')
    ? item.brand.trim()
    : (item.brand ? item.brand.trim() : 'Generic');
  questions.push({
    id: 'default_brand',
    question: 'What is the brand or manufacturer of this item?',
    answer: brandVal,
    isDefault: true,
  });

  // Default Question 2: Color
  const colorVal = (item.color && item.color.trim()) ? item.color.trim() : 'Not specified';
  questions.push({
    id: 'default_color',
    question: 'What is the primary color of this item?',
    answer: colorVal,
    isDefault: true,
  });

  // Additional custom questions added on top by the founder/reporter
  if (Array.isArray(item.verificationQuestions) && item.verificationQuestions.length > 0) {
    item.verificationQuestions.forEach((q, idx) => {
      if (!q || !q.question || !q.question.trim()) return;
      const qText = q.question.toLowerCase().trim();
      // If someone explicitly specified brand or color in custom questions, update default answer
      if (q.id === 'default_brand' || q.id === 'q_brand' || ((qText.includes('brand') || qText.includes('manufacturer')) && !qText.includes('sticker') && !qText.includes('model') && !qText.includes('tag') && !qText.includes('lid'))) {
        if (q.answer && q.answer.trim()) {
          questions[0].answer = q.answer.trim();
        }
      } else if (q.id === 'default_color' || q.id === 'q_color' || (qText.includes('color') && !qText.includes('zipper') && !qText.includes('lining') && !qText.includes('case') && !qText.includes('handle') && !qText.includes('bottle') && !qText.includes('canopy'))) {
        if (q.answer && q.answer.trim()) {
          questions[1].answer = q.answer.trim();
        }
      } else {
        questions.push({
          id: q.id || `custom_q_${idx}`,
          question: q.question.trim(),
          answer: (q.answer || '').trim(),
          isDefault: false,
        });
      }
    });
  }

  return questions;
}

/**
 * Normalizes a text string for fuzzy evaluation.
 * @param {string} str
 * @returns {string}
 */
function normalizeAnswer(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether a user answer sufficiently matches the expected answer.
 * Uses substring containment, token intersection, and keyword matching.
 *
 * @param {string} userAnswer
 * @param {string} expectedAnswer
 * @returns {boolean}
 */
function checkAnswerMatch(userAnswer, expectedAnswer) {
  const userNorm = normalizeAnswer(userAnswer);
  const expNorm = normalizeAnswer(expectedAnswer);

  if (!userNorm || !expNorm) return false;
  if (userNorm === expNorm) return true;
  // User's answer contains the full expected phrase as whole word(s)
  if ((' ' + userNorm + ' ').includes(' ' + expNorm + ' ')) return true;

  // Token-level matching (excluding common filler/stop words)
  const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'of', 'and', 'or', 'with', 'for', 'to', 'is', 'it', 'my', 'this']);
  const expTokens = expNorm.split(' ').filter(t => t.length > 2 && !stopWords.has(t));
  const userTokens = new Set(userNorm.split(' ').filter(t => t.length > 2 && !stopWords.has(t)));

  if (expTokens.length === 0) return false;

  const matchedTokens = expTokens.filter(t => userTokens.has(t));
  const matchRatio = matchedTokens.length / expTokens.length;

  return matchRatio >= 0.5;
}

/**
 * Evaluates submitted user answers against the item's security verification questions.
 * Minimum 50% score required to pass.
 *
 * @param {Item} item - Target found item
 * @param {Record<string, string>} userAnswers - Object mapping question ID to answer text
 * @returns {{
 *   passed: boolean,
 *   score: number,
 *   correctCount: number,
 *   totalQuestions: number,
 *   results: Array<{ id: string, question: string, isCorrect: boolean }>
 * }}
 */
export function verifyOwnershipAnswers(item, userAnswers = {}) {
  const questions = getItemVerificationQuestions(item);
  if (!questions.length) {
    return { passed: true, score: 100, correctCount: 0, totalQuestions: 0, results: [] };
  }

  let correctCount = 0;
  const results = questions.map((q) => {
    const userVal = userAnswers[q.id] || '';
    const isCorrect = checkAnswerMatch(userVal, q.answer);
    if (isCorrect) correctCount++;
    return {
      id: q.id,
      question: q.question,
      isCorrect,
    };
  });

  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= 50;

  return {
    passed,
    score,
    correctCount,
    totalQuestions: questions.length,
    results,
  };
}

// ── Item Activity History & Timeline Helpers ──────────────

/**
 * Retrieves or builds the activity journey timeline for an item.
 *
 * @param {Item} item
 * @returns {Array<{id: string, date: string, title: string, description: string, icon: string}>}
 */
export function getItemTimeline(item) {
  if (!item) return [];

  // If item already has a recorded timeline array with entries, return a copy
  if (Array.isArray(item.timeline) && item.timeline.length > 0) {
    return [...item.timeline].sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  const entries = [];
  const createdDate = item.createdAt || new Date().toISOString();
  const isLost = item.type === 'lost';
  const personName = item.contactName ? item.contactName.split(' ')[0] : (isLost ? 'Owner' : 'Finder');
  const loc = item.locationLost || item.locationFound || 'Campus';

  // 1. Initial report event
  entries.push({
    id: `tl_init_${item.id}`,
    date: createdDate,
    title: `Reported ${isLost ? 'lost' : 'found'} by ${personName}`,
    description: `Case registered with location: ${loc}. ${item.isUrgent ? '🚨 Flagged as high-urgency priority.' : 'Details recorded in campus registry.'}`,
    icon: '📝',
  });

  // 2. Demo specific realistic entries
  if (item.id === 'lost_demo_01') {
    entries.push({
      id: 'tl_demo_01_match',
      date: '2026-09-14T11:45:00.000Z',
      title: 'Match found (82% score)',
      description: 'Smart match engine identified candidate: "Laptop in Black Padded Sleeve" reported by Sarah Chen.',
      icon: '⚡',
    });
  } else if (item.id === 'found_demo_01') {
    entries.push({
      id: 'tl_demo_f01_match',
      date: '2026-09-13T10:00:00.000Z',
      title: 'Matched with Lost Report (82% score)',
      description: 'Candidate owner identified: MacBook Pro 14" Space Gray reported by Alex Johnson.',
      icon: '⚡',
    });
  } else if (item.id === 'lost_demo_03' || item.id === 'found_demo_03') {
    entries.push({
      id: `tl_demo_03_match`,
      date: '2026-09-14T10:30:00.000Z',
      title: 'Direct Match Identified (95% score)',
      description: 'Campus ID Roll #2024CS104 matched between Sagar Verma and Cafeteria Admin.',
      icon: '⚡',
    });
  }

  // 3. Ownership verified
  if (item.isVerified) {
    entries.push({
      id: `tl_verified_${item.id}`,
      date: item.verifiedAt || new Date(new Date(createdDate).getTime() + 86400000).toISOString(),
      title: 'Ownership verified',
      description: 'Claimant successfully answered anti-fraud verification questions. Security clearance passed.',
      icon: '🛡️',
    });
  }

  // 4. If status is resolved
  if (item.status === 'resolved') {
    const resolvedDate = item.updatedAt || new Date(new Date(createdDate).getTime() + 172800000).toISOString();
    entries.push({
      id: `tl_resolved_${item.id}`,
      date: resolvedDate,
      title: 'Marked Resolved ✅',
      description: 'Item safely returned to rightful owner. Handover completed and case closed.',
      icon: '✅',
    });
  }

  return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Appends a new activity log entry to an item and saves it in localStorage.
 *
 * @param {string} itemId
 * @param {'lost'|'found'} type
 * @param {{ title: string, description: string, icon?: string, date?: string }} eventData
 * @returns {Array} The updated timeline array
 */
export function addItemTimelineEvent(itemId, type, eventData) {
  const isLost = type === 'lost';
  const item = isLost ? getLostItemById(itemId) : getFoundItemById(itemId);
  if (!item) return [];

  const existingTimeline = getItemTimeline(item);
  const newEntry = {
    id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    date: eventData.date || new Date().toISOString(),
    title: eventData.title,
    description: eventData.description || '',
    icon: eventData.icon || '📌',
  };

  const updatedTimeline = [...existingTimeline, newEntry];
  if (isLost) {
    updateLostItem(itemId, { timeline: updatedTimeline });
  } else {
    updateFoundItem(itemId, { timeline: updatedTimeline });
  }

  return updatedTimeline;
}

// ── Community Crowdsourced Sighting Tips Helpers ───────────

/**
 * Retrieves crowdsourced sighting tips associated with an item.
 *
 * @param {Item} item
 * @returns {Array<{id: string, date: string, location: string, notes: string, reporterName?: string}>}
 */
export function getItemTips(item) {
  if (!item) return [];
  return Array.isArray(item.tips) ? item.tips : [];
}

/**
 * Adds a crowdsourced sighting tip to an item and automatically records a milestone in its timeline.
 *
 * @param {string} itemId
 * @param {'lost'|'found'} type
 * @param {{ location: string, notes: string, reporterName?: string, date?: string }} tipData
 * @returns {Array} Updated tips array
 */
export function addItemTip(itemId, type, tipData) {
  const isLost = type === 'lost';
  const item = isLost ? getLostItemById(itemId) : getFoundItemById(itemId);
  if (!item) return [];

  const existingTips = getItemTips(item);
  const newTip = {
    id: `tip_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    date: tipData.date || new Date().toISOString(),
    location: tipData.location.trim(),
    notes: tipData.notes.trim(),
    reporterName: (tipData.reporterName || 'Anonymous Student').trim(),
  };

  const updatedTips = [newTip, ...existingTips];

  // Also log into timeline so the journey shows community sightings
  const timelineEntry = {
    id: `tl_tip_${Date.now()}`,
    date: newTip.date,
    title: `Sighting Tip Dropped: ${newTip.location}`,
    description: `"${newTip.notes}" — spotted by ${newTip.reporterName}`,
    icon: '👁️',
  };
  const updatedTimeline = [...getItemTimeline(item), timelineEntry];

  if (isLost) {
    updateLostItem(itemId, { tips: updatedTips, timeline: updatedTimeline });
  } else {
    updateFoundItem(itemId, { tips: updatedTips, timeline: updatedTimeline });
  }

  return updatedTips;
}

// ── Ownership Claim Attempt Limiter ────────────────────────
const CLAIM_ATTEMPTS_KEY = 'traceit_claim_attempts';
export const CLAIM_MAX_ATTEMPTS = 3;            // wrong tries per round
export const CLAIM_MAX_ROUNDS = 3;              // rounds before permanent block
export const CLAIM_LOCK_MS = 15 * 60 * 1000;    // 15 min lock between rounds

function readClaimAttempts() {
  try {
    return JSON.parse(localStorage.getItem(CLAIM_ATTEMPTS_KEY)) || {};
  } catch {
    return {};
  }
}

function writeClaimAttempts(data) {
  try {
    localStorage.setItem(CLAIM_ATTEMPTS_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function getClaimState(itemId, claimantId) {
  const rec = readClaimAttempts()[`${claimantId || 'guest'}:${itemId}`] || {
    fails: 0, rounds: 0, lockUntil: 0, blocked: false,
  };
  const now = Date.now();
  return {
    ...rec,
    locked: !rec.blocked && rec.lockUntil > now,
    remainingMs: Math.max(0, rec.lockUntil - now),
    attemptsLeft: CLAIM_MAX_ATTEMPTS - rec.fails,
  };
}

export function recordFailedClaim(itemId, claimantId) {
  const all = readClaimAttempts();
  const key = `${claimantId || 'guest'}:${itemId}`;
  const rec = all[key] || { fails: 0, rounds: 0, lockUntil: 0, blocked: false };

  rec.fails += 1;
  if (rec.fails >= CLAIM_MAX_ATTEMPTS) {
    rec.rounds += 1;
    rec.fails = 0;
    if (rec.rounds >= CLAIM_MAX_ROUNDS) {
      rec.blocked = true;
      rec.lockUntil = 0;
    } else {
      rec.lockUntil = Date.now() + CLAIM_LOCK_MS;
    }
  }
  all[key] = rec;
  writeClaimAttempts(all);
  return getClaimState(itemId, claimantId);
}

export function clearClaimState(itemId, claimantId) {
  const all = readClaimAttempts();
  delete all[`${claimantId || 'guest'}:${itemId}`];
  writeClaimAttempts(all);
}

/**
 * TraceIt — Authentication Module
 * auth.js
 *
 * User authentication, session management, route protection,
 * and demo account provisioning for campus users.
 *
 * @module AuthService
 */

import {
  getStoredUsers,
  saveStoredUsers,
  getCurrentUserSession,
  saveCurrentUserSession,
  clearCurrentUserSession,
} from './storage.js';

/**
 * @typedef {Object} UserAccount
 * @property {string} id - Unique user identifier
 * @property {string} name - Full user name
 * @property {string} email - Campus email address
 * @property {string} password - Stored password string
 * @property {'Student'|'Faculty'|'Staff'} role - Campus role
 * @property {string} studentId - Student or Faculty ID badge number
 * @property {string} phone - Contact phone number
 * @property {string} avatarBg - Hex color code for avatar background
 * @property {string} createdAt - ISO 8601 creation timestamp
 */

/**
 * @typedef {Object} SessionUser
 * @property {string} id - Unique user identifier
 * @property {string} name - Full user name
 * @property {string} email - Campus email address
 * @property {'Student'|'Faculty'|'Staff'} role - Campus role
 * @property {string} studentId - Student or Faculty ID badge number
 * @property {string} phone - Contact phone number
 * @property {string} avatarBg - Hex color code for avatar background
 * @property {string} loginAt - ISO 8601 login timestamp
 */

/**
 * @typedef {Object} AuthResult
 * @property {boolean} success - Whether the authentication action succeeded
 * @property {string} [message] - Human-readable status or error message
 * @property {SessionUser} [user] - Active session user object on success
 */

// ── Default Demo Accounts ──────────────────────────────────
/**
 * Predefined campus demo profiles for rapid testing and demonstrations.
 * @constant {UserAccount[]}
 */
export const DEMO_ACCOUNTS = [
  {
    id: 'user_stu_001',
    name: 'Alex Johnson',
    email: 'alex@campus.edu',
    password: 'password123',
    role: 'Student',
    studentId: 'STU-2024-0892',
    phone: '+91 98765 43210',
    avatarBg: '#2563EB',
    createdAt: '2024-01-15T09:00:00.000Z',
  },
  {
    id: 'user_fac_002',
    name: 'Prof. Sarah Smith',
    email: 'sarah.smith@campus.edu',
    password: 'password123',
    role: 'Faculty',
    studentId: 'FAC-1042',
    phone: '+91 98765 43211',
    avatarBg: '#7C3AED',
    createdAt: '2024-01-16T10:30:00.000Z',
  },
];

/**
 * Initializes default demo users in storage if the users collection is empty.
 *
 * @returns {UserAccount[]} The current array of stored user accounts
 */
export function ensureDefaultUsers() {
  const existing = getStoredUsers();
  if (!existing || existing.length === 0) {
    saveStoredUsers(DEMO_ACCOUNTS);
    return DEMO_ACCOUNTS;
  }
  return existing;
}

/**
 * Returns list of pre-configured demo accounts for quick 1-click logins.
 *
 * @returns {UserAccount[]} Array of demo account objects
 */
export function getDemoAccounts() {
  return DEMO_ACCOUNTS;
}

/**
 * Gets the currently logged-in user session object.
 *
 * @returns {SessionUser|null} The session user object, or null if unauthenticated
 */
export function getCurrentUser() {
  ensureDefaultUsers();
  return getCurrentUserSession();
}

/**
 * Checks whether an active authenticated session exists.
 *
 * @returns {boolean} True if user is logged in
 */
export function isAuthenticated() {
  return Boolean(getCurrentUser());
}

/**
 * Extracts 1 or 2 letter uppercase initials from a user's full name.
 *
 * @param {string} [name=''] - The full name string
 * @returns {string} Uppercase initials (e.g., 'AJ' for 'Alex Johnson')
 */
export function getUserInitials(name = '') {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Authenticates user credentials against the stored user database.
 * Sets the active session in storage on success.
 *
 * @param {string} email - User campus email
 * @param {string} password - User password
 * @returns {AuthResult} Authentication result with user session or error message
 */
export function login(email, password) {
  ensureDefaultUsers();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = password || '';

  if (!cleanEmail) {
    return { success: false, message: 'Please enter your campus email address.' };
  }
  if (!cleanPass) {
    return { success: false, message: 'Please enter your password.' };
  }

  const users = getStoredUsers();
  const found = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!found) {
    return {
      success: false,
      message: 'No account found with this email. Please check your spelling or create an account.',
    };
  }

  if (found.password !== cleanPass) {
    return {
      success: false,
      message: 'Incorrect password. Please try again or use a demo account.',
    };
  }

  // Create session object (omit password)
  const sessionUser = {
    id: found.id,
    name: found.name,
    email: found.email,
    role: found.role || 'Student',
    studentId: found.studentId || '',
    phone: found.phone || '',
    avatarBg: found.avatarBg || '#2563EB',
    loginAt: new Date().toISOString(),
  };

  saveCurrentUserSession(sessionUser);
  return { success: true, user: sessionUser };
}

/**
 * Registers a new campus user account and immediately starts an authenticated session.
 *
 * @param {Object} userData - User registration payload
 * @param {string} userData.name - Full user name
 * @param {string} userData.email - Campus email address
 * @param {string} userData.password - Desired account password
 * @param {string} [userData.studentId] - Student or staff ID badge number
 * @param {string} [userData.phone] - Contact telephone number
 * @param {'Student'|'Faculty'|'Staff'} [userData.role='Student'] - Campus role
 * @returns {AuthResult} Result object containing the new session user or error
 */
export function register({ name, email, password, studentId, phone, role }) {
  ensureDefaultUsers();

  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = password || '';

  if (!cleanName || cleanName.length < 2) {
    return { success: false, message: 'Please enter your full name (at least 2 characters).' };
  }
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }
  if (!cleanPass || cleanPass.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long.' };
  }

  const users = getStoredUsers();
  const exists = users.some(u => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    return {
      success: false,
      message: 'An account with this email already exists. Please sign in instead.',
    };
  }

  const roleColors = {
    Student: '#2563EB',
    Faculty: '#7C3AED',
    Staff: '#0D9488',
  };

  const newUser = {
    id: 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: cleanName,
    email: cleanEmail,
    password: cleanPass,
    role: role || 'Student',
    studentId: (studentId || '').trim(),
    phone: (phone || '').trim(),
    avatarBg: roleColors[role] || '#2563EB',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveStoredUsers(users);

  // Automatically log in
  const sessionUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    studentId: newUser.studentId,
    phone: newUser.phone,
    avatarBg: newUser.avatarBg,
    loginAt: new Date().toISOString(),
  };

  saveCurrentUserSession(sessionUser);
  return { success: true, user: sessionUser };
}

/**
 * Terminates the current user session and redirects to the login screen.
 *
 * @param {string} [redirectTarget=''] - Optional post-login return path
 */
export function logout(redirectTarget = '') {
  clearCurrentUserSession();
  const url = redirectTarget
    ? `login.html?redirect=${encodeURIComponent(redirectTarget)}`
    : 'login.html';
  window.location.href = url;
}

/**
 * Route guard for Vanilla JS multi-page navigation.
 * Redirects unauthenticated visitors to login.html while saving the target return URL.
 *
 * @returns {boolean} True if authorized, false if redirected
 */
export function requireAuth() {
  if (!isAuthenticated()) {
    const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
    const currentSearch = window.location.search || '';
    const returnTarget = encodeURIComponent(currentPath + currentSearch);
    window.location.replace(`login.html?redirect=${returnTarget}`);
    return false;
  }
  return true;
}

/**
 * Route guard for the login page.
 * If user is already authenticated, redirects them to their intended destination or dashboard.
 *
 * @param {string} [defaultUrl='dashboard.html'] - Fallback redirection page
 * @returns {boolean} True if redirected away from login, false if visitor is a guest
 */
export function redirectIfAuthenticated(defaultUrl = 'dashboard.html') {
  if (isAuthenticated()) {
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get('redirect');
    const destination = redirectUrl ? decodeURIComponent(redirectUrl) : defaultUrl;
    window.location.replace(destination);
    return true;
  }
  return false;
}

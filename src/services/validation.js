/**
 * TraceIt — Form Validation Engine
 * validation.js
 *
 * Client-side validation with per-field rules, live error feedback,
 * accessible ARIA states, and CSS class toggling.
 *
 * @module ValidationEngine
 */

import { $ } from './utils.js';

/**
 * @typedef {Object} FieldConfig
 * @property {HTMLElement} field - Form input, select, or textarea element
 * @property {string[]} rules - Array of rule names to evaluate (e.g. ['required', 'email'])
 * @property {Object<string, *>} [params] - Optional rule parameters (e.g. { minLength: 5 })
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether all configured fields passed validation
 * @property {Object<string, string>} errors - Map of field name/id to first failing error message
 */

// ── Rule Definitions ───────────────────────────────────────
/**
 * Dictionary of validation validator functions.
 * Each returns true if valid, or an error string if invalid.
 * @constant {Object<string, Function>}
 */
const RULES = {
  /**
   * Checks that string has non-whitespace characters.
   * @param {string} value
   * @returns {true|string}
   */
  required: (value) =>
    value.trim().length > 0 || 'This field is required.',

  /**
   * Enforces minimum character count.
   * @param {string} value
   * @param {number} min
   * @returns {true|string}
   */
  minLength: (value, min) =>
    value.trim().length >= min || `Minimum ${min} characters required.`,

  /**
   * Enforces maximum character count.
   * @param {string} value
   * @param {number} max
   * @returns {true|string}
   */
  maxLength: (value, max) =>
    value.trim().length <= max || `Maximum ${max} characters allowed.`,

  /**
   * Validates standard email address format.
   * @param {string} value
   * @returns {true|string}
   */
  email: (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ||
    'Please enter a valid email address.',

  /**
   * Validates telephone number format (7 to 15 digits, allowed +, -, (), spaces).
   * @param {string} value
   * @returns {true|string}
   */
  phone: (value) =>
    /^[+]?[\d\s\-().]{7,15}$/.test(value.trim()) ||
    'Please enter a valid phone number.',

  /**
   * Validates past/current calendar date.
   * @param {string} value
   * @returns {true|string}
   */
  date: (value) => {
    const d = new Date(value);
    return (!isNaN(d.getTime()) && d <= new Date()) ||
      'Please enter a valid date (not in the future).';
  },

  /**
   * Validates any valid calendar date string.
   * @param {string} value
   * @returns {true|string}
   */
  futureDate: (value) => {
    const d = new Date(value);
    return !isNaN(d.getTime()) || 'Please enter a valid date.';
  },

  /**
   * Enforces a minimum number of space-separated words.
   * @param {string} value
   * @param {number} min
   * @returns {true|string}
   */
  minWords: (value, min) => {
    const words = value.trim().split(/\s+/).filter(Boolean);
    return words.length >= min || `Please provide at least ${min} words.`;
  },

  /**
   * Evaluates input against a custom regular expression pattern.
   * @param {string} value
   * @param {RegExp|string} regex
   * @param {string} [msg='Invalid format.']
   * @returns {true|string}
   */
  pattern: (value, regex, msg = 'Invalid format.') =>
    new RegExp(regex).test(value.trim()) || msg,
};

// ── Internal Helpers ───────────────────────────────────────
/**
 * Locates or dynamically generates the error message container for a field.
 *
 * @param {HTMLElement} field - Form control
 * @returns {HTMLElement} Error element container
 */
function getErrorEl(field) {
  // Check for explicit error container first
  const explicit = field.closest('.form-group')?.querySelector('[data-error]');
  if (explicit) return explicit;

  // Auto-create one
  let el = field.parentElement?.querySelector('.form-error');
  if (!el) {
    el = document.createElement('span');
    el.className = 'form-error';
    el.setAttribute('role', 'alert');
    field.after(el);
  }
  return el;
}

/**
 * Sets error state on an input field and displays message.
 *
 * @param {HTMLElement} field - Form control
 * @param {string} message - Error description
 */
function setFieldError(field, message) {
  field.classList.add('is-invalid');
  field.classList.remove('is-valid');
  field.setAttribute('aria-invalid', 'true');

  const errorEl = getErrorEl(field);
  errorEl.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    ${message}
  `;
  errorEl.style.display = 'flex';
}

/**
 * Clears error state from an input field and marks as valid.
 *
 * @param {HTMLElement} field - Form control
 */
function clearFieldError(field) {
  field.classList.remove('is-invalid');
  field.classList.add('is-valid');
  field.setAttribute('aria-invalid', 'false');

  const errorEl = getErrorEl(field);
  errorEl.textContent = '';
  errorEl.style.display = 'none';
}

/**
 * Extracts string value from form inputs safely, handling checkboxes.
 *
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} field
 * @returns {string}
 */
function getFieldValue(field) {
  if (field.type === 'checkbox') return field.checked ? 'true' : '';
  return field.value ?? '';
}

// ── Core Validation Function ───────────────────────────────
/**
 * Evaluates validation rules against a batch of configured fields.
 *
 * @param {FieldConfig[]} fieldConfigs - Array of field configs
 * @returns {ValidationResult} Validation result summary
 *
 * @example
 * const { valid, errors } = validate([
 *   { field: document.getElementById('name'), rules: ['required', 'minLength'], params: { minLength: 3 } },
 *   { field: document.getElementById('email'), rules: ['required', 'email'] },
 * ]);
 */
export function validate(fieldConfigs) {
  const errors = {};
  let valid = true;

  for (const config of fieldConfigs) {
    const { field, rules = [], params = {} } = config;
    if (!field) continue;

    const value  = getFieldValue(field);
    let hasError = false;

    for (const rule of rules) {
      if (!RULES[rule]) continue;
      const result = RULES[rule](value, params[rule]);

      if (result !== true) {
        setFieldError(field, result);
        errors[field.name || field.id || rule] = result;
        hasError = true;
        valid    = false;
        break; // show one error at a time per field
      }
    }

    if (!hasError) clearFieldError(field);
  }

  return { valid, errors };
}

// ── Live Validation Attachment ─────────────────────────────
/**
 * Attaches real-time validation listeners to a form field on 'blur' and 'input' events.
 *
 * @param {HTMLElement} field - Input element
 * @param {string[]} rules - Array of rule names
 * @param {Object} [params={}] - Optional rule parameter map
 */
export function attachLiveValidation(field, rules, params = {}) {
  const validate_field = () => validate([{ field, rules, params }]);

  field.addEventListener('blur',  validate_field);
  field.addEventListener('input', () => {
    // Only re-validate after first blur
    if (field.classList.contains('is-invalid') || field.classList.contains('is-valid')) {
      validate_field();
    }
  });
}

// ── Form-Level Validation ──────────────────────────────────
/**
 * Validates all fields within a form.
 * If errors are detected, automatically scrolls smoothly to the first invalid field and focuses it.
 *
 * @param {FieldConfig[]} fieldConfigs - Form field configurations
 * @returns {ValidationResult}
 */
export function validateForm(fieldConfigs) {
  const result = validate(fieldConfigs);

  if (!result.valid) {
    // Find first invalid field and scroll to it
    const firstInvalid = fieldConfigs
      .map(c => c.field)
      .find(f => f?.classList.contains('is-invalid'));

    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.focus();
    }
  }

  return result;
}

// ── Reset Validation ───────────────────────────────────────
/**
 * Clears all validation states, CSS invalid/valid classes, and error messages from a form.
 *
 * @param {HTMLFormElement} form - Form element to reset
 */
export function resetValidation(form) {
  form?.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
    el.classList.remove('is-invalid', 'is-valid');
    el.removeAttribute('aria-invalid');
  });
  form?.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

// ── Convenience: Build fieldConfig from data attributes ────
/**
 * Auto-generates fieldConfigs for all form inputs having `data-validate` attributes.
 *
 * @param {HTMLFormElement} form - Parent form element
 * @returns {FieldConfig[]} Parsed field configurations
 *
 * @example
 * // HTML: <input name="username" data-validate="required minLength" data-min-length="3">
 * const configs = buildFieldConfigs(myForm);
 */
export function buildFieldConfigs(form) {
  return [...form.querySelectorAll('[data-validate]')].map(field => {
    const rules  = field.dataset.validate.split(/\s+/);
    const params = {};
    if (field.dataset.minLength) params.minLength = parseInt(field.dataset.minLength);
    if (field.dataset.maxLength) params.maxLength = parseInt(field.dataset.maxLength);
    if (field.dataset.minWords)  params.minWords  = parseInt(field.dataset.minWords);
    return { field, rules, params };
  });
}

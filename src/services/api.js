/**
 * TraceIt — Quotable API Integration
 * api.js
 *
 * Fetches motivational quotes for the dashboard widget.
 * Implements resilient network communication with exponential backoff retries,
 * client-side in-memory caching, and an offline fallback catalog.
 *
 * @module ApiService
 */

// ── Config ─────────────────────────────────────────────────
/**
 * Remote Quotable API endpoint.
 * @constant {string}
 */
const QUOTE_API = 'https://api.quotable.io/random?maxLength=150&tags=technology,business,success,motivational';

/**
 * Curated offline fallback quotes used when network requests fail.
 * @constant {Array<{ content: string, author: string }>}
 */
const FALLBACK_QUOTES = [
  { content: 'Lost something? Don\'t worry — someone out there found it. TraceIt connects them.', author: 'TraceIt Team' },
  { content: 'Honesty is the first chapter in the book of wisdom.', author: 'Thomas Jefferson' },
  { content: 'No act of kindness, no matter how small, is ever wasted.', author: 'Aesop' },
  { content: 'The strength of the community is each individual member.', author: 'Frank Lambert' },
  { content: 'One kind word can warm three winter months.', author: 'Japanese Proverb' },
  { content: 'Technology is best when it brings people together.', author: 'Matt Mullenweg' },
];

let lastFetchedAt = 0;
let cachedQuote   = null;

// ── Retry with Exponential Backoff ─────────────────────────
/**
 * Performs an HTTP fetch with an AbortController timeout and exponential backoff.
 *
 * @param {string} url - Target URL to request
 * @param {number} [maxRetries=3] - Maximum retry attempts
 * @param {number} [baseDelay=500] - Base delay in milliseconds
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Error} When all attempts are exhausted
 */
async function fetchWithRetry(url, maxRetries = 3, baseDelay = 500) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();

    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt); // 500, 1000, 2000ms
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// ── Random Fallback Quote ──────────────────────────────────
/**
 * Picks a random quote from the offline fallback catalog.
 *
 * @returns {{ content: string, author: string }} Fallback quote
 */
function getFallbackQuote() {
  return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
}

// ── Main Export ────────────────────────────────────────────
/**
 * Fetches a motivational quote. Uses a 10-minute cache to avoid rate limits.
 *
 * @param {Object} [options={}]
 * @param {boolean} [options.force=false] - If true, bypasses in-memory cache
 * @returns {Promise<{ content: string, author: string, fromCache?: boolean, fromFallback?: boolean }>} Quote payload
 */
export async function fetchQuote({ force = false } = {}) {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;

  // Return cache if fresh
  if (!force && cachedQuote && (now - lastFetchedAt) < TEN_MINUTES) {
    return { ...cachedQuote, fromCache: true };
  }

  try {
    const data = await fetchWithRetry(QUOTE_API);
    cachedQuote   = { content: data.content, author: data.author };
    lastFetchedAt = now;
    return { ...cachedQuote };

  } catch (err) {
    console.error('[API] Quote fetch failed:', err.message);
    // Return fallback without caching (try again next time)
    return { ...getFallbackQuote(), fromFallback: true };
  }
}

// ── Quote Widget Renderer ──────────────────────────────────
/**
 * Renders the quote widget inside a target DOM container.
 * Shows loading spinner during request, and an interactive retry button on error.
 *
 * @param {HTMLElement} container - Target container element
 * @returns {Promise<void>}
 */
export async function renderQuoteWidget(container) {
  if (!container) return;

  // Show loading state
  container.innerHTML = `
    <div class="quote-widget__loader">
      <div class="spinner spinner--sm" style="border-color:rgba(255,255,255,0.3);border-top-color:white;"></div>
      <span>Loading inspiration...</span>
    </div>
  `;

  try {
    const quote = await fetchQuote();

    container.innerHTML = `
      <p class="quote-widget__text" id="quote-text">"${quote.content}"</p>
      <div class="quote-widget__footer">
        <p class="quote-widget__author">— ${quote.author}</p>
        <button class="quote-retry-btn" id="quote-refresh" aria-label="Load new quote">
          ↻ New Quote
        </button>
      </div>
    `;

    // Wire up refresh button
    container.querySelector('#quote-refresh')?.addEventListener('click', async () => {
      await renderQuoteWidget(container);
    });

  } catch {
    container.innerHTML = `
      <p class="quote-widget__text">"Could not load quote. Stay motivated!"</p>
      <div class="quote-widget__footer">
        <p class="quote-widget__author">— TraceIt</p>
        <button class="quote-retry-btn" id="quote-retry" aria-label="Retry loading quote">
          ↻ Retry
        </button>
      </div>
    `;

    container.querySelector('#quote-retry')?.addEventListener('click', async () => {
      await renderQuoteWidget(container);
    });
  }
}

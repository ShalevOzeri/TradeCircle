/**
 * timeAgo — converts an ISO date string to a human-readable relative time.
 * Works in both web and React Native (no DOM dependency).
 */
function timeAgo(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

/**
 * initials — returns up to 2 uppercase initials from a full name.
 */
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * formatPrice — adaptive decimal precision for financial values.
 * Handles null/undefined gracefully (returns "—").
 */
function formatPrice(value) {
  if (value == null) return '—';
  if (value < 1) return value.toFixed(4);
  if (value < 100) return value.toFixed(2);
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

module.exports = { timeAgo, initials, formatPrice };

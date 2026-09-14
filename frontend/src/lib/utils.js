/**
 * Utility helper functions for SIH26013 Frontend
 */
export function formatTimestamp(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString();
}

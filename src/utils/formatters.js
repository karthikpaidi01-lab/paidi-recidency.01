/**
 * Formatting helpers for currency, dates, and references
 */

/**
 * Format a number into Indian Rupee currency (e.g. ₹2,500)
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format an ISO date string (YYYY-MM-DD) into an elegant display date (e.g., "30 Oct 2026")
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) {
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format an ISO date string into short day + month (e.g., "30 Oct")
 */
export function formatDateShort(dateString) {
  if (!dateString) return '—';
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateString;
  }
}

/**
 * Return today's date formatted as YYYY-MM-DD
 */
export function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Return date after N days from today or a given date formatted as YYYY-MM-DD
 */
export function getFutureDateString(daysAhead = 1, fromDate = null) {
  const base = fromDate ? new Date(fromDate) : new Date();
  base.setDate(base.getDate() + daysAhead);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate a unique booking reference like "BK-7489"
 */
export function generateBookingRef() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BK-${random}`;
}

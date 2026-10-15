import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function convertToAED(usdAmount, rate = 3.67) {
  return (usdAmount * rate).toFixed(2);
}

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const formatPrice = (price) => {
    return new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED',
    }).format(price);
};

/**
 * A price the way a card should show it: decimals only when they carry meaning,
 * so 70 reads "AED 70" and 578.1 reads "AED 578.10", never "AED 578.1".
 * Deterministic (no Intl locale data), so server and browser render the same text.
 */
export const formatAED = (amount) => {
    const value = Number(amount) || 0;
    return `AED ${Number.isInteger(value) ? value : value.toFixed(2)}`;
};

export const truncateText = (text, maxLength = 48) => {
    if (!text) return '';
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength) + '....';
};

export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) {
    return 'now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks}w ago`;
  }

  const months = Math.floor(days / 30); // Approximation
  if (months < 12) {
    return `${months}mo ago`;
  }

  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

// Honest bucketing — only shows "N+" once the real count has actually reached
// that threshold (never rounds a real number up past what it is).
export function viewCountLabel(n) {
  if (n >= 500) return '500+';
  if (n >= 100) return '100+';
  if (n >= 50) return '50+';
  if (n >= 25) return '25+';
  if (n >= 10) return '10+';
  return String(n);
}

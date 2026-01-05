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

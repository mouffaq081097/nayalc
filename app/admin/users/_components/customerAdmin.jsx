'use client';
import React from 'react';
import { toast } from 'react-toastify';
import { apiErrorMessage } from '../../products/_components/productAdmin';

// Shared helpers for the admin customer list and customer page

export const customerName = (c) => [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || c.email || 'Unnamed customer';

export const customerLocation = (c) => [c.city, c.country].filter(Boolean).join(', ');

export const fmtDate = (value) => (value
  ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—');

export function timeAgo(value) {
  if (!value) return '—';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

export function orderStatusBadge(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'delivered') return { label: 'Delivered', cls: 'sp-badge-success' };
  if (s === 'cancelled') return { label: 'Cancelled', cls: 'sp-badge-neutral' };
  if (s === 'shipped') return { label: 'Shipped', cls: 'sp-badge-info' };
  if (s === 'processing') return { label: 'Processing', cls: 'sp-badge-info' };
  if (s === 'payment failed') return { label: 'Payment failed', cls: 'sp-badge-critical' };
  return { label: status || 'Pending', cls: 'sp-badge-warning' };
}

const AVATAR_COLORS = [
  ['#e0f0ff', '#00527c'], ['#fde8d7', '#8a3b00'], ['#e3f5e1', '#0c5132'],
  ['#f3e8ff', '#5b21b6'], ['#fff4cc', '#5e4200'], ['#ffe4e6', '#8e0b21'],
];

export const CustomerAvatar = ({ customer, size = 36 }) => {
  if (customer.profile_image) {
    return <img src={customer.profile_image} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  }
  const letters = ([customer.first_name, customer.last_name].filter(Boolean).map(p => p[0]).join('') || customer.email?.[0] || '?')
    .slice(0, 2)
    .toUpperCase();
  const [background, color] = AVATAR_COLORS[Number(customer.id) % AVATAR_COLORS.length];
  return (
    <span
      className="rounded-full shrink-0 flex items-center justify-center font-semibold"
      style={{ width: size, height: size, background, color, fontSize: Math.round(size * 0.38) }}
      aria-hidden
    >
      {letters}
    </span>
  );
};

// Confirms, then grants or removes admin access. Resolves true when the change was saved.
export async function changeAdminAccess(fetchWithAuth, customer) {
  const name = customerName(customer);
  const makeAdmin = !customer.is_admin;
  const question = makeAdmin
    ? `Give ${name} admin access? They'll be able to manage orders, products and customers. It takes effect the next time they sign in.`
    : `Remove ${name}'s admin access? It takes effect the next time they sign in.`;
  if (!window.confirm(question)) return false;
  try {
    await fetchWithAuth(`/api/admin/users/${customer.id}/role`, { method: 'PUT', body: JSON.stringify({ is_admin: makeAdmin }) });
    toast.success(makeAdmin ? `${name} is now an admin` : `${name} is no longer an admin`);
    return true;
  } catch (error) {
    toast.error(apiErrorMessage(error, 'Admin access could not be changed.'));
    return false;
  }
}

// Confirms, then suspends or reinstates the account. Suspending only blocks sign-in; no data is removed.
export async function changeSuspension(fetchWithAuth, customer) {
  const name = customerName(customer);
  const suspend = !customer.is_suspended;
  const question = suspend
    ? `Suspend ${name}? They won't be able to sign in until you reinstate the account. Their orders, addresses and history are kept.`
    : `Reinstate ${name}? They'll be able to sign in again.`;
  if (!window.confirm(question)) return false;
  try {
    await fetchWithAuth(`/api/admin/users/${customer.id}/suspend`, { method: 'PUT', body: JSON.stringify({ is_suspended: suspend }) });
    toast.success(suspend ? `${name} is suspended` : `${name} is reinstated`);
    return true;
  } catch (error) {
    toast.error(apiErrorMessage(error, 'The account could not be updated.'));
    return false;
  }
}

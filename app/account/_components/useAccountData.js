'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { useUser } from '../../context/UserContext';

/*
 * Orders, wishlist and points for the account pages, shared by every caller and
 * kept for the whole browser session: coming back to the account shows the last
 * copy straight away and refreshes it in the background, instead of a full-page
 * loader on every visit. The layout and the page used to fetch it separately too;
 * now concurrent callers share one request.
 */

const EMPTY_LOYALTY = { stats: { points: 0, tier: 'Silver', nextTierPoints: 2000 }, transactions: [] };
const EMPTY_DATA = { orders: [], wishlistItems: [], loyaltyData: EMPTY_LOYALTY };
const FRESH_MS = 15_000; // callers mounting within this window reuse the copy without refetching

const store = { userId: null, data: null, fetchedAt: 0, inflight: null };
const listeners = new Set();

function publish(data) {
  store.data = data;
  store.fetchedAt = Date.now();
  listeners.forEach((fn) => fn(data));
}

function load(userId, fetchWithAuth) {
  if (store.userId !== userId) {
    // A different (or newly signed-in) customer — never show someone else's data
    store.userId = userId;
    store.data = null;
    store.fetchedAt = 0;
    store.inflight = null;
  }
  if (store.inflight) return store.inflight;
  if (store.data && Date.now() - store.fetchedAt < FRESH_MS) return Promise.resolve(store.data);

  const request = Promise.all([
    fetchWithAuth(`/api/orders?userId=${userId}&statusFilter=all&limit=100`)
      .then((res) => res.json())
      .catch(() => ({ orders: [] })),
    fetchWithAuth(`/api/wishlist?userId=${userId}`)
      .then((res) => res.json())
      .catch(() => ({ wishlist: [] })),
    fetchWithAuth(`/api/users/${userId}/loyalty`)
      .then((res) => res.json())
      .catch(() => EMPTY_LOYALTY),
  ])
    .then(([ordersRes, wishlistRes, loyaltyRes]) => {
      const data = {
        orders: ordersRes.orders || [],
        wishlistItems: wishlistRes.wishlist || [],
        loyaltyData: loyaltyRes || EMPTY_LOYALTY,
      };
      if (store.userId === userId) publish(data);
      return data;
    })
    .finally(() => {
      if (store.inflight === request) store.inflight = null;
    });

  store.inflight = request;
  return request;
}

/** Call after changing orders, wishlist or points so the next account page refetches. */
export function markAccountDataStale() {
  store.fetchedAt = 0;
}

export function useAccountData() {
  const { user } = useAuth();
  const { fetchWithAuth } = useAppContext();
  const { shippingAddresses } = useUser();

  const [data, setData] = useState(() => (user && store.userId === user.id ? store.data : null));

  useEffect(() => {
    if (!user) return;
    listeners.add(setData);
    if (store.userId === user.id && store.data) setData(store.data);
    load(user.id, fetchWithAuth).then((d) => { if (store.userId === user.id) setData(d); }).catch(() => {});
    return () => { listeners.delete(setData); };
  }, [user, fetchWithAuth]);

  const current = data || EMPTY_DATA; // one stable object, so effects keyed on these lists don't loop
  const result = useMemo(
    () => ({
      orders: current.orders,
      wishlistItems: current.wishlistItems,
      addresses: shippingAddresses,
      loyaltyData: current.loyaltyData,
    }),
    [current.orders, current.wishlistItems, current.loyaltyData, shippingAddresses],
  );

  // Loading only until the first copy arrives; later visits refresh silently
  return { user, isLoading: !!user && !data, ...result };
}

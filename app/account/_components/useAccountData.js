'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { useUser } from '../../context/UserContext';

export function useAccountData() {
  const { user } = useAuth();
  const { fetchWithAuth } = useAppContext();
  const { shippingAddresses } = useUser();

  const [orders, setOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loyaltyData, setLoyaltyData] = useState({
    stats: { points: 0, tier: 'Silver', nextTierPoints: 2000 },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [ordersRes, wishlistRes, loyaltyRes] = await Promise.all([
          fetchWithAuth(`/api/orders?userId=${user.id}`)
            .then((res) => res.json())
            .catch(() => ({ orders: [] })),
          fetchWithAuth(`/api/wishlist?userId=${user.id}`)
            .then((res) => res.json())
            .catch(() => ({ wishlist: [] })),
          fetchWithAuth(`/api/users/${user.id}/loyalty`)
            .then((res) => res.json())
            .catch(() => ({
              stats: { points: 1250, tier: 'Silver', nextTierPoints: 2000 },
            })),
        ]);

        if (cancelled) return;
        setOrders(ordersRes.orders || []);
        setWishlistItems(wishlistRes.wishlist || []);
        setLoyaltyData(loyaltyRes);
      } catch {
        if (cancelled) return;
      } finally {
        if (cancelled) return;
        setIsLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [user, fetchWithAuth]);

  const data = useMemo(
    () => ({ orders, wishlistItems, addresses: shippingAddresses, loyaltyData }),
    [orders, wishlistItems, shippingAddresses, loyaltyData],
  );

  return { user, isLoading, ...data };
}


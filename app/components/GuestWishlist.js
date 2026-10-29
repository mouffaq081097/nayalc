'use client';

import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { readGuestWishlist, clearGuestWishlist } from '@/lib/guestWishlist';

/**
 * Signed out, a heart saves to this browser (lib/guestWishlist.js) and this
 * toast offers to sign in so the list follows the shopper to other devices.
 */
export function guestSavedToast({ t, rich, openSignIn }) {
  toast(
    <span className="text-[13.5px] leading-snug">
      {rich('Saved to your wishlist. {signIn} to keep it on every device.', {
        signIn: (
          <button type="button" onClick={() => openSignIn()} className="font-semibold underline underline-offset-2">
            {t('Sign in')}
          </button>
        ),
      })}
    </span>,
    { toastId: 'guest-wishlist' },
  );
}

/** At sign-in, moves the products saved while signed out into the account's wishlist. */
export default function GuestWishlistSync() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return undefined;
    const ids = readGuestWishlist();
    if (!ids.length) return undefined;
    let cancelled = false;
    (async () => {
      for (const productId of ids) {
        // 409 = already in the account's wishlist, which is fine
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, productId }),
        }).catch(() => {});
      }
      if (!cancelled) clearGuestWishlist();
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  return null;
}

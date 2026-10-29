'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AccountPage, { OUTLINE_PILL, SOLID_PILL, Spinner } from '../account/_components/AccountPage';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useSignIn } from '../context/SignInContext';
import { readGuestWishlist, GUEST_WISHLIST_EVENT } from '@/lib/guestWishlist';

/**
 * The wishlist for everyone (the phone menu links here). Signed in, it is the
 * account's wishlist page (/account/wishlist). Signed out, the products hearted
 * in this browser (lib/guestWishlist.js), with a prompt to sign in so they
 * follow the shopper to other devices; GuestWishlistSync moves them across.
 */
export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { products, loading } = useAppContext();
  const { openSignIn } = useSignIn();
  const [ids, setIds] = useState(null);

  useEffect(() => {
    if (isAuthenticated) router.replace('/account/wishlist');
  }, [isAuthenticated, router]);

  useEffect(() => {
    const sync = () => setIds(readGuestWishlist());
    sync();
    window.addEventListener(GUEST_WISHLIST_EVENT, sync);
    return () => window.removeEventListener(GUEST_WISHLIST_EVENT, sync);
  }, []);

  // The live catalogue copy of each saved product, newest saved first
  const items = useMemo(
    () => (ids || []).map((id) => products.find((p) => Number(p.id) === id)).filter(Boolean),
    [ids, products]
  );
  const waiting = authLoading || isAuthenticated || ids === null || (loading && !products.length);

  return (
    <AccountPage
      title="Your wishlist"
      subtitle={!waiting && items.length > 0 ? `${items.length} saved product${items.length === 1 ? '' : 's'}` : undefined}
      back={{ href: '/all-products', label: 'Back to shopping' }}
      action={!waiting && items.length > 0 ? (
        <button type="button" onClick={() => openSignIn('/account/wishlist')} className={OUTLINE_PILL}>Sign in</button>
      ) : undefined}
    >
      {waiting ? <Spinner /> : items.length === 0 ? (
        <div className="mt-8 rounded-md bg-[#f6f5f2] py-14 px-6 text-center">
          <p className="text-[16px]">Your wishlist is empty.</p>
          <p className="mt-1 text-[14px] text-[#6b6b72]">Tap the heart on any product to save it here. No account needed.</p>
          <Link href="/all-products" className={`${SOLID_PILL} mt-6`}>Explore products</Link>
        </div>
      ) : (
        <>
          <p className="mt-6 text-[14px] text-[#6b6b72]">
            Saved in this browser. <button type="button" onClick={() => openSignIn('/account/wishlist')} className="text-[#111114] underline underline-offset-2">Sign in</button> to keep your wishlist on every device.
          </p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {items.map((p) => (
              <ProductCard key={p.id} {...p} image={p.imageUrl} initialWishlisted />
            ))}
          </div>
        </>
      )}
    </AccountPage>
  );
}

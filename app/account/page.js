'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { Package, Heart, MapPin, UserRound, Settings, Headset, Camera, ShoppingBag, Gift, TrendingUp, Check, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useAccountData } from './_components/useAccountData';
import { statusMeta } from './_components/orderStatus';
import { JournalSection } from '../components/JournalSection';
import { formatAED } from '../lib/utils';
import { TIERS, AED_PER_POINT, POINTS_BLOCK, AED_PER_BLOCK, WELCOME_BONUS_POINTS, pointsToAed } from '@/lib/loyalty';

/**
 * My account (after Pitaka): a greeting column on the left, the points balance
 * with a link to Naya Rewards, icon links to every account page and the latest
 * orders; then membership tiers, ways to earn points and the journal.
 * Every figure comes from lib/loyalty.js and the customer's own data.
 */

const LAVENDER = 'rgb(147,104,236)';

const BigTitle = ({ children, className = '' }) => (
  <h2 className={`pb-4 md:pb-5 border-b border-[#111114] text-[28px] md:text-[42px] leading-tight tracking-tight ${className}`}>{children}</h2>
);

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export default function AccountPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { setIsChatOpen, fetchWithAuth } = useAppContext();
  const { update } = useSession();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const { user, orders, wishlistItems, loyaltyData } = useAccountData();

  const stats = loyaltyData?.stats || {};
  const points = Number(stats.points) || 0;
  const tierName = stats.tier || 'Silver';
  const spend = Number(stats.lifetimeSpend) || 0;
  const tierIdx = Math.max(0, TIERS.findIndex((t) => t.name === tierName));
  const nextTier = TIERS[tierIdx + 1];
  const bonusEarned = (loyaltyData?.transactions || []).some((t) => t.type === 'bonus');
  const recent = [...(orders || [])]
    .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
    .slice(0, 3);
  const wishCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  const links = [
    { label: 'Orders', href: '/account/orders', Icon: Package },
    { label: 'Wishlist', href: '/account/wishlist', Icon: Heart, count: wishCount },
    { label: 'Addresses', href: '/account/addresses', Icon: MapPin },
    { label: 'Profile', href: '/account/profile', Icon: UserRound },
    { label: 'Settings', href: '/account/settings', Icon: Settings },
    { label: 'Support', onClick: () => setIsChatOpen?.(true), Icon: Headset },
  ];

  // Same upload as the Profile page: Cloudinary via /profile-image, then the session picks up the new photo
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB.'); return; }
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await fetchWithAuth(`/api/users/${user.id}/profile-image`, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      await update({ profile_image: data.imageUrl });
      toast.success('Photo updated!');
    } catch { toast.error('Upload failed.'); }
    finally { setUploading(false); }
  };

  if (!user) return null;

  return (
    <div className="bg-white text-[#111114]">
      <div className="max-w-[1320px] mx-auto px-5 md:px-10 pt-8 md:pt-14">

        {/* ── Greeting | points, links, latest orders ── */}
        <div className="grid md:grid-cols-[260px_1fr] lg:grid-cols-[320px_1fr]">
          <aside className="flex items-center gap-5 md:block pb-6 md:pb-0 md:pr-10 md:border-r md:border-[#111114]">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Change profile photo"
              className="relative w-[76px] h-[76px] md:w-[140px] md:h-[140px] shrink-0 group"
            >
              <span className="absolute inset-0 rounded-full overflow-hidden bg-[#efedea] flex items-center justify-center">
                {user.profile_image
                  ? <Image src={user.profile_image} alt="" fill sizes="140px" className="object-cover" />
                  : <UserRound strokeWidth={1.25} className="w-[46%] h-[46%] text-[#8c8480]" />}
                {uploading && (
                  <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </span>
                )}
              </span>
              {/* Always visible — phones have no hover */}
              <span className="absolute right-0 bottom-0 md:right-1.5 md:bottom-1.5 w-7 h-7 md:w-9 md:h-9 rounded-full bg-[#111114] text-white flex items-center justify-center ring-2 ring-white group-hover:bg-[#2a2a31] transition-colors">
                <Camera className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={1.75} />
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <div className="min-w-0 md:mt-12">
              <h1 className="text-[28px] md:text-[42px] leading-tight tracking-tight truncate">Hi, {user.first_name || 'there'}</h1>
              <p className="text-[15px] md:text-[18px] text-[#6b6b73]">Welcome back!</p>
              <button
                type="button"
                onClick={() => { logout(); router.push('/'); }}
                className="mt-3 md:mt-12 text-[14px] text-[#6b6b73] underline underline-offset-4 hover:text-[#111114]"
              >
                Log out
              </button>
            </div>
          </aside>

          <div className="min-w-0 md:pl-10 border-t border-[#ececec] md:border-t-0">
            {/* Points */}
            <section className="py-10 md:py-16 text-center">
              <p className="text-[26px] md:text-[42px] leading-tight tracking-tight text-balance">
                You have <span style={{ color: LAVENDER }}>{points.toLocaleString()}</span> Naya points now.
              </p>
              <p className="mt-2 text-[14px] text-[#6b6b73]">
                {tierName} member{points >= POINTS_BLOCK ? ` · worth ${formatAED(pointsToAed(points))} at checkout` : ''}
              </p>
              <Link href="/account/loyalty" className="inline-block mt-6 px-7 py-2.5 rounded-full bg-[#111114] text-white text-[15px] hover:bg-[#2a2a31] transition-colors">
                Go to Naya Rewards
              </Link>
            </section>

            {/* Account pages */}
            <nav aria-label="My account" className="border-t border-[#111114] grid grid-cols-3 md:grid-cols-6 gap-y-8 py-10 md:py-14">
              {links.map(({ label, href, onClick, Icon, count }) => {
                const inner = (
                  <>
                    <span className="relative">
                      <Icon strokeWidth={1.1} className="w-10 h-10 md:w-12 md:h-12 text-[#4a4a52] group-hover:text-[#111114] transition-colors" />
                      <span className="absolute -right-1 -bottom-1 w-3 h-3 rounded-full" style={{ background: LAVENDER, opacity: 0.85 }} />
                      {count > 0 && (
                        <span className="absolute -top-1 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-[#111114] text-white text-[10px] font-semibold flex items-center justify-center">{count}</span>
                      )}
                    </span>
                    <span className="text-[15px] md:text-[17px] text-[#4a4a52] underline underline-offset-4 decoration-1 group-hover:text-[#111114]">{label}</span>
                  </>
                );
                const cls = 'group flex flex-col items-center gap-3';
                return href
                  ? <Link key={label} href={href} className={cls}>{inner}</Link>
                  : <button key={label} type="button" onClick={onClick} className={cls}>{inner}</button>;
              })}
            </nav>

            {/* Latest orders */}
            <section className="pb-4">
              <BigTitle className="pt-8 md:pt-10 border-t border-t-[#111114]">My orders</BigTitle>
              {recent.length === 0 ? (
                <p className="py-6 text-[15px] text-[#6b6b73]">
                  You haven&apos;t placed any orders yet. <Link href="/all-products" className="text-[#111114] underline underline-offset-4">Start shopping</Link>
                </p>
              ) : (
                <>
                  <ul className="divide-y divide-[#ececec]">
                    {recent.map((o) => {
                      const meta = statusMeta(o.status, o.awaitingStock);
                      const items = o.items || [];
                      return (
                        <li key={o.id}>
                          <Link href={`/account/orders/${o.id}`} className="flex items-center gap-4 py-5 group">
                            <div className="flex -space-x-3 shrink-0">
                              {items.slice(0, 3).map((it, i) => (
                                <span key={i} className="relative w-14 h-14 md:w-16 md:h-16 bg-[#f6f5f2] border-2 border-white">
                                  {it.imageUrl && <Image src={it.imageUrl} alt="" fill sizes="64px" className="object-contain p-1 mix-blend-multiply" />}
                                </span>
                              ))}
                              {items.length === 0 && <span className="w-14 h-14 md:w-16 md:h-16 bg-[#f6f5f2] flex items-center justify-center"><Package size={20} strokeWidth={1.25} className="text-gray-400" /></span>}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[15px] font-medium">Order #{o.id}</p>
                              <p className="text-[13px] text-[#6b6b73]">
                                {formatDate(o.createdAt || o.created_at)} · {items.length} {items.length === 1 ? 'item' : 'items'}
                              </p>
                            </div>
                            <span className={`hidden sm:inline-block shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${meta.badge}`}>{meta.label}</span>
                            <span className="shrink-0 text-[15px] tabular-nums">{formatAED(o.totalAmount ?? o.total_amount ?? 0)}</span>
                            <ChevronRight size={18} className="shrink-0 text-gray-400 group-hover:text-[#111114]" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <Link href="/account/orders" className="inline-block mt-2 text-[14px] underline underline-offset-4 decoration-gray-300 hover:decoration-[#111114]">
                    View all orders
                  </Link>
                </>
              )}
            </section>
          </div>
        </div>

        {/* ── Membership tiers ── */}
        <section className="pt-14 md:pt-20">
          <BigTitle>Membership tiers</BigTitle>
          <p className="mt-5 text-[14px] text-[#6b6b73]">
            You&apos;ve spent {formatAED(spend)} with us so far.
            {nextTier ? ` Spend ${formatAED(Math.max(0, nextTier.min - spend))} more to reach ${nextTier.name}.` : ' You are at our highest tier.'}
          </p>
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {TIERS.map((t, i) => {
              const current = i === tierIdx;
              return (
                <div key={t.name} className={`relative rounded-xl border p-5 md:p-7 text-center ${current ? 'border-[#111114]' : 'border-[#e5e5e5]'}`}>
                  {current && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#111114] text-white text-[11px]">Your tier</span>
                  )}
                  <p className="text-[16px] md:text-[18px] font-medium">{t.name}</p>
                  <p className="mt-3 text-[12px] text-[#8a8a92]">Goal</p>
                  <p className="text-[14px] md:text-[15px]">{t.min === 0 ? 'Your first order' : `Spend ${formatAED(t.min)}`}</p>
                  <p className="mt-2 text-[12px] text-[#8a8a92]">Reward</p>
                  <p className="text-[14px] md:text-[15px]">{t.multiplier === 1 ? '1 point per AED 5' : `${t.multiplier}× points on every order`}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Ways to earn ── */}
        <section className="pt-14 md:pt-20">
          <BigTitle>Ways to earn points</BigTitle>
          <div className="mt-8 rounded-xl border border-[#e5e5e5] px-6 py-5">
            <p className="text-[18px] font-medium">Your balance <span style={{ color: LAVENDER }}>{points.toLocaleString()}</span> points</p>
            <p className="mt-1 text-[13px] text-[#6b6b73]">Every {POINTS_BLOCK} points take AED {AED_PER_BLOCK} off at checkout.</p>
          </div>
          <div className="mt-3 md:mt-5 grid sm:grid-cols-3 gap-3 md:gap-5">
            {[
              { Icon: ShoppingBag, title: 'Place an order', text: `1 point for every AED ${AED_PER_POINT} spent on products` },
              { Icon: Gift, title: 'First order delivered', text: `${WELCOME_BONUS_POINTS} bonus points`, done: bonusEarned },
              { Icon: TrendingUp, title: 'Move up a tier', text: `Up to ${TIERS[TIERS.length - 1].multiplier}× points on every order` },
            ].map(({ Icon, title, text, done }) => (
              <div key={title} className={`rounded-xl border border-[#e5e5e5] px-6 py-7 text-center ${done ? 'bg-[#fafafa]' : ''}`}>
                <span className="mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ background: done ? '#e8f7ee' : 'rgba(147,104,236,0.1)' }}>
                  {done ? <Check size={22} className="text-[#22a35a]" /> : <Icon size={22} strokeWidth={1.5} style={{ color: LAVENDER }} />}
                </span>
                <p className="mt-4 text-[16px] font-medium">{title}</p>
                {done
                  ? <p className="mt-1.5 text-[14px] text-[#22a35a] inline-flex items-center gap-1"><Check size={14} /> Completed</p>
                  : <p className="mt-1.5 text-[14px] text-[#6b6b73]">{text}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Journal ── */}
      <div className="pt-6 md:pt-8 pb-8 md:pb-12">
        <JournalSection />
      </div>
    </div>
  );
}

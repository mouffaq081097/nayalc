'use client';

import { useState, useEffect, forwardRef } from 'react';
import { ShoppingBag, Search, Menu, X, User, ChevronRight, Star, ShieldCheck, ArrowRight, Droplets, Clock, Zap, Heart, Layers, Sun, Sparkles, Gift, LogOut, Package, MapPin, Settings } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from './BrandLogo';

const CONCERN_META = {
  'anti-aging':    { icon: Clock,     desc: 'Restore your youthful glow' },
  'hydration':     { icon: Droplets,  desc: 'Deep moisture, all day long' },
  'brightening':   { icon: Sun,       desc: 'Reveal luminous, even skin' },
  'acne':          { icon: Zap,       desc: 'Clear, balanced complexion' },
  'sensitive':     { icon: Heart,     desc: 'Gentle care for reactive skin' },
  'firming':       { icon: Layers,    desc: 'Lift and sculpt your contours' },
  'dark spots':    { icon: Sparkles,  desc: 'Even, radiant skin tone' },
  'gifting':       { icon: Gift,      desc: 'Luxury gifts for every occasion' },
};
function getConcernMeta(name = '') {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(CONCERN_META)) {
    if (key.includes(k)) return v;
  }
  return { icon: Sparkles, desc: 'Targeted skincare solutions' };
}

const NAV_LINKS = [
  { label: 'Shop',        href: '/all-products', hasDropdown: 'shop' },
  { label: 'Best Seller', href: '/all-products?bestseller=true', highlight: true },
  { label: 'Collections', href: '/collections' },
  { label: 'Skin Quiz',   href: '/skin-quiz' },
  { label: 'Brands',      href: '/brands', hasDropdown: 'brands' },
  { label: 'Journal',     href: '/journal' },
];

// Shared by the desktop Shop dropdown and the mobile Shop accordion so the two
// menus can't drift apart. Cosmetics has no landing page of its own — it points
// at the all-products list pre-filtered to the NAYA Lumiere Cosmetics brand,
// which AllProducts resolves case-insensitively against the brands it loaded.
const SHOP_LINKS = [
  { name: 'All Products', href: '/all-products' },
  { name: 'Skincare',     href: '/SkinCare' },
  { name: 'Cosmetics',    href: '/all-products?brand=NAYA%20Lumiere%20Cosmetics' },
  { name: 'Fragrance',    href: '/fragrance' },
  { name: 'New Arrivals', href: '/new-arrivals' },
];

// Fixed header height (also --header-h in globals.css, for layouts that offset around it)
export const HEADER_H = { mobile: 70, desktop: 88 };

const Header = forwardRef((_, ref) => {
  const [isMenuOpen,   setIsMenuOpen]   = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [pastHero,     setPastHero]     = useState(false);
  const [expandedMobileSection, setExpandedMobileSection] = useState(null);

  const { cartItems } = useCart();
  const { user, logout } = useAuth();
  const { loyaltyData, concerns, brands } = useAppContext();
  const router   = useRouter();
  const pathname = usePathname();

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const isHome = pathname === '/';
  const overHero = isHome && !pastHero && !isMenuOpen;

  // On the homepage, the header turns solid once the hero (#home-hero) is behind it
  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => {
      const hero = document.getElementById('home-hero');
      const headerH = window.innerWidth >= 768 ? HEADER_H.desktop : HEADER_H.mobile;
      setPastHero(window.scrollY > (hero ? hero.offsetHeight : window.innerHeight * 0.8) - headerH);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isHome]);

  // Collapse any open accordion section whenever the mobile sidebar closes
  useEffect(() => {
    if (!isMenuOpen) setExpandedMobileSection(null);
  }, [isMenuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  /* ── header icons: plain, in the header's own colour ──────────────── */
  const iconBtn = 'relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-70';
  // The drawer and search overlay keep their light, bordered buttons
  const panelBtn = 'relative w-[38px] h-[38px] rounded-full border border-[#e5e5ea] bg-white flex items-center justify-center text-[#2a2a31] cursor-pointer transition-colors duration-[120ms] hover:bg-[#f3f3f5]';

  return (
    <>
      {/* ── Main Header ─────────────────────────────────────────── */}
      {/* Menu · centred logo · icons. On the homepage it floats see-through over the
          hero and turns white once the hero has scrolled away; elsewhere it's white. */}
      <header
        ref={ref}
        className={`fixed top-0 left-0 right-0 z-[150] transition-colors duration-300 ${
          overHero ? 'bg-transparent text-white' : 'bg-white text-[#111114] border-b border-[#ececec]'
        }`}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 md:px-10" style={{ height: 'var(--header-h)' }}>
          {/* Menu */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="justify-self-start inline-flex items-center gap-3 h-10 -ml-1.5 px-1.5 text-[13px] font-semibold tracking-[0.08em] uppercase"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <Menu size={20} strokeWidth={1.6} />
            <span className="hidden md:inline">Menu</span>
          </button>

          {/* Logo */}
          <Link href="/" aria-label="Naya Lumière Cosmetics, home" className="rounded-md transition-opacity hover:opacity-80">
            <Image
              src="/naya-logo-white.png"
              alt="Naya Lumière Cosmetics"
              width={488}
              height={72}
              priority
              className={`h-[29px] md:h-[34px] w-auto transition-[filter] duration-300 ${overHero ? '' : 'invert'}`}
            />
          </Link>

          {/* Actions */}
          <div className="justify-self-end flex items-center gap-1 md:gap-2">
            <button type="button" onClick={() => setIsSearchOpen(true)} className={iconBtn} aria-label="Search">
              <Search size={20} strokeWidth={1.6} />
            </button>

            {/* Account */}
            <div className="relative group/account hidden md:block">
              <button
                type="button"
                onClick={() => { if (user) router.push('/account'); else router.push('/auth'); }}
                className={iconBtn}
                aria-label={user ? 'Account' : 'Sign in'}
              >
                {user?.profile_image ? (
                  <span className="relative w-6 h-6 rounded-full overflow-hidden">
                    <Image src={user.profile_image} alt={user.first_name || ''} fill className="object-cover" />
                  </span>
                ) : (
                  <User size={20} strokeWidth={1.6} />
                )}
              </button>

                {/* bridge to keep hover alive */}
                {user && <div className="absolute top-full right-0 w-full h-4 bg-transparent z-[200]" />}
                {/* Account dropdown */}
                {user && (() => {
                  const points     = loyaltyData?.stats?.points ?? 0;
                  const tier       = loyaltyData?.stats?.tier ?? 'Member';
                  const nextPts    = loyaltyData?.stats?.nextTierPoints ?? 2000;
                  const ptsToNext  = Math.max(0, nextPts - points);
                  const pct        = Math.min(100, Math.round((points / nextPts) * 100));
                  const tierNext   = tier === 'Platinum' ? 'Diamond' : tier === 'Gold' ? 'Platinum' : tier === 'Silver' ? 'Gold' : tier === 'Member' ? 'Silver' : 'Top';
                  const initials   = [user.first_name?.[0], user.last_name?.[0]].filter(Boolean).join('').toUpperCase() || 'NL';
                  return (
                    <div className="absolute top-[calc(100%+0.75rem)] right-0 w-[300px] bg-white border border-[#e5e5ea] rounded-2xl shadow-[0_12px_40px_rgba(17,17,20,.13)] opacity-0 invisible group-hover/account:opacity-100 group-hover/account:visible transition-all duration-200 translate-y-2 group-hover/account:translate-y-0 z-[200] overflow-hidden">
                      {/* User info block */}
                      <div className="px-4 pt-4 pb-3">
                        <div className="flex items-center gap-3 mb-3">
                          {/* Avatar */}
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[15px] font-bold shrink-0 relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg,#c087fc,#9869f7)' }}>
                            {user.profile_image
                              ? <Image src={user.profile_image} alt={user.first_name} fill className="object-cover" />
                              : initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-[#111114] leading-tight">Welcome back!</p>
                            <p className="text-[12px] text-[#8a8a93] truncate">{user.email}</p>
                          </div>
                        </div>
                        {/* Tier + points */}
                        <div className="rounded-xl border border-[#e5e5ea] bg-[#fafafa] px-3 py-2.5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500 uppercase tracking-wide">
                              <Star size={11} className="fill-amber-400 stroke-amber-400" />
                              {tier} Member
                            </span>
                            <span className="text-[13px] font-bold text-[#111114]">{points.toLocaleString()} pts</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[#e5e5ea] overflow-hidden mb-1.5">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#c087fc,#9869f7)' }} />
                          </div>
                          <p className="text-[11px] text-[#8a8a93]">{ptsToNext.toLocaleString()} pts to {tierNext}</p>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="px-2 pb-2 border-t border-[#f0f0f0]">
                        {[
                          { label: 'My Profile',    href: '/account',           Icon: User },
                          { label: 'My Orders',     href: '/account/orders',    Icon: Package },
                          { label: 'Wishlist',      href: '/account/wishlist',  Icon: Heart },
                          { label: 'Naya Rewards',  href: '/account/loyalty',   Icon: Star },
                          { label: 'Addresses',     href: '/account/addresses', Icon: MapPin },
                          { label: 'Settings',      href: '/account/settings',  Icon: Settings },
                        ].map(({ label, href, Icon }) => (
                          <Link key={href} href={href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#2a2a31] hover:bg-[#f3f3f5] transition-colors">
                            <Icon size={15} strokeWidth={1.8} className="text-[#8a8a93]" />
                            {label}
                          </Link>
                        ))}
                        {(user?.role === 'admin' || user?.role === 'staff') && (
                          <Link href="/admin"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#2a2a31] hover:bg-[#f3f3f5] transition-colors">
                            <ShieldCheck size={15} strokeWidth={1.8} className="text-[#8a8a93]" />
                            Admin Panel
                          </Link>
                        )}
                      </div>

                      {/* Sign out */}
                      <div className="px-2 pb-2 border-t border-[#f0f0f0]">
                        <button type="button" onClick={logout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors">
                          <LogOut size={15} strokeWidth={1.8} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  );
                })()}
            </div>

            {/* Bag */}
            <button
              type="button"
              onClick={() => router.push('/cart')}
              className={iconBtn}
              aria-label={`Bag${cartCount > 0 ? `, ${cartCount} items` : ''}`}
            >
              <ShoppingBag size={20} strokeWidth={1.6} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold text-white" style={{ background: 'rgb(147,104,236)' }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Search Overlay ─────────────────────────────────────── */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[300] bg-white/80 backdrop-blur-xl flex flex-col"
              onClick={(e) => { if (e.target === e.currentTarget) setIsSearchOpen(false); }}
            >
              <div className="max-w-3xl mx-auto w-full px-6 md:px-10 pt-24 md:pt-36">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.4 }}
                >
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-[#111114]">
                      What are you{' '}
                      <span
                        className="font-semibold"
                        style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', background: 'linear-gradient(90deg,#c087fc,#9869f7)', backgroundClip: 'text' }}
                      >
                        looking for?
                      </span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(false)}
                      className={panelBtn + ' shrink-0'}
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSearch} className="relative mb-12">
                    <Search size={20} strokeWidth={1.5} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8a8a93]" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Serums, moisturisers, fragrance…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xl md:text-3xl font-medium bg-transparent border-none pl-8 pr-4 py-3 focus:ring-0 focus:outline-none placeholder:text-[#c8c8cf] text-[#111114]"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-[#e5e5ea]" />
                  </form>

                  <div className="flex flex-wrap gap-2">
                    {['Anti-Aging', 'Serums', 'Hydration', 'Fragrance', 'Gift Sets', 'GERnétic'].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => { router.push(`/search?q=${encodeURIComponent(q)}`); setIsSearchOpen(false); }}
                        className="px-4 py-2 rounded-full border border-[#e5e5ea] bg-white text-[12px] font-medium text-[#2a2a31] hover:bg-[#f3f3f5] hover:border-[#c8c8cf] transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer for the fixed header — except on the homepage, where the hero runs under it */}
      {!isHome && <div aria-hidden="true" className="w-full" style={{ height: 'var(--header-h)' }} />}

      {/* ── Menu drawer (all screen sizes) ─────────────────────── */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[300]">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="absolute top-0 left-0 bottom-0 w-[85%] max-w-[360px] bg-white shadow-2xl flex flex-col rounded-r-[28px] overflow-hidden"
            >
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5ea]">
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center rounded-md transition-opacity hover:opacity-75 active:opacity-60">
                  <BrandLogo size="sm" />
                </Link>
                <button type="button" onClick={() => setIsMenuOpen(false)} className={panelBtn} aria-label="Close">
                  <X size={17} />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto py-4 px-3">
                {[...NAV_LINKS, { label: 'Wishlist', href: '/wishlist' }].map((item) => {
                  if (item.hasDropdown) {
                    const subLinks = item.hasDropdown === 'shop'
                      ? SHOP_LINKS
                      : (brands || []).map((brand) => ({ name: brand.name, href: `/brand/${brand.slug || brand.id}` }));

                    // No brands loaded yet — fall back to a plain link rather than an empty accordion
                    if (item.hasDropdown === 'brands' && subLinks.length === 0) {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => { router.push(item.href); setIsMenuOpen(false); }}
                          className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-medium text-[#2a2a31] hover:bg-[#f3f3f5] transition-colors"
                        >
                          {item.label}
                          <ChevronRight size={14} className="text-[#8a8a93]" />
                        </button>
                      );
                    }

                    const isExpanded = expandedMobileSection === item.label;

                    return (
                      <div key={item.label}>
                        <button
                          type="button"
                          onClick={() => setExpandedMobileSection(isExpanded ? null : item.label)}
                          aria-expanded={isExpanded}
                          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors ${
                            isExpanded ? 'text-[#7a4fe0] bg-[#f8f5fd]' : 'text-[#2a2a31] hover:bg-[#f3f3f5]'
                          }`}
                        >
                          {item.label}
                          <ChevronRight
                            size={14}
                            className={`transition-transform duration-200 ${isExpanded ? 'rotate-90 text-[#9869f7]' : 'text-[#8a8a93]'}`}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="ml-6 mb-1 pl-3 py-1 flex flex-col gap-0.5 border-l-2 border-[#f0e4fc]">
                                {subLinks.map((sub) => (
                                  <button
                                    key={sub.href}
                                    type="button"
                                    onClick={() => { router.push(sub.href); setIsMenuOpen(false); }}
                                    className="flex items-center justify-between pl-3 pr-3 py-2.5 rounded-lg text-[13.5px] font-medium text-[#5a5a64] hover:bg-[#f8f5fd] hover:text-[#7a4fe0] transition-colors"
                                  >
                                    {sub.name}
                                    <ArrowRight size={12} className="text-[#c9aef2]" />
                                  </button>
                                ))}
                                {item.hasDropdown === 'brands' && (
                                  <button
                                    type="button"
                                    onClick={() => { router.push('/brands'); setIsMenuOpen(false); }}
                                    className="flex items-center gap-1 pl-3 pr-3 py-2.5 text-[12.5px] font-semibold text-[#9869f7] hover:text-[#7a4fe0] transition-colors"
                                  >
                                    View all brands
                                    <ArrowRight size={11} />
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => { router.push(item.href); setIsMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors ${
                        item.highlight ? 'text-red-600 hover:bg-red-50' : 'text-[#2a2a31] hover:bg-[#f3f3f5]'
                      }`}
                    >
                      {item.label}
                      <ChevronRight size={14} className={item.highlight ? 'text-red-400' : 'text-[#8a8a93]'} />
                    </button>
                  );
                })}

                {/* Concerns */}
                {concerns?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#e5e5ea]">
                    <p className="text-[11px] font-semibold text-[#8a8a93] uppercase tracking-widest px-4 mb-2">Skin Concerns</p>
                    {concerns.map((concern) => {
                      const { icon: Icon } = getConcernMeta(concern.name);
                      return (
                        <button
                          key={concern.id}
                          type="button"
                          onClick={() => { router.push(`/search?q=${concern.name}`); setIsMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium text-[#2a2a31] hover:bg-[#f3f3f5] transition-colors"
                        >
                          <Icon size={15} strokeWidth={1.5} className="text-[#5a5a64]" />
                          {concern.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sidebar footer */}
              <div className="p-4 border-t border-[#e5e5ea]">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 px-2 mb-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden relative bg-[#f3f3f5] flex items-center justify-center font-semibold text-[#2a2a31]">
                        {user.profile_image
                          ? <Image src={user.profile_image} alt={user.first_name} fill className="object-cover" />
                          : <span>{user.first_name?.[0]}</span>
                        }
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-[#111114]">{user.first_name}</p>
                        {loyaltyData?.stats?.points != null && (
                          <p className="text-[11px] text-[#8a8a93]">{loyaltyData.stats.points.toLocaleString()} points</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { router.push('/account'); setIsMenuOpen(false); }}
                      className="w-full h-11 rounded-full text-[13px] font-semibold tracking-[0.1em] uppercase text-white"
                      style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
                    >
                      My Account
                    </button>
                    {(user?.role === 'admin' || user?.role === 'staff') && (
                      <button
                        type="button"
                        onClick={() => { router.push('/admin'); setIsMenuOpen(false); }}
                        className="w-full h-11 rounded-full border border-[#e5e5ea] text-[13px] font-medium text-[#2a2a31] hover:bg-[#f3f3f5] transition-colors"
                      >
                        Admin Panel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={logout}
                      className="text-[13px] font-medium text-red-500 py-2 text-center"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { router.push('/auth'); setIsMenuOpen(false); }}
                    className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-[13px] font-semibold tracking-[0.14em] uppercase text-white"
                    style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
                  >
                    Sign In
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M5 12h14M13 5l7 7-7 7"/>
                    </svg>
                  </button>
                )}
              </div>
            </motion.nav>
          </div>
        )}
      </AnimatePresence>
    </>
  );
});

Header.displayName = 'Header';

export default Header;

'use client';

import { useState, useEffect, forwardRef } from 'react';
import { ShoppingBag, ShoppingCart, Search, Menu, X, User, ChevronRight, Star, ShieldCheck, ArrowRight, Droplets, Clock, Zap, Heart, Layers, Sun, Sparkles, Gift, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

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
  { label: 'Collections', href: '/collections' },
  { label: 'Skin Quiz',   href: '/skin-quiz' },
  { label: 'Brands',      href: '/brands', hasDropdown: 'brands' },
  { label: 'Journal',     href: '/journal' },
];

const Header = forwardRef((_, ref) => {
  const [isMenuOpen,   setIsMenuOpen]   = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [isScrolled,   setIsScrolled]   = useState(false);

  const { cartItems } = useCart();
  const { user, logout } = useAuth();
  const { loyaltyData, concerns, brands } = useAppContext();
  const router   = useRouter();
  const pathname = usePathname();

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  /* ── icon button base classes ─────────────────────────────────── */
  const iconBtn = 'relative w-[38px] h-[38px] rounded-full border border-[#e5e5ea] bg-white flex items-center justify-center text-[#2a2a31] cursor-pointer transition-colors duration-[120ms] hover:bg-[#f3f3f5]';

  /* ── nav link classes ─────────────────────────────────────────── */
  const navLink = (active) =>
    `text-[13px] font-medium text-[#2a2a31] pb-[6px] border-b-2 transition-colors duration-[120ms] hover:text-[#111114] ${
      active ? 'border-[#111114] text-[#111114]' : 'border-transparent'
    }`;

  return (
    <>
      {/* ── Main Header ─────────────────────────────────────────── */}
      <header
        ref={ref}
        className={`fixed top-0 left-0 right-0 z-[150] transition-all duration-300 ${
          isScrolled ? 'pt-3 px-4' : 'pt-0 px-0'
        }`}
      >
        <div
          className={`mx-auto bg-white transition-all duration-300 ${
            isScrolled ? 'max-w-5xl rounded-2xl overflow-hidden' : 'max-w-full'
          }`}
          style={{
            borderBottom: isScrolled ? 'none' : '1px solid #e5e5ea',
            boxShadow: isScrolled ? '0 4px 14px rgba(17,17,20,.06)' : 'none',
          }}
        >
          <div className="flex items-center gap-6 px-5 md:px-8 h-[56px] md:h-[60px]">

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`${iconBtn} md:hidden shrink-0`}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-[10px] shrink-0 group transition-opacity hover:opacity-80 active:opacity-60 md:static absolute left-1/2 -translate-x-1/2 md:translate-x-0"
            >
              <Image
                src="/Adobe Express - file (5).png"
                alt="Naya Lumière"
                width={28}
                height={28}
                className="w-7 h-7 object-contain shrink-0"
                priority
              />
              <div className="flex flex-col leading-tight font-semibold tracking-[0.06em] text-[#111114]">
                <span className="text-[16px] leading-none">NAYA LUMIÈRE</span>
                <span className="text-[9px] tracking-[0.32em] text-[#5a5a64] uppercase mt-[2px] leading-none">
                  COSMETICS
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-7 ml-7">
              {NAV_LINKS.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                if (item.hasDropdown === 'shop') {
                  return (
                    <div key={item.label} className="relative group/shop">
                      <button
                        onClick={() => router.push(item.href)}
                        className={navLink(isActive) + ' flex items-center gap-1'}
                      >
                        {item.label}
                        <ChevronRight className="w-3 h-3 rotate-90 transition-transform duration-200 group-hover/shop:rotate-[270deg]" />
                      </button>

                      {/* bridge */}
                      <div className="absolute top-full left-0 w-full h-4 bg-transparent z-[200]" />

                      <div className="absolute top-[calc(100%+1rem)] left-0 w-[240px] bg-white border border-[#e5e5ea] rounded-2xl shadow-[0_8px_32px_rgba(17,17,20,.10)] opacity-0 invisible group-hover/shop:opacity-100 group-hover/shop:visible transition-all duration-200 translate-y-2 group-hover/shop:translate-y-0 z-[200] p-2">
                        {[
                          { name: 'All Products', href: '/all-products' },
                          { name: 'Skincare',     href: '/SkinCare' },
                          { name: 'Fragrance',    href: '/fragrance' },
                          { name: 'New Arrivals', href: '/new-arrivals' },
                        ].map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-[#2a2a31] hover:bg-[#f3f3f5] hover:text-[#111114] transition-colors"
                          >
                            {link.name}
                            <ArrowRight size={12} className="text-[#8a8a93]" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (item.hasDropdown === 'brands' && brands?.length > 0) {
                  return (
                    <div key={item.label} className="relative group/brands">
                      <button className={navLink(isActive) + ' flex items-center gap-1'}>
                        {item.label}
                        <ChevronRight className="w-3 h-3 rotate-90 transition-transform duration-200 group-hover/brands:rotate-[270deg]" />
                      </button>

                      <div className="absolute top-full left-0 w-full h-4 bg-transparent z-[200]" />

                      <div className="absolute top-[calc(100%+1rem)] left-0 w-[220px] bg-white border border-[#e5e5ea] rounded-2xl shadow-[0_8px_32px_rgba(17,17,20,.10)] opacity-0 invisible group-hover/brands:opacity-100 group-hover/brands:visible transition-all duration-200 translate-y-2 group-hover/brands:translate-y-0 z-[200] p-2">
                        {brands.map((brand) => (
                          <Link
                            key={brand.id}
                            href={`/brand/${brand.slug || brand.id}`}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-[#2a2a31] hover:bg-[#f3f3f5] hover:text-[#111114] transition-colors"
                          >
                            {brand.name}
                            <ArrowRight size={12} className="text-[#8a8a93]" />
                          </Link>
                        ))}
                        <div className="mt-1 pt-2 border-t border-[#e5e5ea] px-3">
                          <Link href="/brands" className="text-[12px] font-medium text-[#9869f7] hover:text-[#7a4fe0] transition-colors">
                            View all brands →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link key={item.label} href={item.href} className={navLink(isActive)}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Actions — push to right */}
            <div className="ml-auto flex items-center gap-2">
              {/* Search */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className={`${iconBtn} hidden md:flex`}
                aria-label="Search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7"/>
                  <path d="m20 20-3.5-3.5"/>
                </svg>
              </button>

              {/* Account */}
              <div className="relative group/account hidden md:block">
                <button
                  type="button"
                  onClick={() => { if (user) router.push('/account'); else router.push('/auth'); }}
                  className={iconBtn}
                  aria-label="Account"
                >
                  {user?.profile_image ? (
                    <Image src={user.profile_image} alt={user.first_name} fill className="object-cover rounded-full" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 21a8 8 0 0 1 16 0"/>
                    </svg>
                  )}
                </button>

                {/* Account dropdown */}
                {user && (
                  <div className="absolute top-[calc(100%+0.75rem)] right-0 w-52 bg-white border border-[#e5e5ea] rounded-2xl shadow-[0_8px_32px_rgba(17,17,20,.10)] opacity-0 invisible group-hover/account:opacity-100 group-hover/account:visible transition-all duration-200 translate-y-2 group-hover/account:translate-y-0 z-[200] p-2">
                    <div className="px-3 py-2 border-b border-[#e5e5ea] mb-1">
                      <p className="text-[13px] font-semibold text-[#111114]">{user.first_name}</p>
                      {loyaltyData?.stats?.points != null && (
                        <p className="text-[11px] text-[#8a8a93] mt-0.5">{loyaltyData.stats.points.toLocaleString()} points</p>
                      )}
                    </div>
                    {[
                      { label: 'My Profile',     href: '/account',  Icon: User },
                      { label: 'Wishlist',        href: '/wishlist', Icon: Heart },
                      { label: 'Loyalty Points',  href: '/loyalty',  Icon: Star },
                    ].map(({ label, href, Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#2a2a31] hover:bg-[#f3f3f5] transition-colors"
                      >
                        <Icon size={14} strokeWidth={2} className="text-[#5a5a64]" />
                        {label}
                      </Link>
                    ))}
                    {user?.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#2a2a31] hover:bg-[#f3f3f5] transition-colors"
                      >
                        <ShieldCheck size={14} strokeWidth={2} className="text-[#5a5a64]" />
                        Admin Panel
                      </Link>
                    )}
                    <div className="mt-1 pt-1 border-t border-[#e5e5ea]">
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={14} strokeWidth={2} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart */}
              <button
                type="button"
                onClick={() => router.push('/cart')}
                className={iconBtn}
                aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
              >
                <ShoppingCart size={18} strokeWidth={1.8} />
                {cartCount > 0 && (
                  <span
                    className="absolute -right-[3px] -top-[3px] w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
                    style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* Sign In — desktop, only when logged out */}
              {!user && (
                <button
                  type="button"
                  onClick={() => router.push('/auth')}
                  className="hidden md:inline-flex items-center gap-2 h-9 px-[18px] rounded-full text-[11px] font-semibold tracking-[0.14em] uppercase text-white cursor-pointer transition-all active:scale-[.98]"
                  style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
                >
                  Sign In
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M5 12h14M13 5l7 7-7 7"/>
                  </svg>
                </button>
              )}
            </div>
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
                      className={iconBtn + ' shrink-0'}
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

      {/* Spacer */}
      <div className="h-14 md:h-[60px] w-full" />

      {/* ── Mobile Sidebar ─────────────────────────────────────── */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[150]">
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
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-[10px]">
                  <Image src="/Adobe Express - file (5).png" alt="Naya Lumière" width={26} height={26} className="w-6.5 h-6.5 object-contain" />
                  <div className="flex flex-col leading-tight font-semibold tracking-[0.06em] text-[#111114]">
                    <span className="text-[15px] leading-none">NAYA LUMIÈRE</span>
                    <span className="text-[9px] tracking-[0.32em] text-[#5a5a64] uppercase mt-[2px] leading-none">COSMETICS</span>
                  </div>
                </Link>
                <button type="button" onClick={() => setIsMenuOpen(false)} className={iconBtn} aria-label="Close">
                  <X size={17} />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto py-4 px-3">
                {[
                  { label: 'Shop',        href: '/all-products' },
                  { label: 'Collections', href: '/collections' },
                  { label: 'Skin Quiz',   href: '/skin-quiz' },
                  { label: 'Brands',      href: '/brands' },
                  { label: 'Journal',     href: '/journal' },
                  { label: 'Wishlist',    href: '/wishlist' },
                ].map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => { router.push(item.href); setIsMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-medium text-[#2a2a31] hover:bg-[#f3f3f5] transition-colors"
                  >
                    {item.label}
                    <ChevronRight size={14} className="text-[#8a8a93]" />
                  </button>
                ))}

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
                    {user?.role === 'admin' && (
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

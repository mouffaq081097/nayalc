'use client';

import { useState, useEffect, useMemo, useRef, forwardRef } from 'react';
import { ShoppingBag, Search, Menu, X, User, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { isHomePath, formatAED } from '../lib/utils';
import { orderableQty } from '@/lib/backorderRules';
import { shortBrand } from '@/lib/seo';
import { cardName } from './home/HomeProductCard';

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

/** A product row in the search panel: photo tile, a small label, the name and the price. */
function SearchList({ items, onPick }) {
  return (
    <ul className="mt-1">
      {items.map((p) => (
        <li key={p.id}>
          <button type="button" onClick={() => onPick(p)} className="w-full flex items-center gap-4 py-3 text-left group">
            <span className="relative w-[72px] h-[72px] shrink-0 bg-[#e7e5e1]">
              {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="72px" className="object-contain p-1.5 mix-blend-multiply" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-medium uppercase tracking-wide" style={{ color: 'rgb(147,104,236)' }}>
                {p.isBestseller ? 'Best seller' : shortBrand(p.brandName)}
              </span>
              <span className="block text-[14px] leading-snug text-[#6b6b73] group-hover:text-[#111114] line-clamp-2">{cardName(p.name)}</span>
              <span className="block mt-0.5 text-[13px] text-[#111114] tabular-nums">{formatAED(p.price)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// Fixed header height (also --header-h in globals.css, for layouts that offset around it)
export const HEADER_H = { mobile: 70, desktop: 88 };

const Header = forwardRef((_, ref) => {
  const [isMenuOpen,   setIsMenuOpen]   = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [pastHero,     setPastHero]     = useState(false);
  const [expandedMobileSection, setExpandedMobileSection] = useState(null);

  const { cartItems } = useCart();
  const { user, logout } = useAuth();
  const { loyaltyData, concerns, brands, products } = useAppContext();
  const router   = useRouter();
  const pathname = usePathname();

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const isHome = isHomePath(pathname);
  const overHero = isHome && !pastHero && !isMenuOpen && !isSearchOpen;

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

  // Search panel: four best sellers to start with, then live matches on name / brand / category
  const topPicks = useMemo(
    () => (products || []).filter((p) => orderableQty(p) > 0)
      .sort((a, b) => (Number(!!b.isBestseller) - Number(!!a.isBestseller)) || (Number(b.totalSold || 0) - Number(a.totalSold || 0)))
      .slice(0, 4),
    [products],
  );
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return (products || [])
      .filter((p) => [p.name, p.brandName, p.categoryNames].some((f) => String(f || '').toLowerCase().includes(q)))
      .slice(0, 6);
  }, [products, searchQuery]);
  const openProduct = (p) => { router.push(`/product/${p.slug || p.id}`); setIsSearchOpen(false); setSearchQuery(''); };

  // Only one panel at a time
  useEffect(() => { if (isSearchOpen) setIsMenuOpen(false); }, [isSearchOpen]);
  useEffect(() => { if (isMenuOpen) setIsSearchOpen(false); }, [isMenuOpen]);

  // Account panel opens on click; it closes on an outside click, Esc or a page change
  useEffect(() => { setIsAccountOpen(false); }, [pathname]);
  useEffect(() => {
    if (!isAccountOpen) return;
    const onDown = (e) => { if (!accountRef.current?.contains(e.target)) setIsAccountOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setIsAccountOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isAccountOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  /* ── header icons: plain, in the header's own colour ──────────────── */
  const iconBtn = 'relative w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-70';
  // The drawer and search overlay keep their light, bordered buttons

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
        <div className="flex items-center gap-2 px-3 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-3 md:px-10" style={{ height: 'var(--header-h)' }}>
          {/* Menu */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="justify-self-start inline-flex shrink-0 items-center gap-3 h-10 md:-ml-1.5 px-1.5 text-[13px] font-semibold tracking-[0.08em] uppercase"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.6} />}
            <span className="hidden md:inline">{isMenuOpen ? 'Close' : 'Menu'}</span>
          </button>

          {/* Logo */}
          <Link href="/" aria-label="Naya Lumière Cosmetics, home" className="mr-auto md:mr-0 rounded-md transition-opacity hover:opacity-80">
            <Image
              src="/naya-logo-white.png"
              alt="Naya Lumière Cosmetics"
              width={488}
              height={72}
              priority
              className={`h-[24px] md:h-[34px] w-auto transition-[filter] duration-300 ${overHero ? '' : 'invert'}`}
            />
          </Link>

          {/* Actions */}
          <div className="justify-self-end flex items-center md:gap-2">
            <button type="button" onClick={() => setIsSearchOpen(true)} className={iconBtn} aria-label="Search">
              <Search size={20} strokeWidth={1.6} />
            </button>

            {/* Account */}
            {/* Account (after Pitaka): icon + ⌄ on desktop; clicking opens a small panel with
                the account details on top and a few plain links. Signed out, it goes to sign in. */}
            <div ref={accountRef} className="relative">
              <button
                type="button"
                onClick={() => { if (user) setIsAccountOpen(o => !o); else router.push('/auth'); }}
                aria-expanded={user ? isAccountOpen : undefined}
                aria-haspopup={user ? 'menu' : undefined}
                className={`${iconBtn} md:w-auto md:gap-1 md:px-1`}
                aria-label={user ? 'Account' : 'Sign in'}
              >
                {user?.profile_image ? (
                  <span className="relative w-6 h-6 rounded-full overflow-hidden">
                    <Image src={user.profile_image} alt={user.first_name || ''} fill className="object-cover" />
                  </span>
                ) : (
                  <User size={20} strokeWidth={1.6} />
                )}
                {user && <ChevronDown size={14} strokeWidth={2} className={`hidden md:block transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} />}
              </button>

              {user && isAccountOpen && (() => {
                const points   = Number(loyaltyData?.stats?.points) || 0;
                const tier     = loyaltyData?.stats?.tier || 'Silver';
                const initials = [user.first_name?.[0], user.last_name?.[0]].filter(Boolean).join('').toUpperCase() || 'NL';
                const links = [
                  { label: 'My account', href: '/account' },
                  { label: 'My orders', href: '/account/orders' },
                  { label: 'Naya Rewards', href: '/account/loyalty' },
                  { label: 'Wishlist', href: '/account/wishlist' },
                  ...(user.role === 'admin' || user.role === 'staff' ? [{ label: 'Admin panel', href: '/admin' }] : []),
                ];
                return (
                  <div role="menu" className="absolute top-[calc(100%+0.75rem)] right-0 w-[264px] rounded-xl bg-white shadow-[0_10px_36px_rgba(17,17,20,.12)] z-[200] text-[#111114]">
                    {/* Account details */}
                    <div className="px-6 pt-5 pb-4 flex items-center gap-3">
                      <span className="relative w-10 h-10 shrink-0 rounded-full overflow-hidden bg-[#f6f5f2] flex items-center justify-center text-[13px] font-semibold text-[#5a5a64]">
                        {user.profile_image
                          ? <Image src={user.profile_image} alt="" fill sizes="40px" className="object-cover" />
                          : initials}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-medium truncate">Hi, {user.first_name || 'there'}</span>
                        <span className="block text-[12px] text-[#8a8a92] truncate">{user.email}</span>
                      </span>
                    </div>
                    <p className="mx-6 mb-1 text-[12px] text-[#5a5a64]">
                      {tier} member · <span className="font-semibold" style={{ color: 'rgb(147,104,236)' }}>{points.toLocaleString()} points</span>
                    </p>

                    {/* Plain links between thin rules */}
                    <ul className="px-6 pb-2">
                      {links.map(({ label, href }) => (
                        <li key={href} className="border-t border-[#111114]/80 first:mt-3">
                          <Link href={href} role="menuitem" onClick={() => setIsAccountOpen(false)} className="block py-3 text-[15px] hover:opacity-60 transition-opacity">{label}</Link>
                        </li>
                      ))}
                      <li className="border-t border-[#111114]/80">
                        <button type="button" role="menuitem" onClick={() => { setIsAccountOpen(false); logout(); }} className="block w-full py-3 text-left text-[15px] text-[#8a8a92] hover:text-[#111114] transition-colors">
                          Sign out
                        </button>
                      </li>
                    </ul>
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

        {/* ── Search (after Pitaka): a white panel under the header with the field,
             popular searches and top picks — or matching products as you type ── */}
        <AnimatePresence>
          {isSearchOpen && (
            <div className="fixed inset-x-0 bottom-0 z-[140] text-[#111114]" style={{ top: 'var(--header-h)' }}>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/30"
                onClick={() => setIsSearchOpen(false)}
              />
              <motion.div
                role="dialog"
                aria-label="Search"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white border-t border-[#ececec] max-h-full overflow-y-auto"
              >
                <div className="max-w-3xl mx-auto px-6 md:px-10 pt-7 pb-10">
                  <form onSubmit={handleSearch} className="flex items-center gap-3 border-b border-[#111114] pb-3">
                    <Search size={24} strokeWidth={1.5} className="shrink-0" />
                    <label htmlFor="site-search" className="sr-only">Search</label>
                    <input
                      id="site-search"
                      autoFocus
                      type="search"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Escape') setIsSearchOpen(false); }}
                      className="flex-1 min-w-0 bg-transparent text-[17px] outline-none placeholder:text-[#9a9aa2] [&::-webkit-search-cancel-button]:hidden"
                    />
                    <button type="button" onClick={() => setIsSearchOpen(false)} aria-label="Close search" className="shrink-0 p-1 -mr-1">
                      <X size={26} strokeWidth={1.5} />
                    </button>
                  </form>

                  {searchQuery.trim() ? (
                    <section className="mt-8">
                      <h2 className="pb-3 border-b border-[#111114] text-[16px]">
                        {searchMatches.length ? 'Products' : `No products match “${searchQuery.trim()}”`}
                      </h2>
                      <SearchList items={searchMatches} onPick={openProduct} />
                      <button type="button" onClick={handleSearch} className="mt-5 text-[14px] underline underline-offset-4 decoration-gray-300 hover:decoration-[#111114]">
                        See all results for “{searchQuery.trim()}”
                      </button>
                    </section>
                  ) : (
                    <>
                      <section className="mt-8">
                        <h2 className="text-[16px]">Popular searches</h2>
                        <div className="mt-4 flex flex-wrap gap-2.5">
                          {['Anti-Aging', 'Serums', 'Hydration', 'Fragrance', 'Gift Sets', 'GERnétic'].map((q) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => { router.push(`/search?q=${encodeURIComponent(q)}`); setIsSearchOpen(false); }}
                              className="px-5 py-2 rounded-full bg-[#e7e5e1] text-[14px] hover:bg-[#dcd9d3] transition-colors"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </section>
                      {topPicks.length > 0 && (
                        <section className="mt-10">
                          <h2 className="pb-3 border-b border-[#111114] text-[16px]">Top picks</h2>
                          <SearchList items={topPicks} onPick={openProduct} />
                        </section>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer for the fixed header — except on the homepage, where the hero runs under it */}
      {!isHome && <div aria-hidden="true" className="w-full" style={{ height: 'var(--header-h)' }} />}

      {/* ── Menu (after Pitaka): a plain white panel under the header, which stays
           in view with ✕ in place of the menu icon. Full width on phones, a column on desktop. ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-x-0 bottom-0 z-[140]" style={{ top: 'var(--header-h)' }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/30"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.nav
              aria-label="Main menu"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-0 left-0 bottom-0 w-full md:w-[400px] bg-white flex flex-col border-t border-[#ececec] md:border-r"
            >
              <div className="flex-1 overflow-y-auto px-6 md:px-10 pt-5 pb-8">
                <ul>
                  {[...NAV_LINKS, { label: 'Wishlist', href: '/wishlist' }].map((item) => {
                    const go = (href) => { router.push(href); setIsMenuOpen(false); };
                    const row = 'flex w-full items-center gap-2 py-3.5 text-left text-[16px] text-[#111114] transition-opacity hover:opacity-60';

                    if (item.hasDropdown) {
                      const subLinks = item.hasDropdown === 'shop'
                        ? SHOP_LINKS
                        : (brands || []).map((brand) => ({ name: brand.name, href: `/brand/${brand.slug || brand.id}` }));

                      // No brands loaded yet — a plain link rather than an empty list
                      if (item.hasDropdown === 'brands' && subLinks.length === 0) {
                        return <li key={item.label}><button type="button" onClick={() => go(item.href)} className={row}>{item.label}</button></li>;
                      }

                      const isExpanded = expandedMobileSection === item.label;
                      return (
                        <li key={item.label}>
                          <button
                            type="button"
                            onClick={() => setExpandedMobileSection(isExpanded ? null : item.label)}
                            aria-expanded={isExpanded}
                            className={row}
                          >
                            {item.label}
                            <ChevronDown size={16} strokeWidth={2} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.ul
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden pl-4 pb-2"
                              >
                                {subLinks.map((sub) => (
                                  <li key={sub.href}>
                                    <button type="button" onClick={() => go(sub.href)} className="w-full py-2.5 text-left text-[14.5px] text-[#6b6b73] hover:text-[#111114] transition-colors">
                                      {sub.name}
                                    </button>
                                  </li>
                                ))}
                                {item.hasDropdown === 'brands' && (
                                  <li>
                                    <button type="button" onClick={() => go('/brands')} className="w-full py-2.5 text-left text-[14.5px] text-[#111114] underline underline-offset-4 decoration-gray-300">
                                      View all brands
                                    </button>
                                  </li>
                                )}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </li>
                      );
                    }

                    return (
                      <li key={item.href}>
                        <button type="button" onClick={() => go(item.href)} className={row} style={item.highlight ? { color: 'rgb(147,104,236)' } : undefined}>
                          {item.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {/* Skin concerns */}
                {concerns?.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-[#ececec]">
                    <p className="pb-1 text-[12px] text-[#8a8a92]">Skin concerns</p>
                    <ul>
                      {concerns.map((concern) => (
                        <li key={concern.id}>
                          <button
                            type="button"
                            onClick={() => { router.push(`/search?q=${concern.name}`); setIsMenuOpen(false); }}
                            className="w-full py-2.5 text-left text-[15px] text-[#111114] hover:opacity-60 transition-opacity"
                          >
                            {concern.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Account — plain links at the bottom, like Pitaka's Community / About us */}
              <div className="shrink-0 px-6 md:px-10 pt-4 pb-[calc(24px+env(safe-area-inset-bottom,0px))] border-t border-[#ececec]">
                {user ? (
                  <>
                    <p className="pb-2 text-[12px] text-[#8a8a92]">
                      Signed in as {user.first_name || user.email}
                      {loyaltyData?.stats?.points != null && ` · ${loyaltyData.stats.points.toLocaleString()} points`}
                    </p>
                    <ul>
                      <li><button type="button" onClick={() => { router.push('/account'); setIsMenuOpen(false); }} className="w-full py-2.5 text-left text-[16px] text-[#111114] hover:opacity-60">My Account</button></li>
                      {(user?.role === 'admin' || user?.role === 'staff') && (
                        <li><button type="button" onClick={() => { router.push('/admin'); setIsMenuOpen(false); }} className="w-full py-2.5 text-left text-[16px] text-[#111114] hover:opacity-60">Admin Panel</button></li>
                      )}
                      <li><button type="button" onClick={logout} className="w-full py-2.5 text-left text-[16px] text-[#b91c1c] hover:opacity-70">Sign Out</button></li>
                    </ul>
                  </>
                ) : (
                  <button type="button" onClick={() => { router.push('/auth'); setIsMenuOpen(false); }} className="w-full py-2.5 text-left text-[16px] text-[#111114] hover:opacity-60">
                    Sign In
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

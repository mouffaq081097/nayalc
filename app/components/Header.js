'use client';

import { useState, useEffect, forwardRef } from 'react';
import { ShoppingBag, Search, Menu, X, User, ChevronRight, Star, ShieldCheck, ArrowRight, Droplets, Clock, Zap, Heart, Layers, Sun, Sparkles, Gift } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { cn } from './ui/utils';

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

const Header = forwardRef((props, ref) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { cartItems } = useCart();
  const { user } = useAuth();
  const { loyaltyData, concerns } = useAppContext();
  const router = useRouter();
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAccountClick = () => {
    if (user) router.push('/account');
    else router.push('/auth');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${searchQuery}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-[150] transition-all duration-500 ease-in-out ${
          isScrolled ? 'pt-4 px-4' : 'pt-0 px-0'
        }`}
      >
        <div className={`mx-auto transition-all duration-500 ease-in-out flex flex-col ${isScrolled ? 'max-w-5xl backdrop-blur-3xl rounded-[var(--radius-card)] overflow-hidden relative' : 'max-w-full backdrop-blur-md border-b'}`}
          style={isScrolled ? {
            background: 'rgba(253,248,255,0.88)',
            border: '1px solid var(--cl-glass-border)',
            boxShadow: 'var(--cl-shadow-card)',
          } : {
            background: 'rgba(253,248,255,0.15)',
            borderColor: 'rgba(216,180,254,0.12)',
          }}
        >
            <div
            className={`w-full flex items-center justify-between gap-4 md:gap-8 px-5 md:px-10 transition-all duration-500 ease-in-out relative ${
                isScrolled ? 'h-13 md:h-14' : 'h-13 md:h-16'
            }`}
            >

            {/* Left: Mobile Menu & Desktop Nav */}
            <div className="flex items-center gap-6 flex-1">
                <Button
                    type="button"
                    variant="pillGlass"
                    size="pillIcon"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={cn(
                      'md:hidden shrink-0',
                      isScrolled
                        ? 'border-black/10 bg-white/90 text-[#1d1d1f]'
                        : 'border-white/25 bg-white/20 text-black hover:bg-white/35'
                    )}
                    aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                >
                    {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </Button>

                <nav className="hidden md:flex items-center gap-8">
                    {[
                    { name: 'Store', href: '/all-products' },
                    { name: 'Skincare', href: '/SkinCare' },
                    { name: 'Fragrance', href: '/fragrance' },
                    { name: 'Sales', href: '/sales' },
                    ].map(link => (
                    <Link 
                        key={link.name} 
                        href={link.href} 
                        className={`text-[12px] md:text-[13px] font-medium tracking-tight transition-all ${isScrolled ? 'text-gray-800' : 'text-gray-900'}`} style={{ ['--hover-color']: 'var(--cl-purple)' }} onMouseEnter={e => e.currentTarget.style.color='var(--cl-purple)'} onMouseLeave={e => e.currentTarget.style.color=''}
                    >
                        {link.name}
                    </Link>
                    ))}

                    {/* Shop by Concern — Mega-Menu */}
                    {concerns && concerns.length > 0 && (
                        <div className="relative group/concerns">
                            <button className={`text-[12px] md:text-[13px] font-medium tracking-tight transition-all flex items-center gap-1 ${isScrolled ? 'text-gray-800' : 'text-gray-900'}`} onMouseEnter={e => e.currentTarget.style.color='var(--cl-purple)'} onMouseLeave={e => e.currentTarget.style.color=''}>
                                Concern
                                <ChevronRight className="w-3 h-3 rotate-90 transition-transform duration-300 group-hover/concerns:rotate-[270deg]" />
                            </button>
                            <div className="absolute top-full left-0 mt-3 w-[480px] bg-white/97 backdrop-blur-3xl rounded-3xl shadow-[0_24px_64px_-16px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.05)] border border-white/50 opacity-0 invisible group-hover/concerns:opacity-100 group-hover/concerns:visible transition-all duration-300 transform translate-y-2 group-hover/concerns:translate-y-0 z-[200] p-4 overflow-hidden">
                                <p className="text-[9px] font-black tracking-[0.35em] text-gray-400 px-3 pb-3 border-b border-gray-100 mb-3">Shop by Skin Concern</p>
                                <div className="grid grid-cols-2 gap-1">
                                    {concerns.map(concern => {
                                        const { icon: Icon, desc } = getConcernMeta(concern.name);
                                        return (
                                            <Link
                                                key={concern.id}
                                                href={`/search?q=${concern.name}`}
                                                className="flex items-start gap-3 px-3 py-3 rounded-2xl transition-colors group/item"
                                                onMouseEnter={e => e.currentTarget.style.background='rgba(147,51,234,0.04)'}
                                                onMouseLeave={e => e.currentTarget.style.background=''}
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 group-hover/item:text-white" style={{ color: 'var(--cl-purple)' }} onMouseEnter={e => e.currentTarget.style.background='var(--cl-gradient)'} onMouseLeave={e => { e.currentTarget.style.background=''; }}>
                                                    <Icon size={14} strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-gray-900 leading-tight">{concern.name}</p>
                                                    <p className="text-[10px] text-gray-400 leading-snug mt-0.5">{desc}</p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-100 px-3">
                                    <Link href="/all-products" className="flex items-center gap-1.5 text-[10px] font-black tracking-widest hover:gap-3 transition-all duration-200 cl-gradient-text">
                                        Browse all products <ArrowRight size={11} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </nav>
            </div>

            {/* Center: Logo + Brand Name — absolute center on mobile, static on desktop */}
            <Link href="/" className="md:static absolute left-1/2 -translate-x-1/2 flex items-center gap-0 shrink-0 transition-all active:scale-95">
                <Image
                  src="/Adobe Express - file (5).png"
                  alt="Naya Lumière Cosmetics"
                  height={36}
                  width={120}
                  className="h-7 md:h-9 w-auto object-contain shrink-0"
                  priority
                />
                {/* Brand name text — collapses when scrolled */}
                <motion.div
                  initial={false}
                  animate={{
                    opacity: isScrolled ? 0 : 1,
                    maxWidth: isScrolled ? 0 : 180,
                    marginLeft: isScrolled ? 0 : 10,
                  }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <div className="flex flex-col justify-center leading-none">
                    <span
                      className="text-[13px] font-black tracking-normal uppercase"
                      style={{ color: 'var(--cl-text-deep)' }}
                    >
                      NAYA
                    </span>
                    <span
                      className="text-[9px] font-medium tracking-normal font-serif italic"
                      style={{ color: 'var(--cl-text-mid)' }}
                    >
                      Lumière Cosmetics
                    </span>
                  </div>
                </motion.div>
            </Link>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
                {/* Search — desktop only (mobile uses bottom nav) */}
                <Button
                    type="button"
                    variant="pillGlass"
                    size="pillIcon"
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className={cn(
                      'hidden md:flex',
                      isScrolled ? 'text-gray-700' : 'text-black border-white/20 bg-white/15 hover:bg-white/25'
                    )}
                    aria-label="Search"
                >
                    <Search size={18} strokeWidth={2} />
                </Button>

                <div className="flex items-center gap-2">
                    {/* Loyalty points — desktop only */}
                    {user && (
                        <Link href="/loyalty" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors" style={{ background: 'rgba(147,51,234,0.06)', border: '1px solid rgba(147,51,234,0.15)' }}>
                            <Star size={12} style={{ color: 'var(--cl-purple)', fill: 'var(--cl-purple)' }} />
                            <span className="text-[10px] font-black tracking-widest" style={{ color: 'var(--cl-purple)' }}>
                                {loyaltyData?.stats?.points?.toLocaleString() || 0}
                            </span>
                        </Link>
                    )}

                    {/* Account button — desktop only (mobile uses bottom nav) */}
                    <div className="relative group/account hidden md:block">
                        <button
                        type="button"
                        onClick={handleAccountClick}
                        className="flex items-center gap-3 rounded-full px-1.5 py-1 transition-all hover:bg-gray-50"
                        >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 transition-all group-hover/account:text-white" style={{}} onMouseEnter={e => e.currentTarget.style.background='var(--cl-gradient)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                            <User size={16} strokeWidth={2} />
                        </div>
                        {user && (
                            <div className="hidden lg:flex flex-col items-start -space-y-0.5">
                                <span className="text-[11px] font-black tracking-tight text-gray-900 leading-tight uppercase">
                                    {user.first_name}
                                </span>
                            </div>
                        )}
                        </button>

                        {/* Admin Dropdown on Hover */}
                        {user?.email === 'mouffaq@nayalc.com' && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-white/40 overflow-hidden opacity-0 invisible group-hover/account:opacity-100 group-hover/account:visible transition-all duration-300 transform translate-y-2 group-hover/account:translate-y-0 z-[200]">
                                <Link
                                    href="/admin"
                                    className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-all group/admin"
                                >
                                    <div className="w-8 h-8 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink group-hover/admin:bg-brand-pink group-hover:text-white transition-all">
                                        <ShieldCheck size={16} strokeWidth={2} />
                                    </div>
                                    <span className="text-[11px] font-black tracking-widest text-gray-900">
                                        Admin Panel
                                    </span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <Button
                type="button"
                variant="pillPrimary"
                size="pillIcon"
                onClick={() => router.push('/cart')}
                className="relative shadow-lg"
                aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
                >
                <ShoppingBag size={18} strokeWidth={2} />
                {cartCount > 0 && (
                    <>
                    <span className="absolute inset-0 rounded-full animate-ping bg-brand-pink/20 pointer-events-none" />
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white z-10" style={{ background: 'var(--cl-gradient)' }}>
                    {cartCount > 9 ? '9+' : cartCount}
                    </span>
                    </>
                )}
                </Button>
            </div>
            </div>
        </div>

        {/* Full-Screen Search Overlay */}
        <AnimatePresence>
            {isSearchOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[300] bg-white/97 backdrop-blur-3xl flex flex-col"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsSearchOpen(false); }}
                >
                    <div className="max-w-3xl mx-auto w-full px-6 md:px-10 pt-20 md:pt-32 pb-10 flex flex-col gap-10">
                        {/* Input */}
                        <form onSubmit={handleSearch} className="relative flex items-center gap-4 border-b-2 border-gray-200 pb-5">
                            <Search size={26} className="text-brand-pink shrink-0" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search the collection..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-2xl md:text-4xl font-bold bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-gray-200 text-gray-900 tracking-tight"
                            />
                            <Button type="button" variant="pillGlass" size="pillIcon" onClick={() => setIsSearchOpen(false)} className="shrink-0 border-transparent bg-gray-100 hover:bg-gray-200" aria-label="Close search">
                                <X size={20} />
                            </Button>
                        </form>

                        {/* Quick Suggestions */}
                        <div className="space-y-4">
                            <p className="text-[9px] font-black tracking-[0.35em] text-gray-400">Popular Searches</p>
                            <div className="flex flex-wrap gap-2">
                                {['Anti-Aging', 'Serums', 'Fragrance', 'Gift Sets', 'GERnétic', 'Zorah'].map(q => (
                                    <Button
                                        key={q}
                                        type="button"
                                        variant="pillSecondary"
                                        size="pillSm"
                                        onClick={() => { setSearchQuery(q); router.push(`/search?q=${q}`); setIsSearchOpen(false); }}
                                        className="font-black tracking-widest hover:border-brand-pink/30 hover:bg-brand-pink hover:text-white transition-all"
                                    >
                                        {q}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="space-y-3">
                            <p className="text-[9px] font-black tracking-[0.35em] text-gray-400">Quick Links</p>
                            {[
                                { label: 'New Arrivals', href: '/new-arrivals' },
                                { label: 'All Products', href: '/all-products' },
                                { label: 'Gift Sets', href: '/gift-sets' },
                            ].map(link => (
                                <button
                                    key={link.href}
                                    onClick={() => { router.push(link.href); setIsSearchOpen(false); }}
                                    className="flex items-center gap-3 w-full text-left py-2 text-[15px] font-semibold text-gray-700 hover:text-brand-pink transition-colors group"
                                >
                                    <ArrowRight size={15} className="text-brand-pink/40 group-hover:text-brand-pink transition-colors" />
                                    {link.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </header>

      {/* Persistent Spacer - Reserves header space in document flow */}
      <div className="h-14 md:h-16 w-full" />

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMenuOpen && (
            <div className="md:hidden fixed inset-0 z-[150]">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={() => setIsMenuOpen(false)}
                />
                <motion.nav
                    initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute top-0 left-0 bottom-0 w-[85%] max-w-[400px] bg-white shadow-2xl flex flex-col rounded-r-[2.5rem]"
                >
                    <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                        <Image src="/Adobe Express - file (5).png" alt="Naya Lumière Cosmetics" height={32} width={110} className="h-8 w-auto object-contain" />
                        <Button type="button" variant="pillSecondary" size="pillIcon" onClick={() => setIsMenuOpen(false)} className="active:scale-95" aria-label="Close menu">
                            <X size={18} />
                        </Button>
                    </div>
                    
                    <div className="flex flex-col py-6 overflow-y-auto">
                        {[
                            { label: 'Store', path: '/all-products' },
                            { label: 'New Arrivals', path: '/new-arrivals' },
                            { label: 'Skincare', path: '/SkinCare' },
                            { label: 'Fragrance', path: '/fragrance' },
                            { label: 'Collections', path: '/collections' },
                        ].map((item) => (
                            <button 
                                key={item.path}
                                onClick={() => { router.push(item.path); setIsMenuOpen(false); }} 
                                className="flex items-center justify-between px-10 py-5 text-[15px] font-semibold tracking-tight text-gray-900 active:bg-gray-50 border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                            >
                                {item.label}
                                <ChevronRight size={16} className="text-brand-pink" />
                            </button>
                        ))}

                        {/* Mobile Concerns Section */}
                        {concerns && concerns.length > 0 && (
                            <div className="bg-gray-50/50 px-10 py-8 border-b border-gray-100">
                                <span className="text-[10px] font-black tracking-[0.3em] text-gray-400 mb-5 block">Targeted Concerns</span>
                                <div className="grid grid-cols-1 gap-1">
                                    {concerns.map((concern, i) => {
                                        const { icon: Icon } = getConcernMeta(concern.name);
                                        return (
                                            <motion.button
                                                key={concern.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05, duration: 0.3 }}
                                                onClick={() => { router.push(`/search?q=${concern.name}`); setIsMenuOpen(false); }}
                                                className="flex items-center gap-3 py-4 text-[13px] font-bold text-gray-700 hover:text-brand-pink active:text-brand-pink transition-colors"
                                            >
                                                <div className="w-6 h-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-brand-pink shadow-sm">
                                                    <Icon size={12} strokeWidth={1.5} />
                                                </div>
                                                {concern.name}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        
                        {[
                            { label: 'Wishlist', path: '/wishlist' },
                            { label: 'Sales', path: '/sales' },
                        ].map((item) => (
                            <button 
                                key={item.path}
                                onClick={() => { router.push(item.path); setIsMenuOpen(false); }} 
                                className="flex items-center justify-between px-10 py-5 text-[15px] font-semibold tracking-tight text-gray-900 active:bg-gray-50 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                            >
                                {item.label}
                                <ChevronRight size={16} className="text-brand-pink" />
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto p-8 bg-gray-50/50 rounded-t-[3rem] border-t border-gray-100">
                        {user && (
                            <div className="mb-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-brand-pink text-white flex items-center justify-center font-black text-xl">
                                    {user.first_name?.[0]}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg font-bold text-gray-900 leading-tight">{user.first_name}</span>
                                    <Link href="/loyalty" className="flex items-center gap-1.5 mt-1" onClick={() => setIsMenuOpen(false)}>
                                        <Star size={12} className="text-brand-pink fill-brand-pink" />
                                        <span className="text-[13px] font-medium text-brand-pink">{loyaltyData?.stats?.points?.toLocaleString() || 0} Points</span>
                                    </Link>
                                </div>
                            </div>
                        )}
                        {user?.email === 'mouffaq@nayalc.com' && (
                            <button 
                                onClick={() => { router.push('/admin'); setIsMenuOpen(false); }}
                                className="w-full mb-3 bg-white border border-gray-100 text-gray-900 rounded-2xl h-14 font-black tracking-widest text-[12px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-sm"
                            >
                                <ShieldCheck size={16} className="text-brand-pink" strokeWidth={2.5} />
                                Admin Panel
                            </button>
                        )}
                        <button 
                            onClick={() => { router.push(user ? '/account' : '/auth'); setIsMenuOpen(false); }}
                            className="w-full bg-gray-900 text-white rounded-2xl h-14 font-black tracking-widest text-[12px] active:scale-95 transition-all shadow-xl"
                        >
                            {user ? 'My Account' : 'Sign In'}
                        </button>
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

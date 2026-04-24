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
            <Link href="/" className="md:static absolute left-1/2 -translate-x-1/2 flex items-center gap-[14px] shrink-0 transition-all active:scale-95">
                <Image
                  src="/Adobe Express - file (5).png"
                  alt="Naya Lumière Cosmetics"
                  height={42}
                  width={140}
                  className="h-[32px] md:h-[42px] w-auto object-contain shrink-0"
                  priority
                />
                {/* Brand name text — collapses when scrolled */}
                <motion.div
                  initial={false}
                  animate={{
                    opacity: isScrolled ? 0 : 1,
                    maxWidth: isScrolled ? 0 : 250,
                    marginLeft: isScrolled ? 0 : 0,
                  }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <div style={{ textAlign: 'left', lineHeight: '1' }}>
                    <div
                      style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        letterSpacing: '0.05em', 
                        color: '#3b0764', 
                        textTransform: 'uppercase', 
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" 
                      }}
                    >
                      NAYA
                    </div>
                    <div
                      style={{ 
                        fontSize: '12px', 
                        fontStyle: 'italic', 
                        fontFamily: "Georgia, 'Times New Roman', serif", 
                        color: '#6b21a8',
                        marginTop: '0px'
                      }}
                    >
                      Lumière Cosmetics
                    </div>
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
                    <Search size={18} strokeWidth={2} className="text-[#3b0764]" />
                </Button>

                <div className="flex items-center gap-2">
                    {/* Account button — desktop only (mobile uses bottom nav) */}
                    <div className="relative group/account hidden md:block">
                        <button
                          type="button"
                          onClick={handleAccountClick}
                          className="flex items-center gap-3 rounded-full px-1.5 py-1.5 transition-all hover:bg-white/50 backdrop-blur-sm group/btn"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/40 shadow-sm transition-all group-hover/btn:bg-white group-hover/btn:shadow-md group-hover/btn:scale-105 overflow-hidden">
                              {user?.profile_image ? (
                                <img src={user.profile_image} alt={user.first_name} className="w-full h-full object-cover" />
                              ) : (
                                <User size={18} strokeWidth={2} className="text-[#3b0764] transition-transform" />
                              )}
                          </div>
                          {user && (
                              <div className="hidden lg:flex flex-col items-start justify-center pr-3">
                                  <span className="text-[12px] font-black tracking-widest text-[#3b0764] uppercase leading-none">
                                      {user.first_name}
                                  </span>
                                  <div className="flex items-center gap-1 mt-0.5">
                                      <Star size={10} style={{ color: 'var(--cl-purple)', fill: 'var(--cl-purple)' }} />
                                      <span className="text-[10px] font-bold tracking-widest text-brand-pink uppercase">
                                          {loyaltyData?.stats?.points?.toLocaleString() || 0} Points
                                      </span>
                                  </div>
                              </div>
                          )}
                        </button>

                        {/* Admin Dropdown on Hover */}
                        {user?.email === 'mouffaq.dalloul@nayalc.com' && (
                            <div className="absolute top-full right-0 w-48 pt-2 z-[200] opacity-0 invisible group-hover/account:opacity-100 group-hover/account:visible transition-all duration-300">
                                <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-white/40 overflow-hidden transform translate-y-2 group-hover/account:translate-y-0 transition-all duration-300">
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
                            </div>
                        )}
                    </div>
                </div>

                <Button
                type="button"
                onClick={() => router.push('/cart')}
                className="relative shadow-sm bg-white border-2 border-[#c4b5fd] size-11 flex items-center justify-center rounded-full p-0 transition-all active:scale-95 hover:bg-[#f5f3ff] hover:border-[#a78bfa] group"
                aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
                >
                <ShoppingBag size={18} strokeWidth={2} className="text-[#3b0764] group-hover:text-[#7e22ce] transition-colors" />
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

        {/* Full-Screen Search Overlay — Redesigned for Premium Luxury */}
        <AnimatePresence mode="wait">
            {isSearchOpen && <motion.div
                key="search-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="fixed inset-0 z-[300] bg-white/60 backdrop-blur-2xl flex flex-col overflow-hidden"
                onClick={(e) => { if (e.target === e.currentTarget) setIsSearchOpen(false); }}
            >
                {/* ── Dreamy Background Atmosphere ── */}
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.1, 0.2, 0.1],
                            x: [-50, 50, -50],
                            y: [-30, 30, -30]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#c4b5fd]/30 rounded-full blur-[120px]"
                    />
                    <motion.div
                        animate={{ 
                            scale: [1.2, 1, 1.2],
                            opacity: [0.08, 0.15, 0.08],
                            x: [50, -50, 50],
                            y: [30, -30, 30]
                        }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#f9a8d4]/20 rounded-full blur-[100px]"
                    />
                </div>

                <div className="max-w-4xl mx-auto w-full px-6 md:px-10 pt-24 md:pt-40 relative z-10">
                    {/* ── Header Area ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="mb-12"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-10 h-px bg-gradient-to-r from-[#9333ea] to-transparent"></span>
                            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#9333ea]">Discover Luxury Care</span>
                        </div>
                        
                        <div className="flex justify-between items-start gap-10">
                            <h2 className="text-4xl md:text-6xl font-serif italic text-gray-900 leading-tight">
                                Find Your{' '}
                                <span className="font-sans not-italic font-black text-transparent bg-clip-text bg-gradient-to-r from-[#c4b5fd] via-[#9333ea] to-[#7e22ce]">Radiance.</span>
                            </h2>
                            <Button 
                                type="button" 
                                variant="pillGlass" 
                                size="pillIcon" 
                                onClick={() => setIsSearchOpen(false)} 
                                className="shrink-0 bg-white/50 border-gray-100/50 hover:bg-white hover:scale-110 shadow-lg transition-all duration-300" 
                                aria-label="Close search"
                            >
                                <X size={20} className="text-gray-900" />
                            </Button>
                        </div>
                    </motion.div>

                    {/* ── Input Composition ── */}
                    <motion.form 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        onSubmit={handleSearch} 
                        className="relative flex items-center gap-6 group mb-20"
                    >
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-transform duration-500 group-focus-within:scale-110">
                            <Search size={32} strokeWidth={1.5} className="text-[#9333ea]" />
                        </div>
                        <input
                            autoFocus
                            type="text"
                            placeholder="What are you looking for?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-2xl md:text-5xl font-bold bg-transparent border-none pl-14 pr-4 py-4 focus:ring-0 focus:outline-none placeholder:text-gray-200 text-gray-900 tracking-tight transition-all duration-500"
                        />
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 overflow-hidden rounded-full">
                            <motion.div 
                                initial={{ x: '-100%' }}
                                whileInView={{ x: 0 }}
                                className="h-full w-full bg-gradient-to-r from-[#c4b5fd] via-[#9333ea] to-[#7e22ce]"
                            />
                        </div>
                    </motion.form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
                        {/* ── Popular Searches ── */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="space-y-6"
                        >
                            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400 flex items-center gap-3">
                                <span className="w-4 h-4 rounded-full bg-[#f5f3ff] flex items-center justify-center text-[#9333ea]">
                                    <Sparkles size={8} />
                                </span>
                                Popular Trends
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {['Anti-Aging', 'Serums', 'Hydration', 'Fragrance', 'Gift Sets', 'GERnétic'].map((q, i) => (
                                    <motion.button
                                        key={q}
                                        whileHover={{ y: -4, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => { setSearchQuery(q); router.push(`/search?q=${q}`); setIsSearchOpen(false); }}
                                        className="px-5 py-2.5 bg-white/50 backdrop-blur-md border border-[#f3e8ff] rounded-2xl text-[11px] font-black tracking-widest uppercase text-gray-600 hover:text-[#9333ea] hover:border-[#c4b5fd] hover:bg-white shadow-sm hover:shadow-xl transition-all duration-300"
                                    >
                                        {q}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>

                        {/* ── Quick Exploration ── */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="space-y-6"
                        >
                            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400 flex items-center gap-3">
                                <span className="w-4 h-4 rounded-full bg-[#f5f3ff] flex items-center justify-center text-[#9333ea]">
                                    <Layers size={8} />
                                </span>
                                Quick Links
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { label: 'New Arrivals', href: '/new-arrivals', desc: 'Shop the latest innovations' },
                                    { label: 'All Products', href: '/all-products', desc: 'Explore the full collection' },
                                    { label: 'Gift Sets', href: '/gift-sets', desc: 'Luxury for someone special' },
                                ].map((link, i) => (
                                    <motion.button
                                        key={link.href}
                                        whileHover={{ x: 8 }}
                                        onClick={() => { router.push(link.href); setIsSearchOpen(false); }}
                                        className="flex items-center gap-4 w-full text-left p-4 rounded-2xl hover:bg-white/60 transition-all duration-300 group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] flex items-center justify-center text-[#9333ea] group-hover:scale-110 group-hover:bg-[#9333ea] group-hover:text-white transition-all duration-500">
                                            <ArrowRight size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-black text-gray-900 group-hover:text-[#9333ea] transition-colors">{link.label}</p>
                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">{link.desc}</p>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>}
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
                        <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-[14px]">
                            <Image src="/Adobe Express - file (5).png" alt="Naya Lumière Cosmetics" height={42} width={140} className="h-[36px] w-auto object-contain" />
                            <div style={{ textAlign: 'left', lineHeight: '1' }}>
                                <div
                                style={{ 
                                    fontSize: '18px', 
                                    fontWeight: '600', 
                                    letterSpacing: '0.05em', 
                                    color: '#3b0764', 
                                    textTransform: 'uppercase', 
                                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" 
                                }}
                                >
                                NAYA
                                </div>
                                <div
                                style={{ 
                                    fontSize: '12px', 
                                    fontStyle: 'italic', 
                                    fontFamily: "Georgia, 'Times New Roman', serif", 
                                    color: '#6b21a8',
                                    marginTop: '0px'
                                }}
                                >
                                Lumière Cosmetics
                                </div>
                            </div>
                        </Link>
                        <Button type="button" variant="pillSecondary" size="pillIcon" onClick={() => setIsMenuOpen(false)} className="active:scale-95 bg-white shadow-sm border border-gray-100" aria-label="Close menu">
                            <X size={18} className="text-[#3b0764]" />
                        </Button>
                    </div>
                    
                    <div className="flex-1 flex flex-col py-6 overflow-y-auto">
                        <div className="px-4 gap-2 flex flex-col mb-4">
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
                                    className="flex items-center justify-between px-6 py-4 rounded-2xl text-[15px] font-medium tracking-tight text-gray-900 active:bg-[#f5f3ff] hover:bg-gray-50 transition-all group"
                                    style={{ fontFamily: "'Instrument Sans', sans-serif" }}
                                >
                                    <span className="group-active:translate-x-1 transition-transform capitalize">{item.label.toLowerCase()}</span>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-active:text-[#9333ea] transition-all">
                                        <ChevronRight size={14} />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Mobile Concerns Section */}
                        {concerns && concerns.length > 0 && (
                            <div className="bg-[#fdfaff]/50 px-6 py-8 rounded-[2rem] mx-4 mb-4 border border-[#f3e8ff]/50">
                                <span className="text-[9px] font-black tracking-[0.4em] uppercase text-[#9333ea]/60 mb-6 block px-2">Targeted Concerns</span>
                                <div className="grid grid-cols-1 gap-2">
                                    {concerns.map((concern, i) => {
                                        const { icon: Icon } = getConcernMeta(concern.name);
                                        return (
                                            <motion.button
                                                key={concern.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05, duration: 0.3 }}
                                                onClick={() => { router.push(`/search?q=${concern.name}`); setIsMenuOpen(false); }}
                                                className="flex items-center gap-4 p-3 rounded-xl bg-white/40 border border-transparent active:border-[#c4b5fd] active:bg-white transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-white border border-[#f3e8ff] flex items-center justify-center text-[#9333ea] shadow-sm group-active:scale-95 transition-transform">
                                                    <Icon size={16} strokeWidth={1.5} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[12px] font-bold text-gray-900">{concern.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Shop Solution</p>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        
                        <div className="px-4 gap-2 flex flex-col mb-10">
                            {[
                                { label: 'Wishlist', path: '/wishlist' },
                                { label: 'Sales', path: '/sales' },
                            ].map((item) => (
                                <button 
                                    key={item.path}
                                    onClick={() => { router.push(item.path); setIsMenuOpen(false); }} 
                                    className="flex items-center justify-between px-6 py-4 rounded-2xl text-[15px] font-medium tracking-tight text-gray-900 active:bg-[#f5f3ff] hover:bg-gray-50 transition-all group"
                                    style={{ fontFamily: "'Instrument Sans', sans-serif" }}
                                >
                                    <span className="group-active:translate-x-1 transition-transform capitalize">{item.label.toLowerCase()}</span>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-active:text-[#9333ea] transition-all">
                                        <ChevronRight size={14} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto p-6 bg-white/80 backdrop-blur-xl rounded-t-[3rem] border-t border-[#f3e8ff]/50 shadow-[0_-20px_40px_-20px_rgba(147,51,234,0.1)]">
                        {user && (
                            <div className="mb-6 flex items-center gap-4 px-2">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c4b5fd] to-[#9333ea] text-white flex items-center justify-center font-black text-xl shadow-lg overflow-hidden">
                                    {user?.profile_image ? (
                                        <img src={user.profile_image} alt={user.first_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <>{user.first_name?.[0]}</>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg font-black tracking-tight text-gray-900 leading-tight">{user.first_name}</span>
                                    <Link href="/loyalty" className="flex items-center gap-1.5 mt-1" onClick={() => setIsMenuOpen(false)}>
                                        <div className="w-4 h-4 rounded-full bg-[#fdf2f8] flex items-center justify-center">
                                            <Star size={8} className="text-brand-pink fill-brand-pink" />
                                        </div>
                                        <span className="text-[11px] font-black tracking-widest text-brand-pink uppercase">{loyaltyData?.stats?.points?.toLocaleString() || 0} Points</span>
                                    </Link>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex flex-col gap-3">
                            {user?.email === 'mouffaq.dalloul@nayalc.com' && (
                                <button 
                                    onClick={() => { router.push('/admin'); setIsMenuOpen(false); }}
                                    className="w-full bg-white border border-[#e8d5ff] text-[#9333ea] rounded-full h-14 font-medium tracking-tight text-[13px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_4px_12px_rgba(147,51,234,0.05)]"
                                    style={{ fontFamily: "'Instrument Sans', sans-serif" }}
                                >
                                    <ShieldCheck size={16} strokeWidth={2.5} />
                                    Admin panel
                                </button>
                            )}
                            
                            <button 
                                onClick={() => { router.push(user ? '/account' : '/auth'); setIsMenuOpen(false); }}
                                className="w-full bg-gradient-to-r from-[#d8b4fe] to-[#a78bfa] text-white rounded-full h-14 font-medium tracking-tight text-[13px] active:scale-[0.98] transition-all shadow-[0_10px_25px_-5px_rgba(167,139,250,0.4)] flex items-center justify-center gap-3"
                                style={{ fontFamily: "'Instrument Sans', sans-serif" }}
                            >
                                <User size={16} strokeWidth={2.5} />
                                {user ? 'My account' : 'Sign in'}
                            </button>
                        </div>
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

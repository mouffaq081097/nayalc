'use client';

import { useState, useEffect, forwardRef } from 'react';
import { ShoppingBag, Search, Menu, X, User, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NayaLumiereLogo } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

const Header = forwardRef((props, ref) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { cartItems } = useCart();
  const { user } = useAuth();
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
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out ${
          isScrolled ? 'pt-4 px-4' : 'pt-0 px-0'
        }`}
      >
        <div className={`mx-auto transition-all duration-500 ease-in-out flex flex-col ${isScrolled ? 'max-w-6xl bg-white/80 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white/40 rounded-[2.5rem] overflow-hidden' : 'max-w-full bg-white border-b border-gray-100'}`}>
            <div 
            className={`w-full flex items-center justify-between gap-4 md:gap-8 px-6 md:px-10 transition-all duration-500 ease-in-out ${
                isScrolled ? 'h-16 md:h-18' : 'h-14 md:h-16'
            }`}
            >
            
            {/* Left: Mobile Menu & Desktop Nav */}
            <div className="flex items-center gap-6 flex-1">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden p-2 text-[#1d1d1f] hover:text-brand-pink transition-colors"
                >
                    {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                <nav className="hidden md:flex items-center gap-8">
                    {[
                    { name: 'Store', href: '/all-products' },
                    { name: 'Skincare', href: '/SkinCare' },
                    { name: 'Fragrance', href: '/fragrance' },
                    { name: 'Collections', href: '/collections' },
                    ].map(link => (
                    <Link 
                        key={link.name} 
                        href={link.href} 
                        className="text-[12px] font-bold uppercase tracking-[0.15em] text-gray-500 hover:text-brand-pink transition-all"
                    >
                        {link.name}
                    </Link>
                    ))}
                </nav>
            </div>

            {/* Center: Logo */}
            <Link href="/" className="flex items-center shrink-0 transition-all active:scale-95 group">
                <NayaLumiereLogo className={`transition-all duration-700 ${isScrolled ? 'h-6 md:h-8' : 'h-8 md:h-10'} w-auto`} />
            </Link>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
                <button 
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className="p-2.5 text-gray-600 hover:text-brand-pink transition-colors rounded-full hover:bg-gray-50"
                >
                    <Search size={18} strokeWidth={2} />
                </button>

                <button 
                onClick={handleAccountClick} 
                className="group flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-all"
                >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-brand-pink group-hover:text-white transition-all">
                    <User size={16} strokeWidth={2} />
                </div>
                {user && (
                    <span className="hidden lg:block text-[11px] font-black tracking-widest uppercase text-gray-900">
                        {user.first_name}
                    </span>
                )}
                </button>

                <button 
                onClick={() => router.push('/cart')} 
                className="relative p-2.5 bg-gray-900 text-white rounded-full hover:bg-brand-pink transition-all active:scale-95 shadow-lg"
                >
                <ShoppingBag size={18} strokeWidth={2} />
                {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand-pink text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
                    {cartCount}
                    </span>
                )}
                </button>
            </div>
            </div>
        </div>

        {/* Brand Search Overlay */}
        <AnimatePresence>
            {isSearchOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-4 right-4 mt-2 bg-white/90 backdrop-blur-2xl rounded-[2rem] border border-white/40 shadow-2xl overflow-hidden z-[110]"
                >
                    <div className="max-w-3xl mx-auto px-8 py-10">
                        <form onSubmit={handleSearch} className="relative flex items-center gap-4 border-b-2 border-gray-100 pb-4">
                            <Search size={22} className="text-brand-pink" />
                            <input 
                                autoFocus
                                type="text"
                                placeholder="Search the collection..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-xl md:text-2xl font-bold bg-transparent border-none focus:ring-0 placeholder:text-gray-300 text-gray-900"
                            />
                            <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </form>
                        <div className="mt-6 flex flex-wrap gap-2">
                            {['Anti-Aging', 'Serums', 'Fragrance', 'Gift Sets'].map(q => (
                                <button 
                                    key={q}
                                    onClick={() => { setSearchQuery(q); router.push(`/search?q=${q}`); setIsSearchOpen(false); }}
                                    className="px-4 py-1.5 bg-gray-100 hover:bg-brand-pink hover:text-white rounded-full text-[11px] font-black uppercase tracking-widest transition-all"
                                >
                                    {q}
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
                    transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                    className="absolute top-0 left-0 bottom-0 w-[80%] bg-white shadow-2xl flex flex-col rounded-r-[3rem]"
                >
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                        <NayaLumiereLogo className="h-6 w-auto" />
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full bg-white shadow-sm border border-gray-100">
                            <X size={18} />
                        </button>
                    </div>
                    
                    <div className="flex flex-col py-6">
                        {[
                            { label: 'New Arrivals', path: '/new-arrivals' },
                            { label: 'Skincare', path: '/SkinCare' },
                            { label: 'Fragrance', path: '/fragrance' },
                            { label: 'Collections', path: '/collections' },
                            { label: 'Sales', path: '/sales' },
                        ].map((item) => (
                            <button 
                                key={item.path}
                                onClick={() => { router.push(item.path); setIsMenuOpen(false); }} 
                                className="flex items-center justify-between px-10 py-5 text-[13px] font-black uppercase tracking-[0.2em] text-gray-900 active:bg-gray-50 border-b border-gray-50 last:border-0"
                            >
                                {item.label}
                                <ChevronRight size={16} className="text-brand-pink" />
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto p-8 bg-gray-50/50 rounded-t-[3rem] border-t border-gray-100">
                        <button 
                            onClick={() => { router.push(user ? '/account' : '/auth'); setIsMenuOpen(false); }}
                            className="w-full bg-gray-900 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[12px] active:scale-95 transition-all shadow-xl"
                        >
                            {user ? 'MY ACCOUNT' : 'SIGN IN'}
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

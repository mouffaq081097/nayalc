import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, Heart, Menu, X, MapPin, User, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

import { Container } from './ui/Container';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import React, { forwardRef, useLayoutEffect } from 'react';

import { MainSubNavBar } from './MainSubNavBar';
import { TopBar } from './TopBar'; // Import TopBar
import { NayaLumiereLogo } from './Icons';
import Link from 'next/link';

const Header = forwardRef(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  const { cartItems } = useCart();

  const { user } = useAuth();

  const router = useRouter();

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const [searchQuery, setSearchQuery] = useState('');

  const [loyaltyPoints] = useState(1250); // Mock loyalty points

  const topBarRef = useRef(null);

  const [topBarHeight, setTopBarHeight] = useState(0);
  const [isSticky, setIsSticky] = useState(false);

  useLayoutEffect(() => {
    if (topBarRef.current) {
      setTopBarHeight(topBarRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > topBarHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [topBarHeight]);






  const handleAccountClick = () => {

    if (user) {

      router.push('/account');

    } else {

      router.push('/auth');

    }

  };



  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${searchQuery}`);
    }
  };



        return (
          <>
            <div ref={topBarRef} className="hidden md:block">
              <TopBar />
            </div>

            <header 
              className={`sticky top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
                isSticky 
                  ? 'md:top-2 px-4 py-2' 
                  : 'bg-white border-b border-gray-100'
              } ${isSticky ? '' : 'bg-white'}`}
            >
              <div 
                className={`w-full transition-all duration-500 ${
                  isSticky 
                    ? 'max-w-7xl mx-auto bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 rounded-[2rem] px-6 py-2' 
                    : 'container mx-auto px-4 py-3'
                }`}
              >
                {/* Mobile Header */}
                <div className="md:hidden flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="rounded-full hover:bg-gray-100"
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                        
                        <Link href="/" className="flex items-center transform transition-transform active:scale-95">
                            <NayaLumiereLogo className="h-7 w-auto" />
                        </Link>

                        <button onClick={() => router.push('/cart')} className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                          <ShoppingBag className="h-5 w-5 text-gray-700" />
                          {cartCount > 0 && (
                            <span className="absolute top-1 right-1 bg-[var(--brand-pink)] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
                              {cartCount}
                            </span>
                          )}
                        </button>
                    </div>
                    
                    <div className="px-1">
                        <form onSubmit={handleSearch} className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[var(--brand-pink)] transition-colors" />
                            <Input
                                type="text"
                                placeholder="What are you looking for?"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 h-11 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-pink-100 rounded-2xl transition-all"
                            />
                        </form>
                    </div>
                </div>

                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between gap-8">
                  <Link href="/" className="flex items-center shrink-0 group">
                      <NayaLumiereLogo className="h-9 w-auto group-hover:opacity-80 transition-opacity" />
                  </Link>

                  {/* Location Selector */}
                  <button 
                    onClick={() => user ? router.push('/account?tab=addresses') : router.push('/auth')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-2xl hover:bg-gray-50 transition-all group shrink-0"
                  >
                    <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                      <MapPin className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Deliver to</span>
                      <span className="text-xs font-black text-gray-900 leading-none">UAE</span>
                    </div>
                  </button>

                  {/* Search Bar - Desktop */}
                  <div className="flex-1 max-w-2xl">
                    <form onSubmit={handleSearch} className="relative flex group">
                      <div className="flex items-center flex-1 bg-gray-50 group-focus-within:bg-white border border-transparent group-focus-within:border-pink-100 group-focus-within:ring-4 group-focus-within:ring-pink-50 rounded-[1.25rem] transition-all overflow-hidden shadow-sm group-focus-within:shadow-md">
                        <div className="pl-4 pr-2 text-gray-400">
                          <Search className="h-4 w-4" />
                        </div>
                        <Input
                          type="text"
                          placeholder="Search for brands, products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1 h-11 bg-transparent border-none focus:ring-0 focus-visible:ring-0 px-2 text-sm"
                        />
                        <button type="submit" className="h-11 px-6 bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors">
                          SEARCH
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Right Icons */}
                  <div className="flex items-center gap-1">
                    {/* Account */}
                    <button 
                      onClick={handleAccountClick} 
                      className="flex items-center gap-3 px-4 py-2 rounded-[1.25rem] hover:bg-gray-50 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center group-hover:from-[var(--brand-blue)]/5 group-hover:to-[var(--brand-pink)]/5 transition-all">
                        <User className="h-4 w-4 text-gray-600 group-hover:text-[var(--brand-pink)]" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none mb-0.5">
                          {user ? `Hello, ${user.first_name || user.name}` : 'Sign In'}
                        </span>
                        <span className="text-xs font-black text-gray-900 leading-none">ACCOUNT</span>
                      </div>
                    </button>

                    {/* Favorites */}
                    <button 
                      onClick={() => user ? router.push('/account?tab=wishlist') : router.push('/auth')} 
                      className="relative p-2.5 rounded-xl hover:bg-pink-50 text-gray-600 hover:text-[var(--brand-pink)] transition-all group"
                    >
                      <Heart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <Badge className="absolute -top-0.5 -right-0.5 bg-[var(--brand-pink)] text-white text-[9px] font-bold h-4 w-4 p-0 flex items-center justify-center border-2 border-white rounded-full">
                          2
                      </Badge>
                    </button>

                    {/* Cart */}
                    <button 
                      onClick={() => router.push('/cart')} 
                      className="relative p-2.5 rounded-xl hover:bg-blue-50 text-gray-600 hover:text-[var(--brand-blue)] transition-all group ml-1"
                    >
                      <ShoppingBag className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      {cartCount > 0 && (
                        <Badge className="absolute -top-0.5 -right-0.5 bg-gray-900 text-white text-[9px] font-bold h-4 w-4 p-0 flex items-center justify-center border-2 border-white rounded-full">
                          {cartCount}
                        </Badge>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <div className={`transition-all duration-300 ${isSticky ? 'hidden md:block opacity-50' : 'block'}`}>
              <MainSubNavBar loyaltyPoints={loyaltyPoints} user={user} />
            </div>

            {/* Mobile Navigation Sidebar */}
            <div className={`md:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                 onClick={() => setIsMenuOpen(false)}
            >
                <nav 
                  className={`fixed top-0 left-0 h-full w-[80%] bg-white shadow-2xl transition-transform duration-500 ease-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <NayaLumiereLogo className="h-6 w-auto" />
                    <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)} className="rounded-full">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-col py-4">
                    {[
                      { label: 'New Arrivals', path: '/new-arrivals' },
                      { label: 'Skincare', path: '/SkinCare' },
                      { label: 'All Products', path: '/all-products' },
                      { label: 'Fragrance', path: '/fragrance' },
                      { label: 'Collections', path: '/collections' },
                      { label: 'Gift Sets', path: '/gift-sets' },
                      { label: 'Sales', path: '/sales' },
                    ].map((item) => (
                      <button 
                        key={item.path}
                        onClick={() => { router.push(item.path); setIsMenuOpen(false); }} 
                        className="flex items-center justify-between px-6 py-4 text-gray-700 hover:text-[var(--brand-pink)] hover:bg-pink-50/30 transition-all font-medium border-b border-gray-50 last:border-0"
                      >
                        {item.label}
                        <ChevronRight className="h-4 w-4 opacity-30" />
                      </button>
                    ))}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-50">
                    <Button 
                      onClick={() => { router.push(user ? '/account' : '/auth'); setIsMenuOpen(false); }}
                      className="w-full bg-black text-white rounded-2xl h-12 font-bold"
                    >
                      {user ? 'MY ACCOUNT' : 'SIGN IN / REGISTER'}
                    </Button>
                  </div>
                </nav>
              </div>
          </>
        );
});

Header.displayName = 'Header';

export default Header;
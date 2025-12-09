import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, Heart, Menu, X, MapPin } from 'lucide-react';
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

                          <div className={`bg-white border-b border-gray-100 w-full ${isSticky ? 'shadow-md' : ''}`}>              <Container className="py-2">
                {/* Mobile Header */}
                <div className="md:hidden flex flex-col">
                    {/* Top Row: Logo */}
                    <div className="flex justify-center py-3 border-b border-gray-100">
                        <Link href="/" className="flex items-center">
                            <NayaLumiereLogo className="h-8 w-auto" />
                        </Link>
                    </div>
                    {/* Bottom Row: Sub-nav */}
                    <div className="flex items-center justify-between gap-2 p-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                        <div className="flex-1">
                            <form onSubmit={handleSearch} className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 h-10 bg-gray-100 border-transparent focus:bg-white focus:border-gray-300 rounded-full"
                                />
                            </form>
                        </div>
                    </div>
                </div>

                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between gap-4">
                  <Link href="/" className="flex items-center">
                      <NayaLumiereLogo className="h-8 w-auto" />
                  </Link>
                  {/* Location Selector Placeholder */}
                  <div className="flex items-center text-black bg-gray-100 hover:bg-gray-200 p-2 rounded-md cursor-pointer" onClick={() => user ? router.push('/account?tab=addresses') : router.push('/auth')}>
                    <MapPin className="h-5 w-5 mr-1" />
                    <div className="flex flex-col text-xs leading-tight">
                      <span className="text-black">Deliver to</span>
                      <span className="font-bold">UAE</span>
                    </div>
                  </div>

                  {/* Search Bar - Desktop */}
                  <div className="flex-1 max-w-4xl mx-6">
                    <form onSubmit={handleSearch} className="w-full relative flex">
                      <select className="border-r-0 rounded-l-md border-gray-200 bg-gray-100 text-sm focus:border-[var(--brand-pink)] focus:ring-[var(--brand-pink)]">
                        <option>All</option>
                      </select>
                      <Input
                        type="text"
                        placeholder="Search products, brands..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 pl-4 pr-4 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-[var(--brand-pink)] focus:ring-[var(--brand-pink)] rounded-l-none"
                      />
                      <Button type="submit" className="rounded-l-none bg-[var(--brand-pink)] hover:opacity-90">
                        <Search className="h-5 w-5 text-white" />
                      </Button>
                    </form>
                  </div>

                  {/* Right Icons - Enhanced with loyalty */}
                  <div className="flex items-center space-x-2 md:space-x-3">
                    {/* Loyalty Points - Desktop */}

                    {user && (
                        <button onClick={handleAccountClick} className="flex flex-col items-start justify-center p-1 rounded-md hover:bg-gray-100/50">
                            <span className="text-xs text-gray-500">Hello, {user.first_name || 'there!'}</span>
                            <span className="text-sm font-bold">Account & Lists</span>
                        </button>
                    )}

                    {!user && (
                        <div className="flex flex-col items-start justify-center p-1 rounded-md hover:bg-gray-100/50" onClick={handleAccountClick}>
                            <span className="text-xs text-gray-500">Hello, Sign In</span>
                            <span className="text-sm font-bold">Account & Lists</span>
                        </div>
                    )}

                    {/* Returns & Orders */}
                    {user && (
                        <button onClick={() => router.push('/account?tab=orders')} className="flex flex-col items-start justify-center p-1 rounded-md hover:bg-gray-100/50">
                            <span className="text-xs text-gray-500">Returns</span>
                            <span className="text-sm font-bold">& Orders</span>
                        </button>
                    )}

                    <button onClick={() => user ? router.push('/account?tab=wishlist') : router.push('/auth')} className="relative flex flex-col items-center justify-center p-1 rounded-md hover:bg-gray-100/50">
                      <Heart className="h-5 w-5" />
                      <span className="text-xs">Favorites</span>
                      <Badge className="absolute -top-1 -right-1 bg-[var(--brand-pink)] text-white text-xs h-4 w-4 p-0 flex items-center justify-center">
                          2
                      </Badge>
                    </button>

                    <button onClick={() => router.push('/cart')} className="relative flex flex-col items-center justify-center p-1 rounded-md hover:bg-gray-100/50">
                      <ShoppingBag className="h-5 w-5" />
                      <span className="text-xs">Cart</span>
                      {cartCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 bg-[var(--brand-pink)] text-white text-xs h-5 w-5 p-0 flex items-center justify-center">
                          {cartCount}
                        </Badge>
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <div className={`md:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-500 ease-in-out ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                     onClick={() => setIsMenuOpen(false)}
                >
                    <nav className={`fixed top-0 left-0 h-full w-3/4 bg-white shadow-lg ${isMenuOpen ? 'menu-slide-in' : 'menu-slide-out'}`}
                         onClick={(e) => e.stopPropagation()} // Prevent clicks on nav from closing it
                    >
                      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Menu</h2>
                        <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(false)}>
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="flex flex-col space-y-3 p-4">
                        <button onClick={() => { router.push('/new-arrivals'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left py-2">New Arrivals</button>
                        <button onClick={() => { router.push('/SkinCare'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left py-2">Skincare</button>
                        <button onClick={() => { router.push('/all-products'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left py-2">All Products</button>
                        <button onClick={() => { router.push('/fragrance'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left py-2">Fragrance</button>
                        <button onClick={() => { router.push('/collections'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left py-2">Collections</button>
                        <button onClick={() => { router.push('/gift-sets'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left py-2">Gift Sets</button>
                        <button onClick={() => { router.push('/sales'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left py-2">Sales</button>
                      </div>
                    </nav>
                  </div>
                </Container>
              </div>
            <div>
              <MainSubNavBar loyaltyPoints={loyaltyPoints} user={user} />
            </div>
          </>
        );
});

Header.displayName = 'Header';

export default Header;
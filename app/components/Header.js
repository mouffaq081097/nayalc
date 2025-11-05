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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

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

      console.log('Searching for:', searchQuery);

      // Handle search logic here

    }

  };



        return (
          <>
            <div ref={topBarRef} className="hidden md:block">
              <TopBar />
            </div>
            {isMobileSearchOpen && (
              <div className="md:hidden bg-white p-4 border-b border-gray-100">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1 text-gray-500"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </form>
              </div>
            )}
                          <div className={`bg-white border-b border-gray-100 sticky !top-0 z-50 w-full ${isSticky ? 'shadow-md' : ''}`}>              <Container className="py-2">
                <div className="flex items-center justify-between gap-4">
                  {/* Mobile Menu Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>

                  {/* Mobile Search Button */}
                  <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}>
                    <Search className="h-5 w-5" />
                  </Button>

                  {/* Logo */}
                  <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
              <NayaLumiereLogo className="h-10 w-auto" />
            </Link>                  </div>

                  {/* Location Selector Placeholder */}
                  <div className="hidden md:flex items-center text-black bg-gray-100 hover:bg-gray-200 p-2 rounded-md cursor-pointer" onClick={() => router.push('/account?tab=addresses')}>
                    <MapPin className="h-5 w-5 mr-1" />
                    <div className="flex flex-col text-xs leading-tight">
                      <span className="text-black">Deliver to</span>
                      <span className="font-bold">UAE</span>
                    </div>
                  </div>

                  {/* Search Bar - Desktop */}
                  <div className="hidden md:flex flex-1 max-w-4xl mx-6">
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

                    <Button variant="ghost" size="sm" className="md:hidden">
                      <Search className="h-5 w-5" />
                    </Button>

                    {user && (
                        <button onClick={handleAccountClick} className="hidden md:flex flex-col items-start justify-center p-1 rounded-md hover:bg-gray-100/50">
                            <span className="text-xs text-gray-500">Hello, {user.first_name || 'there!'}</span>
                            <span className="text-sm font-bold">Account & Lists</span>
                        </button>
                    )}

                    {!user && (
                        <div className="hidden md:flex flex-col items-start justify-center p-1 rounded-md hover:bg-gray-100/50" onClick={handleAccountClick}>
                            <span className="text-xs text-gray-500">Hello, Sign In</span>
                            <span className="text-sm font-bold">Account & Lists</span>
                        </div>
                    )}

                    {/* Returns & Orders */}
                    {user && (
                        <button onClick={() => router.push('/orders')} className="hidden md:flex flex-col items-start justify-center p-1 rounded-md hover:bg-gray-100/50">
                            <span className="text-xs text-gray-500">Returns</span>
                            <span className="text-sm font-bold">& Orders</span>
                        </button>
                    )}

                    {user && (
                      <button onClick={() => router.push('/account?tab=wishlist')} className="relative hidden md:flex flex-col items-center justify-center p-1 rounded-md hover:bg-gray-100/50">
                        <Heart className="h-5 w-5" />
                        <span className="text-xs">Favorites</span>
                        <Badge className="absolute -top-1 -right-1 bg-[var(--brand-pink)] text-white text-xs h-4 w-4 p-0 flex items-center justify-center">
                            2
                        </Badge>
                      </button>
                    )}

                    {user && (
                      <button onClick={() => router.push('/cart')} className="relative hidden md:flex flex-col items-center justify-center p-1 rounded-md hover:bg-gray-100/50">
                        <ShoppingBag className="h-5 w-5" />
                        <span className="text-xs">Cart</span>
                        {cartCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 bg-[var(--brand-pink)] text-white text-xs h-5 w-5 p-0 flex items-center justify-center">
                            {cartCount}
                          </Badge>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                  <nav className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
                    <div className="flex flex-col space-y-3">
                      {/* Loyalty Points - Mobile */}
                        <div className="border-t border-gray-100 my-2"></div>
                        <button onClick={() => { router.push('/new-arrivals'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left">New Arrivals</button>
                        <button onClick={() => { router.push('/SkinCare'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left">Skincare</button>
                        <button onClick={() => { router.push('/all-products'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left">All Products</button>
                        <button onClick={() => { router.push('/fragrance'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left">Fragrance</button>
                        <button onClick={() => { router.push('/collections'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left">Collections</button>
                        <button onClick={() => { router.push('/gift-sets'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left">Gift Sets</button>
                        <button onClick={() => { router.push('/sales'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left">Sales</button>
                      </div>
                    </nav>
                  )}
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
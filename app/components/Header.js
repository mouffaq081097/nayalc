import { useState, useEffect } from 'react';
import { ShoppingBag, Search, User, Heart, Menu, X, Star, Gift } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

import { Container } from './ui/Container';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItems } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loyaltyPoints] = useState(1250); // Mock loyalty points

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      {/* Top Bar - Enhanced with social proof */}
      <div className={`bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] text-white text-center transition-all duration-300 overflow-hidden ${
        isScrolled ? 'h-0 py-0' : 'h-10 py-2'
      }`}>
        <div className="flex items-center justify-center gap-4 text-sm">
          <span>✨ Free shipping on orders over 200 AED</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">🌟 Join 50,000+ happy customers</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">💎 Earn points with every purchase</span>
        </div>
      </div>

      {/* Main Header */}
      <Container className="py-4">
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

          {/* Logo */}
          <div className="flex-shrink-0">
            <button onClick={() => router.push('/')} className="text-left">
              <h1 className="text-2xl md:text-3xl font-serif bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                Naya Lumière Cosmetics
              </h1>
              <p className="text-xs text-gray-500 italic">Parisian Beauty</p>
            </button>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <form onSubmit={handleSearch} className="w-full relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-[var(--brand-pink)] focus:ring-[var(--brand-pink)]"
              />
            </form>
          </div>

          {/* Right Icons - Enhanced with loyalty */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Loyalty Points - Desktop */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/loyalty')}
            >
              <Star className="h-4 w-4 text-[var(--brand-pink)]" />
              <span className="text-sm">{loyaltyPoints.toLocaleString()}</span>
            </Button>

            <Button variant="ghost" size="sm" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1" onClick={handleAccountClick}>
              <User className="h-5 w-5" />
              {user ? <span className="text-sm">Hi, {user.username || 'there!'}</span> : null}
            </Button>
            
            <Button variant="ghost" size="sm" className="relative hidden md:flex" onClick={() => router.push('/account?tab=wishlist')}>
              <Heart className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 bg-[var(--brand-pink)] text-white text-xs h-4 w-4 p-0 flex items-center justify-center">
                2
              </Badge>
            </Button>
            
            <Button variant="ghost" size="sm" className="relative hidden md:flex" onClick={() => router.push('/cart')}>
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-[var(--brand-pink)] text-white text-xs h-5 w-5 p-0 flex items-center justify-center">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
            <div className="flex flex-col space-y-3">
              {/* Loyalty Points - Mobile */}
              <button 
                onClick={() => { router.push('/loyalty'); setIsMenuOpen(false); }} 
                className="flex items-center gap-2 text-[var(--brand-pink)] hover:text-[var(--brand-pink-dark)] transition-colors text-left font-medium"
              >
                <Star className="h-4 w-4" />
                <span>Loyalty Program ({loyaltyPoints.toLocaleString()} points)</span>
              </button>
              <div className="border-t border-gray-100 my-2"></div>
              <button onClick={() => { router.push('/new-arrivals'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left">New Arrivals</button>
              <button onClick={() => { router.push('/SkinCare'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left">Skincare</button>
              <button onClick={() => { router.push('/all-products'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left">All Products</button>
              <button onClick={() => { router.push('/fragrance'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left">Fragrance</button>
              <button onClick={() => { router.push('/collections'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left">Collections</button>
              <button onClick={() => { router.push('/gift-sets'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left">Gift Sets</button>
              <button onClick={() => { router.push('/sales'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-left">Sales</button>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10"
                />
              </form>
            </div>
                    </nav>
                  )}
                </Container>
          
                {/* Sub Navigation - Enhanced with loyalty */}
                <div className={`bg-gray-50 border-b border-gray-100 transition-all duration-300 ${
                  isScrolled ? 'opacity-0 h-0 py-0' : 'opacity-100 h-auto py-3'
                } overflow-hidden`}>
                  <div>
                    <nav className="hidden md:flex items-center justify-center space-x-8">
                      <button onClick={() => router.push('/new-arrivals')} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-sm">New Arrivals</button>
                      <button onClick={() => router.push('/SkinCare')} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-sm">Skincare</button>
                      <button onClick={() => router.push('/all-products')} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-sm">All Products</button>
                      <button onClick={() => router.push('/fragrance')} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-sm">Fragrance</button>
                      <button onClick={() => router.push('/collections')} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-sm">Collections</button>
                      <button onClick={() => router.push('/gift-sets')} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-sm">Gift Sets</button>
                      <button
                        onClick={() => router.push('/loyalty')}
                        className="text-[var(--brand-pink)] hover:text-[var(--brand-pink-dark)] transition-colors text-sm font-medium flex items-center gap-1"
                      >
                        <Gift className="h-3 w-3" />
                        Loyalty
                      </button>
                      <button onClick={() => router.push('/sales')} className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors text-sm">Sales</button>
                    </nav>
                  </div>
                </div>
              </header>
            );}
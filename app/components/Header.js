'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { NAV_LINKS } from '../constants';
import { Icon } from './Icon';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';

const HoverLink = ({ children, href, className, defaultColor, hoverColor }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Link
      href={href}
      className={className}
      style={{ color: isHovered ? hoverColor : defaultColor }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </Link>
  );
};

const HoverButton = ({ children, onClick, className, defaultColor, hoverColor }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      className={className}
      style={{ color: isHovered ? hoverColor : defaultColor }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
};

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      router.push(`/search?q=${searchQuery}`);
    }
  };
  const { user, logout, isAuthenticated } = useAuth();
  const { cart } = useAppContext();
  const pathname = usePathname();
  
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  
  const premiumLink = NAV_LINKS.find(link => link.name === 'Premium Beauty');
  const otherLinks = NAV_LINKS.filter(link => link.name !== 'Premium Beauty');

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 shadow-sm" style={{ backgroundColor: 'var(--brand-background)' }}>
      {/* Top Bar */}
      <div className="text-xs" style={{ backgroundColor: 'var(--brand-secondary)', color: 'var(--brand-muted)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-8">
          <div className="flex items-center space-x-4">
            <HoverLink href="#" className="flex items-center" defaultColor="var(--brand-muted)" hoverColor="var(--brand-blue)">
              <Icon name="map-pin" className="w-4 h-4 mr-1" />
              <span>Dubai</span>
            </HoverLink>
            <HoverLink href="#" className="hidden sm:flex items-center" defaultColor="var(--brand-muted)" hoverColor="var(--brand-blue)">
              <Icon name="store" className="w-4 h-4 mr-1" />
              <span>Find My Store</span>
            </HoverLink>
          </div>
          <div className="flex items-center space-x-4">
            <HoverLink href="#" defaultColor="var(--brand-muted)" hoverColor="var(--brand-blue)">Contact Us</HoverLink>
            <HoverLink href="#" defaultColor="var(--brand-muted)" hoverColor="var(--brand-blue)">EN</HoverLink>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile Menu Toggle */}
          <div className="lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2" style={{ color: 'var(--brand-text)' }}>
              <Icon name="menu" className="w-6 h-6" />
            </button>
          </div>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 text-center absolute left-1/2 -translate-x-1/2 lg:static lg:left-auto lg:translate-x-0">
            <h1 className="text-3xl sm:text-4xl font-serif tracking-wider">
              {/* Brand colors applied via inline style directly referencing CSS variables */}
              <span style={{ color: 'var(--brand-blue)' }}>Naya </span>
              <span style={{ color: 'var(--brand-pink)' }}>Lumière</span>
            </h1>
            <p className="hidden sm:block text-xs font-sans tracking-[0.3em] uppercase -mt-1" style={{ color: 'var(--brand-muted)' }}>Cosmetics</p>
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="search" className="w-5 h-5" style={{ color: 'var(--brand-muted)' }} />
              </div>
              <input
                type="text"
                placeholder="Search in Naya Lumière"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                style={{ backgroundColor: 'var(--brand-secondary)', borderColor: 'var(--brand-gray-100)', color: 'var(--brand-text)' }} /* bg-brand-secondary, border-gray-200, text-brand-text */
                className="block w-full border rounded-md py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 focus-border-brand-pink focus-ring-brand-pink"
              />
            </div>
          </div>
          
          {/* Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button onClick={() => setIsMobileSearchOpen(true)} className="lg:hidden p-2" style={{ color: 'var(--brand-text)' }}>
              <Icon name="search" className="w-6 h-6" />
            </button>

            

            
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <HoverLink href="/account" className="hidden sm:flex flex-col items-center text-xs font-medium transition-colors" defaultColor="var(--brand-muted)" hoverColor="var(--brand-blue)">
                  <Icon name="user" className="w-6 h-6" />
                  <span className="hidden lg:block mt-1">Welcome, {user.username}</span>
                </HoverLink>
                <HoverButton onClick={logout} className="hidden sm:flex flex-col items-center text-xs font-medium transition-colors" defaultColor="var(--brand-muted)" hoverColor="var(--brand-blue)">
                  <Icon name="logout" className="w-6 h-6" />
                  <span className="hidden lg:block mt-1">Logout</span>
                </HoverButton>
              </div>
            ) : (
              <HoverLink href="/auth" className="hidden sm:flex flex-col items-center text-xs font-medium transition-colors" defaultColor="var(--brand-muted)" hoverColor="var(--brand-blue)">
                  <Icon name="user" className="w-6 h-6" />
                  <span className="hidden lg:block mt-1">Login</span>
              </HoverLink>
            )}
            {isAuthenticated && (
              <HoverLink href="#" className="flex flex-col items-center text-xs font-medium transition-colors" defaultColor="var(--brand-muted)" hoverColor="var(--brand-blue)">
                <Icon name="heart" className="w-6 h-6" />
                <span className="hidden lg:block mt-1">Favorites</span>
              </HoverLink>
            )}
            {isAuthenticated && (
             <HoverLink href="/cart" className="relative hidden sm:flex flex-col items-center text-xs font-medium transition-colors" defaultColor="var(--brand-muted)" hoverColor="var(--brand-blue)">
              <Icon name="bag" className="w-6 h-6" />
              <span className="hidden lg:block mt-1">Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 right-0 text-white text-[10px] font-semibold rounded-full h-4 w-4 flex items-center justify-center" style={{ backgroundColor: 'var(--brand-pink)' }}>
                  {cartItemCount}
                </span>
              )}
            </HoverLink>
            )}
          </div>
        </div>
        {isMobileSearchOpen && (
          <div className="lg:hidden py-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="search" className="w-5 h-5" style={{ color: 'var(--brand-muted)' }} />
              </div>
              <input
                type="text"
                placeholder="Search in Naya Lumière"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                style={{ backgroundColor: 'var(--brand-secondary)', borderColor: 'var(--brand-gray-100)', color: 'var(--brand-text)' }}
                className="block w-full border rounded-md py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-1 focus-border-brand-pink focus-ring-brand-pink"
              />
              <button onClick={() => setIsMobileSearchOpen(false)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Icon name="x" className="w-5 h-5" style={{ color: 'var(--brand-muted)' }} />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Sub Navigation (Desktop) */}
       {/* Sub Navigation (Desktop) */}
       <nav className="hidden lg:block border-t" style={{ borderColor: 'rgba(229, 231, 235, 0.5)' }}>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative flex items-center justify-center h-12">
              
              {/* Left-aligned Premium link */}
              <div className="absolute left-8 h-full flex items-center">
                {premiumLink && (
                  <Link
                    href={premiumLink.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-sm font-semibold transition-colors duration-200 whitespace-nowrap px-3 py-1 rounded-full ${pathname === premiumLink.href ? 'font-bold cursor-default' : 'hover:opacity-80'}`}
                    style={{ backgroundColor: 'var(--brand-premium-bg)', color: 'var(--brand-blue)' }}
                  >
                    {premiumLink.name}
                  </Link>
                )}
              </div>

              {/* Centered links */}
              <div className="flex items-center space-x-6 overflow-x-auto no-scrollbar">
                {otherLinks.map((link) => {
                  const isPromo = link.name === 'Promotions';
                  const isBestSeller = link.name === 'Best Sellers';
                  let specialStyle = {};
                  if(isPromo) specialStyle = { backgroundColor: 'var(--brand-highlight-bg)', color: 'var(--brand-pink)' };
                  if(isBestSeller) specialStyle = { backgroundColor: 'var(--brand-highlight-bg)', color: 'var(--brand-pink)' };

                  const isActive = pathname === link.href;
                  const stateClasses = isActive
                    ? 'font-bold cursor-default'
                    : 'hover:text-brand-blue'; // Non-color classes remain

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`text-sm font-semibold transition-colors duration-200 whitespace-nowrap px-3 py-1 rounded-full ${stateClasses}`}
                      style={{
                        ...specialStyle,
                        color: isActive ? 'var(--brand-pink)' : 'var(--brand-text)',
                      }}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className={`fixed inset-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="relative w-4/5 max-w-sm h-full shadow-xl p-6 flex flex-col" style={{ backgroundColor: 'var(--brand-background)' }}>
                <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 p-2" style={{ color: 'var(--brand-text)' }}>
                    <Icon name="x" className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-serif mb-8" style={{ color: 'var(--brand-text)' }}>Menu</h2>
                <nav className="flex flex-col space-y-4">
                    {NAV_LINKS.map(link => (
                        <Link 
                            key={link.name} 
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`text-lg font-medium hover-brand-pink`}
                            style={{ color: pathname === link.href ? 'var(--brand-pink)' : 'var(--brand-text)' }}
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    </header>
  );
};

export default Header;
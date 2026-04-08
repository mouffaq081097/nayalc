'use client';
import { useState, useEffect, useRef } from 'react';
import { Home, User, Heart, MessageSquare, Search } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { Button } from './ui/button';
import { cn } from './ui/utils';

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'wishlist', icon: Heart, label: 'Wishlist' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'account', icon: User, label: 'Account' },
];

function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { isChatOpen, setIsChatOpen } = useAppContext();

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    lastScrollYRef.current = typeof window !== 'undefined' ? window.scrollY : 0;

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(() => {
        tickingRef.current = false;
        const y = window.scrollY;
        const prev = lastScrollYRef.current;
        if (Math.abs(y - prev) <= 10) return;
        if (y > prev && y > 50) setIsVisible(false);
        else setIsVisible(true);
        lastScrollYRef.current = y;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleItemClick = (itemId) => {
    if (itemId === 'chat') {
      setIsChatOpen(!isChatOpen);
      return;
    }

    const routeMap = {
      home: '/',
      account: '/account',
      search: '/search',
      wishlist: '/wishlist',
    };

    if (['account', 'wishlist'].includes(itemId) && !isAuthenticated) {
      router.push('/auth');
      return;
    }

    if (itemId === 'account') {
      router.push('/account');
      return;
    }

    router.push(routeMap[itemId] || `/${itemId}`);
  };

  const getActiveTab = () => {
    if (isChatOpen) return 'chat';
    if (pathname === '/') return 'home';
    if (pathname.includes('wishlist')) return 'wishlist';
    if (pathname.includes('search')) return 'search';
    if (pathname.includes('account')) return 'account';
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : 120 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none fixed left-0 right-0 z-[70] px-3 md:hidden"
      style={{
        bottom: 'max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.35rem))',
      }}
    >
      <nav
        className="pointer-events-auto mx-auto flex h-14 max-w-md items-stretch justify-between rounded-[var(--radius-card)] px-1 backdrop-blur-xl"
        style={{
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(253,248,255,0.88)',
          border: '1px solid var(--cl-glass-border)',
          boxShadow: '0 4px 20px rgba(147,51,234,0.08), 0 1px 6px rgba(196,167,254,0.15)',
          borderTop: '1px solid rgba(216,180,254,0.5)',
        }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <Button
              key={item.id}
              type="button"
              variant="navTab"
              onClick={() => handleItemClick(item.id)}
              className={cn(
                isActive ? 'text-[#1d1d1f]' : 'text-gray-400 hover:text-gray-500'
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200',
                  isActive ? 'text-white shadow-md' : 'bg-transparent'
                )}
              style={isActive ? { background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))' } : {}}
              >
                {item.id === 'account' && user ? (
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black',
                      isActive
                        ? 'text-white'
                        : 'text-white'
                    )}
                    style={isActive
                      ? { background: 'rgba(255,255,255,0.25)' }
                      : { background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))' }
                    }
                  >
                    {(user.name || user.first_name || 'U').charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.25 : 2} />
                )}
              </span>
              <span
                className={cn(
                  'max-w-[4.25rem] truncate text-center leading-tight',
                  isActive ? 'font-bold' : 'font-semibold text-gray-400'
                )}
              style={isActive ? { color: 'rgb(126,105,230)' } : {}}
              >
                {item.label}
              </span>
            </Button>
          );
        })}
      </nav>
    </motion.div>
  );
}

export default MobileBottomNav;

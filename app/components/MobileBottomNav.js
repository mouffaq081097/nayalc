'use client';
import { useState, useEffect } from 'react';
import { Home, ShoppingBag, Star, User, Heart, MessageSquare, Search } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';



const navItems = [
  { id: 'home', icon: Home, label: 'Home' },                                                     
  { id: 'wishlist', icon: Heart, label: 'Wishlist' },                                             
  { id: 'search', icon: Search, label: 'Search' },                                                
  { id: 'chat', icon: MessageSquare, label: 'Chat' },                                               
  { id: 'account', icon: User, label: 'Account' }
];

function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { cartItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { isChatOpen, setIsChatOpen } = useAppContext();
  
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        // Only trigger hide/show after scrolling more than 10px to avoid jitter
        if (Math.abs(window.scrollY - lastScrollY) > 10) {
          if (window.scrollY > lastScrollY && window.scrollY > 50) { // scrolling down
            setIsVisible(false);
          } else { // scrolling up
            setIsVisible(true);
          }
          setLastScrollY(window.scrollY);
        }
      }
    };

    window.addEventListener('scroll', controlNavbar);
    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="md:hidden fixed bottom-8 left-0 right-0 z-[70] px-6 pointer-events-none"
    >
      <nav className="max-w-md mx-auto bg-white/90 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[3rem] p-2 pointer-events-auto flex items-center justify-between relative">
        <AnimatePresence mode="popLayout">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className="relative flex items-center justify-center transition-all duration-500"
              >
                <motion.div
                  layout
                  initial={false}
                  animate={{
                    width: isActive ? 'auto' : '48px',
                    backgroundColor: isActive ? '#111827' : 'transparent',
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  className={`flex items-center gap-2 h-12 px-3 rounded-full ${
                    isActive ? 'text-white shadow-lg shadow-black/10' : 'text-gray-400'
                  }`}
                >
                  <div className="relative">
                    {item.id === 'account' && user ? (
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                        isActive ? 'bg-white text-gray-900' : 'bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-pink)] text-white'
                      }`}>
                        {(user.name || user.first_name || 'U').charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <item.icon 
                        className="h-5 w-5" 
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    )}
                  </div>

                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-xs font-bold whitespace-nowrap pr-1"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </motion.div>
              </button>
            );
          })}
        </AnimatePresence>
      </nav>
    </motion.div>
  );
}

export default MobileBottomNav;
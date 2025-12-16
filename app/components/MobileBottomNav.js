'use client';
import { Home, ShoppingBag, Star, User, Heart } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';



const navItems = [
  { id: 'home', icon: Home, label: 'Home' },                                                     
  { id: 'wishlist', icon: Heart, label: 'Wishlist' },                                             
  { id: 'loyalty', icon: Star, label: 'Rewards' },                                                
  { id: 'cart', icon: ShoppingBag, label: 'Cart' },                                               
  { id: 'account', icon: User, label: 'Account' }
];

function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const currentPage = pathname.substring(1);
  const { cartItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const handleItemClick = (itemId) => {
    if (itemId === 'cart') {
      router.push('/cart');
      return;
    }
    const routeMap = {
      home: '/',
      account: '/account',
      loyalty: '/loyalty',
      wishlist: '/wishlist',
    };

    const authenticatedRoutes = ['account', 'loyalty', 'wishlist'];

    if (authenticatedRoutes.includes(itemId) && !isAuthenticated) {
      router.push('/auth');
      return;
    }

    const route = routeMap[itemId] || `/${itemId}`;
    router.push(route);
  };

  const isActive = (itemId) => {
    const activeMap = {
      home: '',
      cart: 'cart',
      account: 'account',
      loyalty: 'loyalty',
      wishlist: 'wishlist',
    };
    return itemId in activeMap && activeMap[itemId] === currentPage;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Background with blur effect */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-lg border-t border-gray-100"></div>
      
      {/* Navigation Items */}
      <nav className="relative flex items-center justify-around px-2 py-2 safe-area-bottom">
        {navItems.map((item) => {
          const isItemActive = isActive(item.id);
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className="relative flex flex-col items-center justify-center p-3 min-w-[60px] group"
            >
              {/* Active indicator */}
              {isItemActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-[var(--brand-blue)]/10 to-[var(--brand-pink)]/10 rounded-2xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              {/* Icon Container */}
              <div className="relative">
                {item.id === 'account' && user ? (
                  // Display user image or initial if available
                  // For now, just display a placeholder or initial
                  <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <item.icon 
                    className={`h-6 w-6 transition-colors duration-200 ${
                      isItemActive 
                        ? 'text-[var(--brand-pink)]' 
                        : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                )}
                
                {/* Cart Badge */}
                {item.id === 'cart' && cartCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-[var(--brand-pink)] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </motion.div>
                )}

                {/* Loyalty Points Badge */}
                {item.id === 'loyalty' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center"
                  >
                    <Star className="h-2 w-2 fill-current" />
                  </motion.div>
                )}
              </div>
              
              {/* Label */}
              <span 
                className={`text-xs mt-1 transition-colors duration-200 ${
                  isItemActive 
                    ? 'text-[var(--brand-pink)]' 
                    : 'text-gray-400 group-hover:text-gray-600'
                }`}
              >
                {item.id === 'account' && user ? (user.first_name || user.username) : item.label}
              </span>
              
              {/* Active dot indicator */}
              {isItemActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-1 w-1 h-1 bg-[var(--brand-pink)] rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default MobileBottomNav;
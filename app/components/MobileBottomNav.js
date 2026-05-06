'use client';
import { useState, useEffect, useRef } from 'react';
import { Home, User, Heart, MessageSquare, Search } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import Image from 'next/image';

const NAV_ITEMS = [
  { id: 'home',     Icon: Home,          label: 'Home'    },
  { id: 'wishlist', Icon: Heart,         label: 'Wishlist'},
  { id: 'search',   Icon: Search,        label: 'Search'  },
  { id: 'chat',     Icon: MessageSquare, label: 'Chat'    },
  { id: 'account',  Icon: User,          label: 'Account' },
];

function MobileBottomNav() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { isChatOpen, setIsChatOpen } = useAppContext();

  const [isVisible, setIsVisible] = useState(true);
  const lastYRef   = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    lastYRef.current = window.scrollY;
    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(() => {
        tickingRef.current = false;
        const y = window.scrollY;
        if (Math.abs(y - lastYRef.current) > 10) {
          setIsVisible(y < lastYRef.current || y <= 50);
        }
        lastYRef.current = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = (id) => {
    if (id === 'chat') { setIsChatOpen(!isChatOpen); return; }
    if (['account', 'wishlist'].includes(id) && !isAuthenticated) { router.push('/auth'); return; }
    const map = { home: '/', account: '/account', search: '/search', wishlist: '/wishlist' };
    router.push(map[id] || `/${id}`);
  };

  const activeId = isChatOpen ? 'chat'
    : pathname === '/'              ? 'home'
    : pathname.includes('wishlist') ? 'wishlist'
    : pathname.includes('search')   ? 'search'
    : pathname.includes('account')  ? 'account'
    : 'home';

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : 120 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none fixed left-0 right-0 z-[70] px-3 md:hidden"
      style={{ bottom: 'max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.35rem))' }}
    >
      <nav
        className="pointer-events-auto mx-auto flex h-[60px] max-w-md items-stretch justify-between rounded-2xl px-1 bg-white border border-[#e5e5ea]"
        style={{ boxShadow: '0 4px 14px rgba(17,17,20,.08)' }}
      >
        {NAV_ITEMS.map(({ id, Icon, label }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleClick(id)}
              className="flex flex-1 flex-col items-center justify-center gap-[3px] rounded-xl transition-colors duration-[120ms] active:bg-[#f3f3f5]"
            >
              {/* icon container */}
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-[150ms]"
                style={active
                  ? { background: 'linear-gradient(90deg,#c087fc,#9869f7)', boxShadow: '0 2px 8px rgba(152,105,247,.35)' }
                  : {}}
              >
                {id === 'account' && user ? (
                  <div className="w-[22px] h-[22px] rounded-full overflow-hidden relative bg-[#f3f3f5] flex items-center justify-center">
                    {user.profile_image ? (
                      <Image src={user.profile_image} alt="Profile" fill className="object-cover" />
                    ) : (
                      <span className={`text-[11px] font-semibold ${active ? 'text-white' : 'text-[#5a5a64]'}`}>
                        {(user.first_name || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                ) : (
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.25 : 1.8}
                    className={active ? 'text-white' : 'text-[#5a5a64]'}
                  />
                )}
              </span>

              {/* label */}
              <span
                className="text-[10px] leading-none truncate"
                style={{
                  fontWeight: active ? 600 : 500,
                  color: active ? '#9869f7' : '#8a8a93',
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </motion.div>
  );
}

export default MobileBottomNav;

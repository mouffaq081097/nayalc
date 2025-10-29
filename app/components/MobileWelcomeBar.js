"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronLeft, ChevronRight, Gift, Star, ShoppingBag, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const personalCards = [
  {
    id: 1,
    title: "Get bonus points for registration",
    points: 100,
    iconType: "gift",
    type: "bonus"
  },
  {
    id: 2,
    title: "Your bonus points will be here",
    iconType: "star",
    type: "points"
  },
  {
    id: 3,
    title: "The status of your orders will be here",
    iconType: "bag",
    type: "orders"
  },
  {
    id: 4,
    title: "Our App is Coming Soon",
    iconType: "clock",
    type: "store"
  }
];

export function MobileWelcomeBar() {
  const { isAuthenticated } = useAuth();
  const [currentPersonalCard, setCurrentPersonalCard] = useState(0);

  const nextPersonalCard = () => {
    setCurrentPersonalCard((prev) => (prev + 1) % personalCards.length);
  };

  const prevPersonalCard = () => {
    setCurrentPersonalCard((prev) => (prev - 1 + personalCards.length) % personalCards.length);
  };

  const renderIcon = (iconType, className) => {
    switch (iconType) {
      case 'gift':
        return <Gift className={className} />;
      case 'star':
        return <Star className={className} />;
      case 'bag':
        return <ShoppingBag className={className} />;
      case 'clock':
        return <Clock className={className} />;
      default:
        return <Star className={className} />;
    }
  };

  if (isAuthenticated) {
    return null; // Only show when not authenticated
  }

  return (
    <div className="md:hidden bg-white border-b border-gray-100 py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-pink)] rounded-2xl flex items-center justify-center shadow-lg">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 mb-1">Welcome to Naya Lumière</p>
            <p className="text-sm text-gray-600">Sign in for exclusive benefits and personalized experience</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={prevPersonalCard}
              className="w-8 h-8 rounded-xl bg-white shadow-md flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-all duration-200"
              disabled={currentPersonalCard === 0}
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={nextPersonalCard}
              className="w-8 h-8 rounded-xl bg-white shadow-md flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-all duration-200"
              disabled={currentPersonalCard === personalCards.length - 1}
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Personal Cards Carousel */}
        <div className="mt-4 relative h-32 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPersonalCard}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <div className="bg-gradient-to-br from-[var(--brand-blue)]/8 via-[var(--brand-pink)]/5 to-[var(--brand-blue)]/8 rounded-2xl p-6 h-full flex items-center gap-4 border border-white/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  {renderIcon(personalCards[currentPersonalCard].iconType, "h-8 w-8 text-[var(--brand-blue)]")}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2 leading-tight">
                    {personalCards[currentPersonalCard].title}
                  </h4>
                  {personalCards[currentPersonalCard].points && (
                    <div className="flex items-center gap-2 bg-white/80 rounded-full px-3 py-1 w-fit">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {personalCards[currentPersonalCard].points} points
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

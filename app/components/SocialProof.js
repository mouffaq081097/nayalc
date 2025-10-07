import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, ShoppingBag, Users, Award, CheckCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const testimonials = [
  {
    id: 1,
    name: "Sophie Martinez",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b789?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "The Radiance Serum completely transformed my skin! I've been using Naya Lumière products for 6 months and I'm absolutely in love.",
    product: "Radiance Renewal Serum",
    verified: true,
    location: "Paris, France"
  },
  {
    id: 2,
    name: "Emma Chen",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Fast shipping, beautiful packaging, and amazing quality. The Velvet Lipstick is my new favorite - it lasts all day!",
    product: "Velvet Matte Lipstick",
    verified: true,
    location: "New York, USA"
  },
  {
    id: 3,
    name: "Isabella Rodriguez",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Outstanding customer service and luxury products that actually work. The Nuit de Paris perfume is divine!",
    product: "Nuit de Paris Perfume",
    verified: true,
    location: "Madrid, Spain"
  }
];

const recentActivity = [
  { name: "Maria L.", product: "Radiance Serum", location: "London", time: "2 minutes ago" },
  { name: "Claire B.", product: "Velvet Lipstick", location: "Tokyo", time: "5 minutes ago" },
  { name: "Anna K.", product: "Eye Cream", location: "Berlin", time: "8 minutes ago" },
  { name: "Sophie R.", product: "Face Mask Set", location: "Montreal", time: "12 minutes ago" },
  { name: "Elena V.", product: "Perfume Collection", location: "Milan", time: "15 minutes ago" }
];

const socialStats = [
  { label: "Happy Customers", value: "50,000+", icon: Users, color: "text-blue-600" },
  { label: "5-Star Reviews", value: "12,500+", icon: Star, color: "text-yellow-500" },
  { label: "Products Sold", value: "150,000+", icon: ShoppingBag, color: "text-green-600" },
  { label: "Beauty Awards", value: "25+", icon: Award, color: "text-purple-600" }
];



export function SocialProof({ variant = 'testimonials', className = '' }) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentActivity, setCurrentActivity] = useState(0);

  useEffect(() => {
    if (variant === 'testimonials') {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [variant]);

  useEffect(() => {
    if (variant === 'activity') {
      const interval = setInterval(() => {
        setCurrentActivity((prev) => (prev + 1) % recentActivity.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [variant]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  switch (variant) {
    case 'testimonials':
      return (
        <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-[var(--brand-pink)]" />
            <span className="font-medium text-sm">Customer Love</span>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={testimonials[currentTestimonial].avatar} />
                  <AvatarFallback>{testimonials[currentTestimonial].name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{testimonials[currentTestimonial].name}</span>
                    {testimonials[currentTestimonial].verified && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(testimonials[currentTestimonial].rating)}
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed">
                &quot;{testimonials[currentTestimonial].text}&quot;
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Purchased: {testimonials[currentTestimonial].product}</span>
                <span>{testimonials[currentTestimonial].location}</span>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <div className="flex justify-center gap-2 mt-4">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentTestimonial ? 'bg-[var(--brand-pink)]' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      );

    case 'activity':
      return (
        <div className={`bg-gradient-to-r from-[var(--brand-blue)]/5 to-[var(--brand-pink)]/5 rounded-lg border p-4 ${className}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-sm">Live Activity</span>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentActivity}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-1"
            >
              <p className="text-sm">
                <span className="font-medium">{recentActivity[currentActivity].name}</span>
                {' '}just purchased{' '}
                <span className="text-[var(--brand-pink)]">{recentActivity[currentActivity].product}</span>
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{recentActivity[currentActivity].location}</span>
                <span>{recentActivity[currentActivity].time}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      );

    case 'stats':
      return (
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
          {socialStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      );

    case 'compact':
      return (
        <div className={`flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border ${className}`}>
          <div className="flex items-center gap-1">
            {renderStars(5)}
          </div>
          <div className="text-sm">
            <span className="font-medium">4.9/5</span>
            <span className="text-gray-500 ml-1">from 12,500+ reviews</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-4 w-4 text-[var(--brand-blue)]" />
            <span className="font-medium">50,000+</span>
            <span className="text-gray-500">customers</span>
          </div>
        </div>
      );

    default:
      return null;
  }
}

// Social Proof Badge Component for floating notifications
export function SocialProofBadge() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(0);

  useEffect(() => {
    const showNotification = () => {
      setCurrentNotification((prev) => (prev + 1) % recentActivity.length);
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 4000);
    };

    const interval = setInterval(showNotification, 8000);
    // Show first notification after 3 seconds
    const timeout = setTimeout(showNotification, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 z-50 max-w-sm"
        >
          <Card className="bg-white shadow-lg border-l-4 border-l-[var(--brand-pink)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] rounded-full flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {recentActivity[currentNotification].name} just purchased
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {recentActivity[currentNotification].product}
                  </p>
                  <p className="text-xs text-gray-500">
                    {recentActivity[currentNotification].location} • {recentActivity[currentNotification].time}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { createFetchWithAuth } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Crown, Gift, Star, History, TrendingUp, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoyaltyPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const fetchWithAuth = useMemo(() => createFetchWithAuth(logout), [logout]);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loyaltyData, setLoyaltyData] = useState({
    stats: { points: 0, lifetimeSpend: 0, tier: 'Member' },
    transactions: []
  });

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setLoading(true);
      fetchWithAuth(`/api/users/${user.id}/loyalty`)
        .then((res) => res.json())
        .then((data) => {
          setLoyaltyData(data);
        })
        .catch((err) => console.error('Failed to fetch loyalty data:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, fetchWithAuth]);

  const pointsValue = (loyaltyData.stats.points / 100) * 5; // 100 points = 5 AED

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-pink)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-amber-900 to-amber-700 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 p-12 opacity-10">
            <Crown className="w-96 h-96" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-6 w-6 text-amber-300 fill-current" />
              <span className="text-amber-200 font-semibold tracking-wide uppercase text-sm">Loyalty Program</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              Lumière <span className="text-amber-300 italic">Prestige</span>
            </h1>
            <p className="text-xl text-amber-100 mb-8 leading-relaxed">
              Join our exclusive community of beauty enthusiasts. Earn points on every purchase and unlock rewards that illuminate your beauty journey.
            </p>
            {!isAuthenticated && (
              <div className="flex gap-4">
                <Button 
                  onClick={() => router.push('/auth?mode=signup')}
                  className="bg-white text-amber-900 hover:bg-amber-50 font-bold px-8 h-12 rounded-full"
                >
                  Join Now
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/auth')}
                  className="border-white/30 text-white hover:bg-white/10 h-12 rounded-full px-8"
                >
                  Sign In
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-10 relative z-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-8"
        >
          {/* User Stats Card (If Logged In) */}
          {isAuthenticated && (
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-xl bg-white/95 backdrop-blur overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-600 w-full" />
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center justify-center p-4 text-center border-r-0 md:border-r border-gray-100">
                      <div className="bg-amber-50 p-3 rounded-full mb-3">
                        <Crown className="h-8 w-8 text-amber-600" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Current Tier</p>
                      <h3 className="text-2xl font-serif font-bold text-gray-900 mt-1">{loyaltyData.stats.tier || 'Member'}</h3>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 text-center border-r-0 md:border-r border-gray-100">
                      <div className="bg-amber-50 p-3 rounded-full mb-3">
                        <Star className="h-8 w-8 text-amber-600 fill-amber-600" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Available Points</p>
                      <h3 className="text-4xl font-serif font-bold text-amber-600 mt-1">{loyaltyData.stats.points}</h3>
                      <p className="text-sm text-gray-400 mt-1">Lifetime Earned: {loyaltyData.stats.lifetime_points || loyaltyData.stats.points}</p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <div className="bg-green-50 p-3 rounded-full mb-3">
                        <Gift className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Redeemable Value</p>
                      <h3 className="text-2xl font-serif font-bold text-green-600 mt-1">AED {pointsValue.toFixed(2)}</h3>
                      <Button 
                        variant="link" 
                        className="text-amber-600 p-0 h-auto mt-2 font-semibold"
                        onClick={() => router.push('/all-products')}
                      >
                        Shop to Redeem <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* How It Works Section */}
          <motion.div variants={itemVariants} className="my-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Earning rewards is simple. Join the program, shop your favorites, and enjoy exclusive perks.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: ShoppingBag, title: "Shop & Earn", desc: "Earn 1 point for every AED 1 you spend on our products." },
                { icon: TrendingUp, title: "Level Up", desc: "Unlock higher tiers and exclusive benefits as you earn more points." },
                { icon: Gift, title: "Redeem Rewards", desc: "Use your points for direct discounts at checkout. 100 Points = 5 AED." }
              ].map((item, idx) => (
                <Card key={idx} className="border-none shadow-md hover:shadow-lg transition-all text-center h-full">
                  <CardContent className="p-8 flex flex-col items-center h-full">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 transform rotate-3 hover:rotate-6 transition-transform">
                      <item.icon className="h-8 w-8 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Transaction History (If Logged In) */}
          {isAuthenticated && (
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                  <History className="h-6 w-6 text-gray-400" />
                  Points History
                </h2>
              </div>
              
              <Card className="border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loyaltyData.transactions.length > 0 ? (
                        loyaltyData.transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                              {tx.description || tx.type}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {tx.points > 0 ? '+' : ''}{tx.points}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                            No history found. Start shopping to earn points!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Guest CTA */}
          {!isAuthenticated && (
            <motion.div variants={itemVariants} className="mt-8">
              <div className="bg-amber-900 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>
                <div className="relative z-10 max-w-2xl mx-auto">
                  <h2 className="text-3xl font-serif font-bold mb-4">Ready to start earning?</h2>
                  <p className="text-amber-100 mb-8">Create an account today and get 100 bonus points instantly.</p>
                  <Button 
                    onClick={() => router.push('/auth?mode=signup')}
                    className="bg-white text-amber-900 hover:bg-amber-50 px-10 h-14 rounded-full font-bold text-lg shadow-xl"
                  >
                    Create Free Account
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
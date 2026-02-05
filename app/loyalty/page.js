"use client";

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { 
  Crown, Gift, Star, History, TrendingUp, 
  ShoppingBag, ArrowRight, Loader2, Sparkles,
  ChevronRight, Award, Plus, Minus, Info, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SectionTitle = ({ title, subtitle }) => (
    <div className="mb-8">
        <h2 className="text-[28px] md:text-[36px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
            {title}
        </h2>
        {subtitle && <p className="text-[13px] font-bold text-brand-pink uppercase tracking-[0.3em] mt-2">{subtitle}</p>}
    </div>
);

const TransactionItem = ({ tx }) => (
    <div className="group flex items-center justify-between py-5 border-b border-gray-100 last:border-0">
        <div className="flex items-center gap-5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${tx.points > 0 ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-brand-pink'}`}>
                {tx.points > 0 ? <Plus size={16} /> : <Minus size={16} />}
            </div>
            <div>
                <p className="text-[15px] font-semibold text-gray-900">{tx.description || tx.type}</p>
                <p className="text-[12px] text-gray-400 font-medium">
                    {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
            </div>
        </div>
        <div className="text-right">
            <p className={`text-[17px] font-bold ${tx.points > 0 ? 'text-green-600' : 'text-brand-pink'}`}>
                {tx.points > 0 ? '+' : ''}{tx.points}
            </p>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Points</p>
        </div>
    </div>
);

const EarnCard = ({ icon: Icon, title, description, points }) => (
    <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-white border border-gray-100 rounded-2xl p-8 flex flex-col h-full shadow-sm hover:shadow-xl hover:border-brand-pink/20 transition-all duration-300"
    >
        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-brand-pink mb-6">
            <Icon size={24} />
        </div>
        <h3 className="text-[19px] font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-[14px] text-gray-500 font-medium leading-relaxed flex-grow">{description}</p>
        <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[13px] font-black text-brand-pink uppercase tracking-widest">{points}</span>
            <ArrowRight size={16} className="text-gray-300" />
        </div>
    </motion.div>
);

const LoyaltyContent = () => {
    const { user, isAuthenticated } = useAuth();
    const { fetchWithAuth } = useAppContext();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [loyaltyData, setLoyaltyData] = useState({
        stats: { points: 0, lifetimeSpend: 0, tier: 'Member' },
        transactions: []
    });

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            setLoading(true);
            try {
                const res = await fetchWithAuth(`/api/users/${user.id}/loyalty`);
                const data = await res.json();
                setLoyaltyData(data);
            } catch (err) {
                console.error('Failed to fetch loyalty data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [isAuthenticated, user, fetchWithAuth]);

    const nextTierPoints = 2000; // Example threshold
    const progress = Math.min((loyaltyData.stats.points / nextTierPoints) * 100, 100);

    if (loading) return (
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="w-12 h-12 border-4 border-brand-pink/20 border-t-brand-pink rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse">Calculating Rituals</p>
            </div>
        </div>
    );

    return (
        <div className="bg-[#FAF9F6] min-h-screen font-sans text-gray-900 pb-32 relative overflow-hidden">
            {/* Subtle Boutique Aura */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-brand-pink/[0.03] to-transparent"></div>
            </div>

            {/* Tactile Paper Grain */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>

            <div className="max-w-[1000px] mx-auto px-6 relative z-10 pt-16 md:pt-24">
                
                {/* Hero / Balance Section */}
                <section className="mb-20">
                    <div className="flex flex-col md:flex-row items-end justify-between gap-10">
                        <div className="space-y-6 flex-1">
                            <Link 
                                href="/account"
                                className="group flex items-center gap-1.5 text-[14px] font-medium text-brand-pink hover:underline mb-8 w-fit"
                            >
                                <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                                Account
                            </Link>
                            <h1 className="text-[42px] md:text-[56px] font-bold tracking-tight text-gray-900 leading-none">
                                Ritual Points.
                            </h1>
                            <p className="text-[17px] md:text-[21px] text-gray-500 font-medium max-w-xl">
                                Your journey through biological beauty is rewarded. Every interaction synchronizes your presence with exclusive benefits.
                            </p>
                        </div>
                        
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 md:p-12 shadow-2xl shadow-pink-200/20 relative overflow-hidden shrink-0 w-full md:w-auto min-w-[320px]">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                                <Sparkles size={120} className="text-brand-pink" />
                            </div>
                            <div className="relative z-10 text-center md:text-left">
                                <p className="text-[11px] font-black text-brand-pink uppercase tracking-[0.3em] mb-2">Available Balance</p>
                                <div className="flex items-baseline justify-center md:justify-start gap-3 mb-6">
                                    <span className="text-[64px] font-bold tracking-tighter text-gray-900 leading-none">{loyaltyData.stats.points}</span>
                                    <span className="text-[18px] font-bold text-gray-400">Pts</span>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-[12px] font-bold uppercase tracking-widest text-gray-400">
                                        <span>{loyaltyData.stats.tier} Tier</span>
                                        <span>Next Level: {nextTierPoints}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-brand-pink shadow-[0_0_12px_rgba(236,72,153,0.4)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Earn Section */}
                <section className="mb-24">
                    <SectionTitle title="Enhance Your Ritual" subtitle="How to earn points" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <EarnCard 
                            icon={ShoppingBag}
                            title="Signature Shop"
                            description="Earn 1 point for every AED 1 spent on all collections and sets."
                            points="1:1 Ratio"
                        />
                        <EarnCard 
                            icon={Star}
                            title="Biological Review"
                            description="Share your experience and results to help others find their frequency."
                            points="50 Points"
                        />
                        <EarnCard 
                            icon={Gift}
                            title="Celebration"
                            description="Celebrate your biological anniversary with a gift of points from Naya."
                            points="200 Points"
                        />
                    </div>
                </section>

                {/* Benefits List */}
                <section className="mb-24 bg-gray-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-brand-pink/20 to-transparent opacity-50" />
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div>
                            <h2 className="text-[32px] font-bold tracking-tight mb-6">Redeem your light.</h2>
                            <p className="text-gray-400 text-[17px] font-medium leading-relaxed mb-10">
                                Use your accumulated Ritual Points to illuminate your next purchase. Simply apply your balance at checkout for instant biological rewards.
                            </p>
                            <div className="flex items-center gap-3 px-6 py-3 bg-white/10 rounded-full w-fit backdrop-blur-md border border-white/10">
                                <Info size={16} className="text-brand-pink" />
                                <span className="text-[13px] font-bold tracking-tight">100 Points = 5 AED Discount</span>
                            </div>
                        </div>
                        <div className="space-y-8">
                            {[
                                { title: 'Early Access', desc: 'Be the first to experience new scientific breakthroughs.' },
                                { title: 'Exclusive Events', desc: 'Invitations to private biological beauty masterclasses.' },
                                { title: 'Priority Support', desc: 'Direct connection to our senior beauty consultants.' },
                            ].map((benefit, i) => (
                                <div key={i} className="flex gap-6">
                                    <div className="w-6 h-6 rounded-full bg-brand-pink flex-shrink-0 flex items-center justify-center">
                                        <Check size={14} className="text-white" strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h4 className="text-[17px] font-bold mb-1">{benefit.title}</h4>
                                        <p className="text-gray-400 text-[14px] font-medium leading-snug">{benefit.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* History Section */}
                {isAuthenticated && (
                    <section>
                        <SectionTitle title="Activity Chronicle" subtitle="Transaction history" />
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
                            {loyaltyData.transactions.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {loyaltyData.transactions.map((tx) => (
                                        <TransactionItem key={tx.id} tx={tx} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <History size={48} className="mx-auto text-gray-100 mb-6" />
                                    <p className="text-gray-400 font-serif italic text-2xl">No rituals recorded yet.</p>
                                    <p className="text-gray-400 text-sm mt-2 font-medium">Your activity history will appear here.</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Guest CTA */}
                {!isAuthenticated && (
                    <section className="text-center py-20">
                        <h2 className="text-[32px] font-bold tracking-tight mb-8">Begin your journey.</h2>
                        <button 
                            onClick={() => router.push('/auth?mode=signup')}
                            className="px-12 py-5 bg-gray-900 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-brand-pink transition-all active:scale-95 duration-300"
                        >
                            Synchronize Now
                        </button>
                    </section>
                )}

                {/* Footnote */}
                <div className="mt-32 flex flex-col items-center gap-4 text-center opacity-30">
                    <div className="w-8 h-[1px] bg-gray-900" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900">Naya Lumière Protocol</p>
                </div>
            </div>
        </div>
    );
};

// Helper Check component for the benefits list
const Check = ({ size = 20, className = "" }) => (
    <svg 
        width={size} height={size} viewBox="0 0 24 24" fill="none" 
        stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
        className={className}
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default function LoyaltyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-brand-pink font-black uppercase tracking-[0.5em]">Synchronizing Rituals...</div>}>
            <LoyaltyContent />
        </Suspense>
    );
}

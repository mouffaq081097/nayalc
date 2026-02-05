'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, ShoppingBag, Trash2, ArrowLeft, 
  Search, Sparkles, ShoppingCart, ArrowRight,
  Package, Plus, Minus, Info, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../context/CartContext';

const SectionTitle = ({ title, subtitle }) => (
    <div className="mb-12">
        <h2 className="text-[32px] md:text-[42px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
            {title}
        </h2>
        {subtitle && <p className="text-[13px] font-bold text-brand-pink uppercase tracking-[0.3em] mt-3">{subtitle}</p>}
    </div>
);

const WishlistCard = ({ item, onRemove }) => {
    const { addToCart } = useCart();
    const [added, setAdded] = useState(false);
    const router = useRouter();

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({
            id: item.productId,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl,
            brand: item.brandName,
            stock_quantity: item.stockQuantity
        }, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className="w-full bg-white border border-gray-100 rounded-[2rem] overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:border-brand-pink/20 flex flex-col h-full"
        >
            {/* Image Section */}
            <div className="relative aspect-square bg-gray-50 overflow-hidden border-b border-gray-50">
                <div 
                    onClick={() => router.push(`/product/${item.productId}`)}
                    className="w-full h-full p-8 md:p-12 cursor-pointer relative z-10"
                >
                    {item.imageUrl ? (
                        <Image 
                            src={item.imageUrl} 
                            alt={item.name} 
                            fill
                            className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                            <Package size={48} />
                        </div>
                    )}
                </div>

                {/* Top Actions */}
                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <button 
                        onClick={() => onRemove(item.productId)}
                        className="w-10 h-10 bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-red-500 rounded-full transition-all shadow-sm border border-white/50"
                    >
                        <Trash2 size={18} strokeWidth={1.5} />
                    </button>
                </div>
                
                {item.stockQuantity <= 0 && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 bg-white px-4 py-2 rounded-full shadow-sm">
                            Sold Out
                        </span>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="p-6 flex flex-col flex-grow">
                <div className="space-y-1 mb-4">
                    <p className="text-[10px] font-black text-brand-pink uppercase tracking-widest">
                        {item.brandName || 'Naya Lumière'}
                    </p>
                    <h3 
                        onClick={() => router.push(`/product/${item.productId}`)}
                        className="text-[17px] font-bold text-gray-900 tracking-tight leading-tight cursor-pointer hover:text-brand-pink transition-colors line-clamp-1"
                    >
                        {item.name}
                    </h3>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                        <span className="text-[18px] font-black text-gray-900 tracking-tight">
                            {parseFloat(item.price).toFixed(0)}
                        </span>
                        <span className="text-[9px] font-black text-gray-400 uppercase">AED</span>
                    </div>
                    
                    <button 
                        onClick={handleAddToCart}
                        disabled={item.stockQuantity <= 0}
                        className={`w-10 h-10 rounded-full transition-all flex items-center justify-center shadow-md active:scale-90 ${
                            added 
                            ? 'bg-green-500 text-white' 
                            : item.stockQuantity > 0 
                                ? 'bg-gray-900 text-white hover:bg-brand-pink' 
                                : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                        }`}
                    >
                        {added ? <Check size={18} strokeWidth={3} /> : <ShoppingBag size={18} strokeWidth={1.5} />}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const WishlistContent = () => {
    const { user, isAuthenticated } = useAuth();
    const { fetchWithAuth } = useAppContext();
    const router = useRouter();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadWishlist = async () => {
        if (!isAuthenticated || !user?.id) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`/api/wishlist?userId=${user.id}`);
            const data = await res.json();
            setWishlistItems(data.wishlist || []);
        } catch (err) {
            console.error('Error loading wishlist:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadWishlist();
    }, [isAuthenticated, user]);

    const handleRemove = async (productId) => {
        try {
            const res = await fetch('/api/wishlist', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, productId })
            });
            if (res.ok) {
                setWishlistItems(prev => prev.filter(item => item.productId !== productId));
            }
        } catch (err) {
            console.error('Error removing from wishlist:', err);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="w-12 h-12 border-4 border-brand-pink/20 border-t-brand-pink rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse">Curating Artistry</p>
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
                
                {/* Header Section */}
                <header className="mb-16">
                    <Link 
                        href="/account"
                        className="group flex items-center gap-1.5 text-[14px] font-medium text-brand-pink hover:underline mb-8 w-fit"
                    >
                        <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                        Account
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-[42px] md:text-[56px] font-bold tracking-tight text-gray-900 leading-none">
                                Saved Art.
                            </h1>
                            <p className="text-[17px] md:text-[21px] text-gray-500 font-medium mt-4 max-w-xl">
                                Your curated selection of beauty and biology. Revisit your personal masterpieces and acquire them for your ritual.
                            </p>
                        </div>
                        {wishlistItems.length > 0 && (
                            <div className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                <Heart size={16} className="text-brand-pink fill-brand-pink" />
                                <span className="text-[15px] font-bold text-gray-900">{wishlistItems.length} Curations</span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Wishlist Items Gallery */}
                <div className="space-y-6">
                    {wishlistItems.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {wishlistItems.map((item, idx) => (
                                <motion.div
                                    key={item.productId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <WishlistCard 
                                        item={item} 
                                        onRemove={handleRemove}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-32 text-center bg-white border border-gray-100 rounded-[3rem] shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-full mx-auto flex items-center justify-center text-gray-200 mb-8 border border-gray-100 shadow-inner">
                                <Heart size={32} />
                            </div>
                            <p className="text-gray-400 font-serif italic text-3xl mb-4">No art saved yet.</p>
                            <p className="text-gray-400 text-[15px] font-medium mb-12 max-w-sm mx-auto">Discover and curate the products that resonate with your frequency.</p>
                            <button 
                                onClick={() => router.push('/all-products')}
                                className="px-12 py-5 bg-gray-900 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-brand-pink transition-all active:scale-95 duration-300"
                            >
                                Explore Collection
                            </button>
                        </div>
                    )}
                </div>

                {/* CTA / Recommendation Section */}
                {wishlistItems.length > 0 && (
                    <div className="mt-24 bg-gray-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-brand-pink/20 to-transparent opacity-50" />
                        <div className="relative z-10 text-center max-w-2xl mx-auto space-y-8">
                            <Sparkles size={40} className="text-brand-pink mx-auto" />
                            <h2 className="text-[32px] md:text-[42px] font-bold tracking-tight">Complete your protocol.</h2>
                            <p className="text-gray-400 text-[17px] font-medium leading-relaxed">
                                Our beauty consultants recommend combining your saved selections with our Signature Protocol for enhanced biological results.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <button 
                                    onClick={() => router.push('/all-products')}
                                    className="w-full sm:w-auto px-10 py-5 bg-white text-gray-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] hover:bg-brand-pink hover:text-white transition-all shadow-xl"
                                >
                                    Shop All
                                </button>
                                <button 
                                    onClick={() => router.push('/skin-quiz')}
                                    className="w-full sm:w-auto px-10 py-5 bg-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] border border-white/10 hover:bg-white/20 transition-all backdrop-blur-md"
                                >
                                    Take Skin Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footnote */}
                <div className="mt-32 flex flex-col items-center gap-4 text-center opacity-30">
                    <div className="w-8 h-[1px] bg-gray-900" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900">Naya Lumière Gallery</p>
                </div>
            </div>
        </div>
    );
};

export default function WishlistPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-brand-pink font-black uppercase tracking-[0.5em]">Curating Artistry...</div>}>
            <WishlistContent />
        </Suspense>
    );
}
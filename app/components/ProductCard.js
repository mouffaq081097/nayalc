import React, { useState, useContext, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CartContext } from '../context/CartContext';
import { Heart, ShoppingBag, Star, Plus, Check, Minus, Truck, ShieldCheck, ArrowRight, X, Eye, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Modal from './Modal';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const TypewriterText = ({ text, speed = 10 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [index, text, speed]);

  return <div className="whitespace-pre-wrap">{displayedText}</div>;
};

const ProductCard = ({ id, name, price, originalPrice, image, averageRating, reviewCount, isNew, isBestseller, category, brandName, stock_quantity, description, variant = 'light' }) => {
  const { addToCart } = useContext(CartContext);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const isDark = variant === 'dark';
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const handleAIGenerate = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAIModalOpen(true);
    if (aiResult) return; // Don't regenerate if we already have it

    try {
      setIsGeneratingAI(true);
      const response = await fetch('/api/ai/product-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: name,
          brandName: brandName || 'Naya Lumière',
          description: description,
          price: price,
          category: category
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiResult(data.response);
      } else {
        setAiResult("Our AI specialist is currently unavailable. Please try again later.");
      }
    } catch (error) {
      console.error('Error generating AI info:', error);
      setAiResult("An error occurred while curating your product insights.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    try {
      const method = isWishlisted ? 'DELETE' : 'POST';
      const response = await fetch('/api/wishlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId: id })
      });

      if (response.ok) {
        setIsWishlisted(!isWishlisted);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const handleAddToCart = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const productForCart = { id, name, price, imageUrl: image, categoryName: category, brand: brandName, stock_quantity: stock_quantity };
    addToCart(productForCart, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const toggleQuickView = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setQuantity(1);
    setIsQuickViewOpen(!isQuickViewOpen);
  };

  return (
    <>
      <div 
        className={`group relative overflow-hidden flex flex-col h-full transition-all duration-500 ${
            isDark 
            ? 'bg-[#0a0a0a] text-white border-white/5' 
            : 'bg-white text-gray-900 border-gray-100'
        } border-b lg:border lg:rounded-[2.5rem]`}
      >
        {/* Instagram Header Style - Soft & Minimal */}
        <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500 ${isDark ? 'bg-gray-800 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                    <Sparkles size={16} className="text-brand-pink/60" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-semibold tracking-tight text-gray-900">
                            {brandName || 'Naya Lumière'}
                        </p>
                        <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check size={8} className="text-white" strokeWidth={4} />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium tracking-tight">Paris · Excellence Française</p>
                </div>
            </div>
            {isNew && (
                <span className="text-[10px] font-medium text-brand-pink bg-brand-pink/5 px-3 py-1 rounded-full border border-brand-pink/10">
                    New
                </span>
            )}
        </div>

        {/* Main Image Section */}
        <div className={`relative aspect-square overflow-hidden ${isDark ? 'bg-black/40' : 'bg-[#FAFAFA]'}`}>
            <Link href={`/product/${id}`} className="block w-full h-full relative z-0">
                <motion.div className="w-full h-full p-4" whileTap={{ scale: 0.98 }}>
                    <Image
                        src={image || '/placeholder-image.jpg'}
                        alt={name || 'Product Image'}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        className="object-contain"
                    />
                </motion.div>
            </Link>
        </div>

        {/* Interaction Bar - Social Style */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-4">
                <button onClick={handleWishlistToggle} className="transition-transform active:scale-125">
                    <Heart size={24} className={`${isWishlisted ? 'fill-brand-pink text-brand-pink' : ''}`} strokeWidth={1.5} />
                </button>
                <button onClick={toggleQuickView} className="transition-transform active:scale-125">
                    <Eye size={24} strokeWidth={1.5} />
                </button>
                <button 
                    onClick={handleAIGenerate}
                    className="transition-transform active:scale-125 relative group/ai"
                >
                    <Wand2 size={24} strokeWidth={1.5} className="text-brand-pink" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/ai:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        AI Insights
                    </span>
                </button>
            </div>
            {!stock_quantity || stock_quantity <= 0 ? (
                <span className="text-[10px] text-red-500 font-black uppercase tracking-widest italic">Sold Out</span>
            ) : (
                <button 
                    onClick={handleAddToCart}
                    className={`transition-all active:scale-90 ${addedToCart ? 'text-green-500' : ''}`}
                >
                    {addedToCart ? <Check size={24} strokeWidth={3} /> : <ShoppingBag size={24} strokeWidth={1.5} />}
                </button>
            )}
        </div>

        {/* AI Insight Modal - Harmonized Brand & AI Design */}
        <Modal
            isOpen={isAIModalOpen}
            onClose={() => setIsAIModalOpen(false)}
            title=""
            size="max-w-2xl"
            noBodyPadding
        >
            <div className="relative overflow-hidden min-h-[500px] bg-white flex flex-col">
                {/* Subtle Brand Background Aura */}
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] bg-brand-pink/20 animate-pulse-slow"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] bg-gray-100 animate-pulse-slow"></div>
                </div>

                {/* Header - Brand First */}
                <div className="relative z-10 px-8 pt-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm relative group overflow-hidden">
                            <motion.div
                                animate={{ rotate: [0, 15, -15, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            >
                                <Sparkles className="text-brand-pink/60" size={24} strokeWidth={1.5} />
                            </motion.div>
                        </div>
                        <div>
                            <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">
                                Olfactory Insights
                            </h3>
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] text-gray-400 font-medium tracking-tight">AI Concierge · Powered by Gemini 3</p>
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 rounded-full bg-brand-pink/40 animate-pulse"></div>
                                    <div className="w-1 h-1 rounded-full bg-brand-pink/40 animate-pulse [animation-delay:0.2s]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsAIModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors border border-gray-100">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>
                
                <div className="relative z-10 flex-grow px-8 py-10">
                    {isGeneratingAI ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-10 text-center">
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                {/* Neural Powerhouse Core */}
                                <motion.div 
                                    animate={{ 
                                        scale: [1, 1.2, 1],
                                        rotate: 360,
                                        opacity: [0.3, 0.6, 0.3]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border border-brand-pink/20 border-t-brand-pink/60 border-l-brand-pink/40"
                                />
                                <motion.div 
                                    animate={{ 
                                        scale: [1.2, 1, 1.2],
                                        rotate: -360,
                                        opacity: [0.2, 0.5, 0.2]
                                    }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-4 rounded-full border border-blue-400/20 border-b-blue-400/60 border-r-blue-400/40"
                                />
                                <motion.div 
                                    animate={{ 
                                        scale: [1, 1.1, 1],
                                        opacity: [0.5, 1, 0.5]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-pink via-purple-500 to-blue-500 blur-md shadow-[0_0_30px_rgba(236,72,153,0.4)]"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles size={24} className="text-white animate-pulse" />
                                </div>

                                {/* Energy Arcs */}
                                {[...Array(4)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ 
                                            rotate: [0, 360],
                                            opacity: [0, 1, 0],
                                            scale: [0.8, 1.2, 0.8]
                                        }}
                                        transition={{ 
                                            duration: 3, 
                                            repeat: Infinity, 
                                            delay: i * 0.5,
                                            ease: "easeInOut" 
                                        }}
                                        className="absolute w-full h-full rounded-full border-t border-transparent border-brand-pink/30"
                                        style={{ transform: `rotate(${i * 45}deg)` }}
                                    />
                                ))}
                            </div>
                            <div className="space-y-3">
                                <p className="text-2xl font-semibold text-gray-900 tracking-tight">Activating Gemini Core</p>
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-[11px] text-gray-400 font-normal tracking-tight uppercase">Synchronizing Neural Weights</p>
                                    <div className="flex gap-1">
                                        {[...Array(3)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ 
                                                    scale: [1, 1.5, 1],
                                                    backgroundColor: ["#9CA3AF", "#EC4899", "#9CA3AF"]
                                                }}
                                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                                className="w-1.5 h-1.5 rounded-full"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-full flex flex-col"
                        >
                            {/* Product Card Micro-Header */}
                            <div className="flex items-center gap-5 mb-8 bg-gray-50/50 p-4 rounded-3xl border border-gray-100 shadow-sm">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden relative border border-white p-2 bg-white shadow-sm">
                                    <Image src={image} alt={name} fill className="object-contain mix-blend-multiply" />
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="text-[17px] font-semibold text-gray-900 tracking-tight leading-none">{name}</h4>
                                    <p className="text-[11px] font-medium text-brand-pink tracking-tight">{brandName || 'Naya Lumière'}</p>
                                </div>
                            </div>
                            
                            {/* Content Area - Apple Style Typography & ChatGPT Reveal */}
                            <div className="bg-white rounded-[2rem] p-8 lg:p-10 border border-gray-100 shadow-sm flex-grow">
                                <div className="font-sans text-[15px] leading-[1.8] text-gray-700 font-normal">
                                    <TypewriterText text={aiResult} speed={15} />
                                </div>
                            </div>

                            <div className="mt-10 flex flex-col items-center gap-6 pb-8">
                                <button 
                                    onClick={() => setIsAIModalOpen(false)}
                                    className="group relative px-14 py-4 bg-gray-900 text-white rounded-full text-[12px] font-medium tracking-tight overflow-hidden transition-all shadow-xl hover:bg-brand-pink"
                                >
                                    <span className="relative z-10 flex items-center gap-3">
                                        Conclude Consultation
                                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </button>
                                
                                <div className="flex items-center gap-3 opacity-30 hover:opacity-100 transition-opacity duration-700 cursor-default">
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div>
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-500 tracking-tight">
                                        Powered by Gemini 3 Intelligence
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </Modal>

        {/* Info Section - Soft Caption Style */}
        <div className="px-4 pb-6 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                    <div className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100/50 flex items-baseline gap-1">
                        <span className="text-[10px] font-bold text-brand-pink/60 tracking-tight">AED</span>
                        <span className="text-[18px] font-bold text-gray-900 tracking-tighter">
                            {Math.floor(price)}
                            <span className="text-[12px] opacity-40">.{ (price % 1).toFixed(2).split('.')[1] }</span>
                        </span>
                    </div>
                    {originalPrice && <span className="text-[11px] text-gray-400 line-through tracking-tight font-light">AED {originalPrice}</span>}
                </div>
                {discount > 0 && (
                    <span className="text-[10px] font-bold text-brand-pink bg-brand-pink/5 px-2 py-1 rounded-lg">
                        -{discount}%
                    </span>
                )}
            </div>
            
            <div className="space-y-1">
                <Link href={`/product/${id}`} className="text-[15px] font-medium text-gray-900 hover:text-brand-pink transition-colors block leading-tight tracking-tight">
                    {name}
                </Link>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-[12px] leading-relaxed font-normal line-clamp-2`}>
                    {description || 'Discover the timeless essence of Naya Lumière luxury beauty...'}
                </p>
            </div>

            {reviewCount > 0 && (
                <div className="flex items-center gap-1.5 pt-0.5">
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={8} className={i < Math.floor(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                        ))}
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium">
                        {reviewCount} reviews
                    </p>
                </div>
            )}
        </div>
      </div>

      {/* Improved Quick View Modal */}
      <Modal 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)}
        title=""
        size="max-w-5xl"
        noBodyPadding
      >
        <div className="grid md:grid-cols-2 gap-0 relative overflow-hidden">
          {/* Modal Background Aura */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
             <div className="absolute -top-[20%] -right-[20%] w-full h-full bg-brand-pink/[0.03] rounded-full blur-[120px]"></div>
          </div>

          <div className="aspect-square relative bg-gray-50 flex items-center justify-center overflow-hidden border-r border-gray-100">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative w-full h-full p-12 md:p-20"
            >
                <Image
                src={image || '/placeholder-image.jpg'}
                alt={name}
                fill
                className="object-contain mix-blend-multiply"
                />
            </motion.div>
            
            <div className="absolute top-10 left-10 flex flex-col gap-2">
                {isNew && <Badge className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-xl border-none">New Discovery</Badge>}
                {isBestseller && <Badge className="bg-brand-pink text-white px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-xl border-none">Signature Elite</Badge>}
            </div>
          </div>

          <div className="p-12 md:p-16 flex flex-col justify-center bg-white relative z-10">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <p className="text-[10px] uppercase tracking-[0.4em] text-brand-blue font-black mb-6 flex items-center gap-3">
                    <span className="w-10 h-[1px] bg-brand-blue/20"></span>
                    {brandName || 'Naya Lumière'}
                </p>
                <h2 className="font-serif text-4xl md:text-5xl text-gray-900 mb-8 leading-[1.1] italic tracking-tight">{name}</h2>
                
                <div className="flex items-baseline gap-5 mb-10 pb-10 border-b border-gray-50">
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-gray-400">AED</span>
                        <span className="text-5xl font-black text-gray-900">{price}</span>
                    </div>
                    {originalPrice && <span className="text-2xl text-gray-200 line-through font-medium tracking-tighter">AED {originalPrice}</span>}
                    {discount > 0 && <span className="text-[10px] font-black text-brand-pink uppercase tracking-[0.2em] bg-brand-rose px-4 py-1.5 rounded-full">Save {discount}%</span>}
                </div>

                <div className="space-y-8 mb-12">
                    <p className="text-gray-500 text-sm leading-[1.8] font-medium italic opacity-80">
                        "{description || 'Experience the essence of transformative beauty. This curated selection combines botanical excellence with modern scientific precision for unparalleled results.'}"
                    </p>
                    
                    <div className="flex gap-10">
                        <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest font-black text-gray-400">
                            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                                <Truck size={14} className="text-gray-400" />
                            </div>
                            <span>Complimentary Shipping</span>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest font-black text-gray-400">
                            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                                <ShieldCheck size={14} className="text-gray-400" />
                            </div>
                            <span>Original selection</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center bg-gray-50 rounded-2xl p-1.5 border border-gray-100 shadow-inner">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-brand-pink transition-colors"><Minus size={16} /></button>
                            <span className="w-12 text-center font-black text-sm text-gray-900">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-brand-pink transition-colors"><Plus size={16} /></button>
                        </div>

                        <button 
                            onClick={handleAddToCart}
                            disabled={!stock_quantity || stock_quantity <= 0}
                            className={`flex-grow h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all duration-500 active:scale-95 ${addedToCart ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-brand-pink shadow-brand-pink/20'}`}
                        >
                            {addedToCart ? (
                                <span className="flex items-center justify-center gap-3"><Check size={20} /> Added to selection</span>
                            ) : (
                                `Acquire Selection — AED ${(price * quantity).toFixed(2)}`
                            )}
                        </button>
                    </div>

                    <Link href={`/product/${id}`} onClick={() => setIsQuickViewOpen(false)} className="group flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.4em] font-black text-gray-400 hover:text-brand-pink transition-all">
                        View Full Dossier
                        <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                    </Link>
                </div>
            </motion.div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProductCard;
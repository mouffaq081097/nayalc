'use client';

import { useState, useEffect, use, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Heart, Star, Plus, Minus, ShoppingBag, Check, ChevronRight, Share2, Info, ArrowRight, Gift, Sparkles, Zap, MessageCircle, Maximize2, Send, Loader2, Clock, ShieldCheck, Lock, RotateCcw, Quote, Box, Truck, FlaskConical, Droplets, Leaf, Microscope, Waves, Fingerprint, X } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import Reviews from '../../components/Reviews';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import ProductCard from '../../components/ProductCard';
import AiConsultant from '../../components/AiConsultant';

export default function ProductDetailPage({ params }) {
  const { productId } = use(params);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { products: allProducts } = useAppContext();
  const router = useRouter();
  
  // SCROLL ANIMATION ENGINE
  const { scrollYProgress } = useScroll();
  
  const springScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const scale = useTransform(springScroll, [0, 0.1], [1, 0.95]);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isZoomed, setIsZoomed] = useState(false);
  
  const buyButtonRef = useRef(null);

  const ingredients = useMemo(() => {
    if (!product?.description) return [];
    // Extract potential key ingredients from description or use defaults
    const commonIngredients = ['Hyaluronic Acid', 'Vitamin C', 'Retinol', 'Peptides', 'Niacinamide', 'Ceramides'];
    return commonIngredients.filter(ing => product.description.toLowerCase().includes(ing.toLowerCase())).slice(0, 3);
  }, [product]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        data.price = parseFloat(data.price);
        if (data.comparedprice) data.comparedprice = parseFloat(data.comparedprice);
        if (data.averageRating) data.averageRating = parseFloat(data.averageRating);
        setProduct(data);

        if (user?.id) {
          const wishlistResponse = await fetch(`/api/wishlist?userId=${user.id}`);
          if (wishlistResponse.ok) {
            const wishlistData = await wishlistResponse.json();
            setIsWishlisted(wishlistData.wishlist.some(item => item.productId === productId));
          }
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, user]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleWishlistToggle = async () => {
    if (!user) { router.push('/auth'); return; }
    try {
      const method = isWishlisted ? 'DELETE' : 'POST';
      const response = await fetch(isWishlisted ? `/api/wishlist/${user.id}/${productId}` : `/api/wishlist`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: isWishlisted ? null : JSON.stringify({ userId: user.id, productId: productId }),
      });
      if (response.ok) setIsWishlisted(!isWishlisted);
    } catch (error) { console.error('Error updating wishlist:', error); }
  };

  const recommendations = useMemo(() => {
    if (!product || !allProducts) return [];
    return allProducts.filter(p => p.id !== product.id && (p.brand === product.brand || p.categoryNames === product.categoryNames)).slice(0, 4);
  }, [product, allProducts]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-gray-200" size={40} />
        <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Synchronizing Vault</span>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <h2 className="text-3xl font-serif italic text-gray-900">Selection Offline</h2>
        <Button onClick={() => router.push('/all-products')} className="bg-black text-white px-10 py-6 rounded-full text-[11px] font-black uppercase tracking-[0.3em] transition-all">
          Return to Boutique
        </Button>
      </div>
    </div>
  );

  const savingsPercentage = product.comparedprice ? Math.round(((product.comparedprice - product.price) / product.comparedprice) * 100) : 0;

  return (
    <div className="bg-white min-h-screen font-sans text-[#1d1d1f] antialiased selection:bg-brand-pink/10">
      
      <div className="max-w-[1440px] mx-auto">
        <div className="grid lg:grid-cols-12 gap-0 lg:pt-24 pb-12">
          
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 px-0 lg:px-16">
            <div className="lg:sticky lg:top-32 space-y-10">
                {/* Mobile: Full Bleed Gallery | Desktop: Rounded Card */}
                <motion.div 
                    style={{ scale: typeof window !== 'undefined' && window.innerWidth > 1024 ? scale : 1 }} 
                    className="w-full aspect-square md:aspect-[4/5] lg:rounded-[2rem] overflow-hidden bg-[#f5f5f7] relative group lg:shadow-xl cursor-zoom-in"
                    onClick={() => setIsZoomed(true)}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8)_0%,transparent_100%)] z-0"></div>
                    <motion.div 
                        key={selectedImage} 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ duration: 0.8 }} 
                        className="w-full h-full relative z-10 flex items-center justify-center"
                    >
                        <Image 
                            src={product.images ? product.images[selectedImage] : product.imageUrl} 
                            alt={product.name} 
                            width={800} 
                            height={1000} 
                            priority
                            className="w-full h-full object-contain p-6 md:p-12 lg:p-14 transition-transform duration-1000 ease-out group-hover:scale-105" 
                        />
                    </motion.div>
                    
                    {/* Mobile Gallery Indicators */}
                    {product.images && product.images.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-30 lg:hidden">
                            {product.images.map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${selectedImage === i ? 'w-4 bg-gray-900' : 'w-1.5 bg-gray-300'}`} />
                            ))}
                        </div>
                    )}

                    <button className="hidden lg:flex absolute top-8 right-8 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md items-center justify-center text-gray-900 opacity-0 group-hover:opacity-100 transition-all shadow-lg z-30">
                        <Maximize2 size={18} />
                    </button>

                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none z-20"></div>
                </motion.div>

                {/* Desktop Thumbnails */}
                {product.images && product.images.length > 1 && (
                    <div className="hidden lg:flex justify-center gap-4">
                        {product.images.map((img, index) => (
                            <button key={index} onClick={() => setSelectedImage(index)} className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all p-1 bg-[#f5f5f7] ${selectedImage === index ? 'border-gray-900 scale-105 shadow-md' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                                <Image src={img} alt="" width={48} height={48} className="w-full h-full object-contain mix-blend-multiply" />
                            </button>
                        ))}
                    </div>
                )}

                <div className="hidden lg:grid grid-cols-2 gap-10 pt-12 border-t border-gray-100">
                    <div className="space-y-3">
                        <div className="w-8 h-8 rounded-xl bg-brand-pink/5 flex items-center justify-center text-brand-pink"><FlaskConical size={18} strokeWidth={1.5} /></div>
                        <h3 className="text-lg font-semibold leading-tight text-gray-900 text-left">Clinical Precision.</h3>
                        <p className="text-gray-500 text-[13px] leading-relaxed text-left">Engineered in our Paris laboratory, this formula utilizes active biological markers for visible transformation.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="w-8 h-8 rounded-xl bg-brand-blue/5 flex items-center justify-center text-brand-blue"><Droplets size={18} strokeWidth={1.5} /></div>
                        <h3 className="text-lg font-semibold leading-tight text-gray-900 text-left">Pure Integrity.</h3>
                        <p className="text-gray-500 text-[13px] leading-relaxed text-left">Sustainably harvested botanicals synchronized with high-performance dermatological science.</p>
                    </div>
                </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-5 px-6 lg:pr-16 lg:pl-0 mt-8 lg:mt-0 text-left">
            <div className="space-y-8 lg:space-y-10 lg:sticky lg:top-32">
                <div className="space-y-2 lg:space-y-3 text-left">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="h-[1px] w-6 bg-brand-pink/30 hidden lg:block"></span>
                            <p className="text-[10px] lg:text-[11px] font-bold text-brand-pink uppercase tracking-[0.3em]">{product.brand || 'Naya Lumière Signature'}</p>
                        </div>
                        {product.isNew && <Badge className="bg-gray-100 text-gray-900 border-none px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest lg:hidden">New</Badge>}
                    </div>
                    <h1 className="text-3xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-gray-900">{product.name}</h1>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl lg:text-2xl font-semibold">AED {product.price.toFixed(2)}</span>
                        {product.comparedprice > product.price && <span className="text-sm lg:text-base text-gray-400 line-through">AED {product.comparedprice.toFixed(2)}</span>}
                    </div>
                </div>

                {/* Mobile Quick Actions Bar */}
                <div className="flex items-center gap-3 lg:hidden">
                    <button onClick={handleAddToCart} className={`flex-grow h-12 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${isAdded ? 'bg-green-600 text-white' : 'bg-gray-900 text-white active:scale-[0.98]'}`}>
                        {isAdded ? 'Selection Secured' : 'Add to Bag'}
                    </button>
                    <button onClick={handleWishlistToggle} className={`w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center transition-all ${isWishlisted ? 'bg-brand-pink/5 text-brand-pink border-brand-pink/20' : 'bg-white text-gray-900'}`}>
                        <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
                    </button>
                </div>

                <div className="flex items-center gap-6 py-4 lg:py-5 border-y border-gray-100">
                    <div className="flex flex-col gap-0.5 text-left">
                        <div className="flex items-center gap-1">
                            <span className="text-base font-bold">4.9</span>
                            <div className="flex text-brand-pink">{[...Array(5)].map((_, i) => <Star key={i} size={11} fill="currentColor" />)}</div>
                        </div>
                        <span className="text-[8px] lg:text-[9px] font-bold text-gray-400 uppercase tracking-widest">Satisfaction</span>
                    </div>
                    <Separator orientation="vertical" className="h-6 lg:h-8" />
                    <div className="flex flex-col gap-0.5 text-left">
                        <span className="text-base font-bold">100%</span>
                        <span className="text-[8px] lg:text-[9px] font-bold text-gray-400 uppercase tracking-widest">Originality</span>
                    </div>
                </div>

                <div className="space-y-6 lg:space-y-8 text-left">
                    {ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {ingredients.map((ing, i) => (
                                <div key={i} className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gray-50 rounded-full border border-gray-100 flex items-center gap-1.5">
                                    <Sparkles size={10} className="text-brand-pink opacity-50" />
                                    <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-gray-900">{ing}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="space-y-2 lg:space-y-3">
                        <h3 className="text-[10px] lg:text-[11px] font-bold uppercase tracking-widest text-gray-400">The Selection</h3>
                        <p className="text-[14px] lg:text-[15px] text-gray-600 leading-relaxed font-normal">{product.description}</p>
                    </div>

                    <div className="space-y-4 lg:space-y-6 pt-2 hidden lg:block">
                        <div className="flex items-center justify-between p-4 bg-[#f5f5f7] rounded-2xl border border-gray-100">
                            <div className="space-y-0.5 text-left">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Quantity</span>
                                <p className="text-[13px] font-semibold">Reserve {quantity} units</p>
                            </div>
                            <div className="flex items-center bg-white rounded-full p-1 shadow-sm gap-1">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-50"><Minus size={14} /></button>
                                <span className="text-base font-bold w-6 text-center tabular-nums">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-50"><Plus size={14} /></button>
                            </div>
                        </div>

                        <div className="space-y-3" ref={buyButtonRef}>
                            <button onClick={handleAddToCart} className={`w-full h-14 rounded-xl text-[13px] font-bold uppercase tracking-[0.2em] transition-all duration-500 shadow-xl ${isAdded ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-brand-pink'}`}>
                                {isAdded ? <div className="flex items-center justify-center gap-2"><Check size={18} /> Selection Secured</div> : 'Reserve for Acquisition'}
                            </button>
                            <button onClick={handleWishlistToggle} className={`w-full h-12 rounded-xl border border-gray-200 text-[11px] font-bold uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 ${isWishlisted ? 'bg-brand-pink/5 text-brand-pink border-brand-pink/20' : 'bg-white text-gray-900 hover:bg-[#f5f5f7]'}`}>
                                <Heart size={16} className={isWishlisted ? 'fill-current' : ''} /> {isWishlisted ? 'Saved to Vault' : 'Save for Later'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:gap-5 pt-8 border-t border-gray-100 text-left">
                    {[ 
                        { icon: Truck, title: "Priority Emirates Shipping", desc: "Complimentary on acquisitions over 200 AED." },
                        { icon: ShieldCheck, title: "Authenticity Certified", desc: "100% original masterpieces from official ateliers." },
                        { icon: RotateCcw, title: "Boutique Return Standard", desc: "30-day elite protection on all selections." }
                    ].map((feat, i) => (
                        <div key={i} className="flex gap-4 group cursor-default">
                            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center text-gray-900 group-hover:bg-brand-pink/10 group-hover:text-brand-pink transition-colors"><feat.icon size={18} strokeWidth={1.5} /></div>
                            <div className="space-y-0.5 text-left">
                                <h4 className="text-[11px] lg:text-[12px] font-bold uppercase tracking-tight">{feat.title}</h4>
                                <p className="text-[11px] lg:text-[12px] text-gray-500 leading-snug">{feat.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>

        <section className="mt-20 space-y-24 px-6 lg:px-20 pb-20 relative">
            <div className="max-w-5xl mx-auto text-center space-y-10">
                <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                    <Badge className="bg-brand-pink/10 text-brand-pink border-none font-black uppercase text-[9px] tracking-[0.4em] px-5 py-2">The Narrative</Badge>
                    <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight text-gray-900 leading-[1.1">Designed for <br/> <span className="italic serif font-light text-brand-pink">Absolute Radiance.</span></h2>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative">
                    <Quote className="absolute -left-12 -top-12 text-brand-pink/5 w-24 h-24 -scale-x-100" />
                    <p className="text-lg lg:text-2xl text-gray-500 leading-[1.6] font-medium max-w-3xl mx-auto italic text-center">{product.long_description || product.description}</p>
                </motion.div>
            </div>

            <div className="bg-[#f5f5f7] rounded-[4rem] p-12 lg:p-20 overflow-hidden relative">
                <div className="grid lg:grid-cols-12 gap-16 relative z-10 text-left">
                    <div className="lg:col-span-4 space-y-6">
                        <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight leading-tight text-gray-900">Laboratory <br/> Specifications.</h2>
                        <p className="text-gray-500 text-base leading-relaxed font-normal">A clinical deep-dive into the biological composition and structural performance of this selection.</p>
                        <div className="pt-4">
                            <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 hover:text-brand-pink transition-colors">
                                Laboratory Report <ArrowRight size={12} />
                            </button>
                        </div>
                    </div>
                    <div className="lg:col-span-8 grid md:grid-cols-2 gap-x-10 gap-y-10">
                        {[ 
                            { label: 'pH Equilibrium', value: '5.5 — 6.0 (Optimal)', icon: FlaskConical },
                            { label: 'Active Concentration', value: '15.2% Pure Actives', icon: Zap },
                            { label: 'Molecular Density', value: 'Micro-Emulsion Matrix', icon: Microscope },
                            { label: 'Dermal Absorption', value: 'Rapid Synchronization', icon: Waves },
                            { label: 'Biological Integrity', value: '100% Phthalate Free', icon: ShieldCheck },
                            { label: 'Shelf Maturity (PAO)', value: '12 Months Post-Reveal', icon: Clock }
                        ].map((spec, i) => (
                            <div key={i} className="space-y-3 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><spec.icon size={12} className="text-brand-pink" /></div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{spec.label}</span>
                                </div>
                                <p className="text-xl font-medium border-b border-gray-200 pb-3 text-gray-900">{spec.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute right-0 bottom-0 text-[20vw] font-black text-white/40 select-none pointer-events-none -mb-16 -mr-8 uppercase italic">Soin</div>
            </div>

            {product.how_to_use && (
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-20 items-start text-left">
                    <div className="space-y-8 lg:sticky lg:top-40">
                        <div className="space-y-4">
                            <Badge className="bg-brand-pink text-white border-none px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Protocol</Badge>
                            <h2 className="text-4xl lg:text-6xl font-semibold tracking-tighter leading-tight">The Ritual.</h2>
                        </div>
                        <p className="text-lg text-gray-500 leading-relaxed font-medium">A precise sequence designed to synchronize our clinical formulas with your skin's natural frequency.</p>
                        <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl relative group bg-[#f5f5f7]">
                            <Image src={product.imageUrl || (product.images && product.images[0]) || '/favicon.jpeg'} alt={product.name} width={600} height={800} className="w-full h-full object-contain p-12 mix-blend-multiply transition-transform duration-[2000ms] group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent pointer-events-none"></div>
                            <div className="absolute bottom-10 left-10 text-gray-900">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">Ritual Masterpiece</p>
                                <h4 className="text-xl font-serif italic">{product.name}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-16 pt-8 text-left">
                        {product.how_to_use.split('\n').map((step, i) => (
                            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} key={i} className="space-y-4 group">
                                <span className="text-[60px] lg:text-[80px] font-black text-gray-900/[0.04] leading-none select-none block group-hover:text-brand-pink/10">0{i+1}</span>
                                <div className="space-y-3">
                                    <h3 className="text-xl lg:text-2xl font-semibold">Step {i+1}</h3>
                                    <p className="text-lg lg:text-xl text-gray-500 leading-relaxed font-normal">{step}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </section>

        <section className="py-24 bg-[#f5f5f7]/50 border-y border-gray-100 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] select-none pointer-events-none"><span className="text-[20vw] font-black uppercase tracking-tighter italic">Standards</span></div>
            <div className="max-w-7xl mx-auto px-6 lg:px-20 relative z-10 text-center">
                <div className="mb-16 space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-[1px] w-8 bg-brand-pink/30"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-pink">Boutique Ethics</span>
                        <span className="h-[1px] w-8 bg-brand-pink/30"></span>
                    </div>
                    <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight text-gray-900">Selection Integrity</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {[ 
                        { icon: ShieldCheck, title: "Authenticity", desc: "Every selection is 100% original, verified by our Paris curator and protected by Naya encryption.", bg: "bg-white/80" },
                        { icon: Droplets, title: "Pure Efficacy", desc: "Formulated without biological compromise. Clinical results driven by nature's most potent botanicals.", bg: "bg-white/80" },
                        { icon: Sparkles, title: "Elite Privilege", desc: "Acquisition grants permanent access to our exclusive Lumière VIP journal and laboratory previews.", bg: "bg-white/80" }
                    ].map((item, i) => (
                        <div key={i} className={`${item.bg} backdrop-blur-xl p-10 rounded-[3rem] border border-white shadow-xl shadow-gray-200/20 group hover:shadow-2xl transition-all duration-700 flex flex-col items-center text-center space-y-6`}>
                            <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 border border-gray-100 flex items-center justify-center text-brand-pink transition-all duration-500 group-hover:scale-110 group-hover:bg-brand-pink group-hover:text-white group-hover:shadow-lg"><item.icon size={28} strokeWidth={1.5} /></div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold tracking-tight text-gray-900 uppercase">{item.title}</h3>
                                <p className="text-[15px] text-gray-500 font-medium leading-relaxed italic">"{item.desc}"</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <section className="py-24 bg-white px-6 lg:px-20 text-left">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-gray-100 pb-8 text-left">
                    <div className="space-y-2">
                        <Badge className="bg-brand-pink/10 text-brand-pink border-none font-bold uppercase text-[9px] tracking-widest px-3 py-1">Synergy</Badge>
                        <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight text-gray-900 leading-none">Complete the Routine.</h2>
                    </div>
                    <Link href="/all-products" className="text-[#0071e3] hover:underline flex items-center gap-1 text-base font-medium group text-left">
                        Explore Collections <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                    {recommendations.map((rec) => (
                        <ProductCard key={rec.id} {...rec} image={rec.imageUrl} />
                    ))}
                </div>
            </div>
        </section>

        <div id="reviews" className="py-24 px-6 lg:px-20 border-t border-gray-100 bg-[#fafafa]">
            <Reviews productId={product.id} />
        </div>
      </div>
    </div>
  );
}

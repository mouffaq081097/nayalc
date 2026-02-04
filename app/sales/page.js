'use client';
import { useState, useEffect } from 'react';
import StoreHeader from '../components/StoreHeader';
import StoreCategoryNav from '../components/StoreCategoryNav';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Timer, Zap, Percent, Star, ArrowRight, ShoppingBag, Sparkles, Clock, ShieldCheck, RotateCcw } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { toast } from 'react-toastify';

export default function SalePage() {
  const [saleProducts, setSaleProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- MAGNETIC BUTTON ENGINE ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const buttonSpringX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const buttonSpringY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  const handleMagneticMove = (e) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    mouseX.set(x * 0.35);
    mouseY.set(y * 0.35);
  };

  const resetMagnetic = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    const fetchSaleProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/products?onSale=true');
        if (!response.ok) throw new Error('Failed to fetch sale products');
        const data = await response.json();
        setSaleProducts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSaleProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900 pb-24 relative overflow-hidden">
      {/* Tactile Paper Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>

      {/* Background Aura */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-pink/[0.05] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-blue/[0.03] rounded-full blur-[120px]"></div>
      </div>

      <StoreHeader title="Sales." />
      <StoreCategoryNav />

      {/* Sale Highlights - Overlapping & Dense */}
      <section className="relative z-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 bg-white/80 backdrop-blur-xl p-4 rounded-[2.5rem] border border-gray-100 shadow-xl">
            {[
                { icon: Percent, title: "Curated Savings", desc: "Up to 50% reduction on select ritual essentials.", color: "text-brand-pink", bg: "bg-rose-50/50" },
                { icon: Zap, title: "Neural Flash", desc: "Limited release opportunities updated every 24 hours.", color: "text-blue-400", bg: "bg-blue-50/50" },
                { icon: Star, title: "Elite Access", desc: "Bestselling masterpieces now in seasonal rotation.", color: "text-amber-400", bg: "bg-amber-50/50" }
            ].map((item) => (
                <div key={item.title} className={`flex items-center gap-6 p-6 rounded-[2rem] ${item.bg} group transition-all duration-500 hover:shadow-inner border border-transparent hover:border-white`}>
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center shrink-0">
                        <item.icon className={item.color} size={24} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-0.5 text-left">
                        <h3 className="text-[14px] font-bold tracking-tight text-gray-900 uppercase">{item.title}</h3>
                        <p className="text-[11px] text-gray-400 font-medium tracking-tight leading-snug">{item.desc}</p>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Sale Selection - More Compact Grid */}
      <section className="py-16 px-6 relative z-10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 border-b border-gray-100 pb-8">
            <div className="space-y-2 items-start flex flex-col text-left">
                <div className="flex items-center gap-3">
                    <span className="w-8 h-[1.5px] bg-brand-pink"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-pink">Selection Inventory</span>
                </div>
                <h2 className="text-3xl font-serif italic text-gray-900 leading-none">Reductions Catalogue</h2>
            </div>
            
            <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                {['All Items', '50% Off', '30% Off', 'Flash Deals'].map((cat, i) => (
                    <button key={cat} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${i === 0 ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}>
                        {cat}
                    </button>
                ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 lg:gap-x-6 gap-y-8 lg:gap-y-12">
            {isLoading ? (
                [...Array(8)].map((_, i) => <div key={i} className="h-[300px] lg:h-[400px] bg-gray-50 rounded-3xl animate-pulse"></div>)
            ) : (
                saleProducts.map((product, index) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: (index % 4) * 0.1, duration: 0.8 }}
                    >
                        <ProductCard {...product} image={product.imageUrl} />
                    </motion.div>
                ))
            )}
          </div>

          <div className="flex justify-center mt-16">
            <motion.button 
                onMouseMove={handleMagneticMove}
                onMouseLeave={resetMagnetic}
                style={{ x: buttonSpringX, y: buttonSpringY }}
                className="group flex items-center gap-6 bg-gray-900 text-white px-10 py-4.5 rounded-full text-[11px] font-black uppercase tracking-[0.3em] hover:bg-brand-pink transition-all duration-500 shadow-xl"
            >
                <span>Synchronize More</span>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                    <ArrowRight size={16} />
                </div>
            </motion.button>
          </div>
        </div>
      </section>

      {/* Bundle Deals - Dense & Rich */}
      <section className="py-20 bg-white relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
            <div className="space-y-2 text-left">
                <h2 className="text-3xl font-serif italic text-gray-900">Synchronized Sets</h2>
                <p className="text-gray-400 text-[13px] font-medium tracking-tight">Complete your ritual with curated collections.</p>
            </div>
            <div className="h-px flex-1 bg-gray-50 hidden md:block mx-10"></div>
            <Badge className="bg-brand-pink/5 text-brand-pink border-brand-pink/10 rounded-full px-4 py-1.5 font-bold uppercase tracking-widest text-[9px]">
                Bundle & Save Up to 40%
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
                { title: "Complete Skincare Routine", price: "159", old: "265", discount: "40", items: "Cleanser · Serum · Moisturizer · SPF", img: "https://images.unsplash.com/photo-1751131964776-57e3cbca0a14?auto=format&fit=crop&q=80&w=800" },
                { title: "Makeup Essentials Kit", price: "135", old: "208", discount: "35", items: "Foundation · Palette · Lipstick · Mascara", img: "https://images.unsplash.com/photo-1606158562001-5b5a8729a80b?auto=format&fit=crop&q=80&w=800" }
            ].map((bundle) => (
                <div key={bundle.title} className="bg-gray-50/50 rounded-[2.5rem] p-6 lg:p-8 border border-gray-100 flex flex-col sm:flex-row gap-8 hover:bg-white hover:shadow-2xl hover:shadow-gray-200/40 transition-all duration-700 group border-b-[3px] border-b-transparent hover:border-b-brand-pink/20 text-left">
                    <div className="w-full sm:w-32 h-32 lg:w-40 lg:h-40 rounded-2xl overflow-hidden bg-white border border-gray-100 p-2 shrink-0 shadow-inner">
                        <img src={bundle.img} alt={bundle.title} className="w-full h-full object-cover rounded-xl transition-transform duration-1000 group-hover:scale-110" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-pink mb-2 block">{bundle.discount}% Exclusive Reduction</span>
                            <h3 className="text-xl font-serif italic text-gray-900 leading-tight">{bundle.title}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{bundle.items}</p>
                        </div>
                        <div className="flex items-center justify-between mt-6">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-gray-900 tracking-tighter tabular-nums">AED {bundle.price}</span>
                                <span className="text-sm text-gray-300 line-through">AED {bundle.old}</span>
                            </div>
                            <button className="w-12 h-12 rounded-full bg-gray-900 text-white hover:bg-brand-pink transition-all flex items-center justify-center shadow-lg group-hover:scale-110">
                                <ShoppingBag size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sale Protocols - High Density Cards */}
      <section className="py-20 bg-[#FAF9F6] border-t border-gray-100 relative">
        <div className="absolute top-0 right-0 p-20 opacity-[0.02] select-none pointer-events-none rotate-90">
            <span className="text-[15vw] font-black uppercase">Service</span>
        </div>
        <div className="container mx-auto px-6 text-left">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
                { icon: ShieldCheck, title: "Purchase Protocols", items: [
                    "Sale durations are strictly governed by inventory availability.",
                    "Seasonal reductions cannot be combined with recurring offers.",
                    "Complimentary express shipping on all orders over 200 AED.",
                    "Boutique selection limit: 5 masterpieces per customer."
                ]},
                { icon: RotateCcw, title: "Service Standards", items: [
                    "Our 30-day return standard applies to all seasonal acquisitions.",
                    "Items must remain in original boutique packaging for verification.",
                    "Exchanges are prioritized for potential handling defects.",
                    "Boutique credit available for all finalized reductions."
                ]}
            ].map(col => (
                <div key={col.title} className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-transform duration-1000 group-hover:scale-110"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-brand-pink">
                            <col.icon size={22} />
                        </div>
                        <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-gray-900">{col.title}</h3>
                    </div>
                    <ul className="space-y-5 relative z-10">
                        {col.items.map(text => (
                            <li key={text} className="flex items-start gap-4 text-[13px] text-gray-500 font-medium tracking-tight italic leading-relaxed">
                                <div className="w-1 h-1 rounded-full bg-brand-pink/40 mt-2.5 shrink-0"></div>
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Minimalist & Compact */}
      <section className="py-24 relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF9F6] to-white"></div>
        <div className="container mx-auto px-6 text-center space-y-10 relative z-10">
          <div className="space-y-4">
            <h3 className="text-4xl md:text-5xl font-serif italic text-gray-900 leading-tight">
                Never miss a <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-pink to-brand-blue not-italic font-black uppercase tracking-tighter">Ritual Reduction</span>
            </h3>
            <p className="text-gray-400 text-[14px] font-medium tracking-tight max-w-md mx-auto leading-relaxed italic">
                Join our exclusive journal for early access to seasonal previews, flash deals, and neural selection events.
            </p>
          </div>
          <div className="max-w-sm mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-pink/20 to-brand-blue/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <button className="relative w-full bg-gray-900 text-white py-5 rounded-full text-[11px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-brand-pink transition-all active:scale-[0.98]">
                Join the VIP list
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
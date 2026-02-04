'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Container } from '../components/ui/Container';
import { 
  Flower, 
  Heart, 
  Star, 
  Sparkles, 
  Droplets, 
  Wind, 
  Moon, 
  ArrowRight, 
  ShoppingBag,
  Info,
  Clock,
  ShieldCheck,
  Zap
} from 'lucide-react';
import StoreHeader from '../components/StoreHeader';
import StoreCategoryNav from '../components/StoreCategoryNav';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAppContext } from '../context/AppContext';

const fragranceFamilies = [
  {
    id: 'floral',
    formula: 'F-01',
    icon: Flower,
    title: 'Floral',
    description: 'Romantic and feminine with delicate petals',
    notes: ['Rose', 'Jasmine', 'Peony'],
    accent: '#ec4899',
    gradient: 'from-rose-50 via-pink-50 to-rose-100',
    pattern: 'radial-gradient(circle at 20% 20%, rgba(236, 72, 153, 0.15) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(251, 113, 133, 0.15) 0%, transparent 40%)'
  },
  {
    id: 'oriental',
    formula: 'O-02',
    icon: Star,
    title: 'Oriental',
    description: 'Exotic and warm with mysterious depth',
    notes: ['Amber', 'Vanilla', 'Spices'],
    accent: '#984904',
    gradient: 'from-amber-50 via-orange-50 to-amber-100',
    pattern: 'radial-gradient(circle at 30% 70%, rgba(152, 73, 4, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)'
  },
  {
    id: 'fresh',
    formula: 'A-03',
    icon: Droplets,
    title: 'Fresh',
    description: 'Clean and invigorating for everyday wear',
    notes: ['Citrus', 'Green', 'Aquatic'],
    accent: '#2563eb',
    gradient: 'from-blue-50 via-cyan-50 to-blue-100',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.1) 0%, transparent 60%), radial-gradient(circle at 10% 90%, rgba(6, 182, 212, 0.15) 0%, transparent 40%)'
  },
  {
    id: 'woody',
    formula: 'W-04',
    icon: Sparkles,
    title: 'Woody',
    description: 'Sophisticated and grounding with natural elegance',
    notes: ['Sandalwood', 'Cedar', 'Patchouli'],
    accent: '#455A64',
    gradient: 'from-slate-50 via-gray-100 to-slate-200',
    pattern: 'radial-gradient(circle at 80% 20%, rgba(69, 90, 100, 0.15) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(100, 116, 139, 0.1) 0%, transparent 40%)'
  }
];

export default function FragrancePage() {
  const { fetchProductsByCategory, products: allProducts } = useAppContext();
  const [fragranceProducts, setFragranceProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFamily, setActiveFamily] = useState(null);

  const handleMouseMove = (e, id) => {
    const { currentTarget: target, clientX, clientY } = e;
    const { left, top, width, height } = target.getBoundingClientRect();
    const x = ((clientX - left) / width) * 100;
    const y = ((clientY - top) / height) * 100;
    target.style.setProperty('--mouse-x', `${x}%`);
    target.style.setProperty('--mouse-y', `${y}%`);
  };

  useEffect(() => {
    const fetchFragranceProducts = async () => {
      try {
        setIsLoading(true);
        // Category 4 is assumed to be Fragrance
        const products = await fetchProductsByCategory([4]);
        setFragranceProducts(products);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFragranceProducts();
  }, [fetchProductsByCategory]);

  return (
    <div className="bg-[#FAF9F6] min-h-screen font-sans text-gray-900 pb-40 overflow-x-hidden relative">
      
            {/* Tactile Paper Grain */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>
      
                  <StoreHeader title="Fragrance." />
      
                  <StoreCategoryNav />
      
            
      
                  {/* FRAGRANCE FAMILIES - Refraction Grid */}                  <section className="pt-32 pb-12 relative z-20 -mt-20">
                    <Container>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {fragranceFamilies.map((family, index) => (                    <motion.div 
                      key={family.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group cursor-pointer relative"
                      onMouseMove={(e) => handleMouseMove(e, family.id)}
                      onMouseEnter={() => setActiveFamily(family.id)}
                      onMouseLeave={() => setActiveFamily(null)}
                    >
                      <div className={`relative aspect-[4/3] lg:aspect-[1/1] rounded-[2rem] overflow-hidden border border-gray-100 bg-gradient-to-br ${family.gradient} shadow-xl transition-all duration-700 group-hover:shadow-2xl group-hover:-translate-y-2`}>
                          
                          {/* formula ID - Top Right */}
                          <div className="absolute top-6 right-6 z-20">
                              <span className="text-[8px] font-black tracking-[0.3em] text-gray-400 group-hover:text-gray-900 transition-colors bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-gray-200/50">
                                  {family.formula}
                              </span>
                          </div>
      
                          {/* Interactive Ambient Glow */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-0">
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.8)_0%,transparent_50%)] pointer-events-none"></div>
                          </div>
      
                          {/* Abstract Pattern Layer */}
                          <div className="absolute inset-0 opacity-60 transition-transform duration-1000 group-hover:scale-110 z-0" style={{ backgroundImage: family.pattern }}></div>
                          
                          {/* Scent Molecules (Floating Particles) */}
                          <div className="absolute inset-0 overflow-hidden z-0">
                              {[...Array(6)].map((_, i) => (
                                  <motion.div
                                      key={i}
                                      animate={{
                                          y: [0, -40, 0],
                                          x: [0, (i % 2 === 0 ? 20 : -20), 0],
                                          opacity: [0.1, 0.3, 0.1]
                                      }}
                                      transition={{
                                          duration: 5 + i,
                                          repeat: Infinity,
                                          ease: "easeInOut"
                                      }}
                                      className="absolute w-1 h-1 rounded-full bg-white opacity-20"
                                      style={{
                                          left: `${Math.random() * 80 + 10}%`,
                                          top: `${Math.random() * 80 + 10}%`
                                      }}
                                  />
                              ))}
                          </div>
      
                          {/* Content */}
                          <div className="absolute inset-0 p-6 flex flex-col justify-end gap-3 z-10">
                              <div className="w-11 h-11 rounded-xl bg-white shadow-lg flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3" style={{ color: family.accent }}>
                                  <family.icon size={22} />
                              </div>
                              <div className="space-y-0.5">
                                  <h3 className="text-2xl font-serif italic text-gray-900 leading-none">{family.title}</h3>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                      {family.notes.map(note => (
                                          <span key={note} className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-white/40 text-gray-500 group-hover:text-gray-900 transition-colors border border-gray-200/20">
                                              {note}
                                          </span>
                                      ))}
                                  </div>
                              </div>
                              <p className="text-[10px] text-gray-600 leading-relaxed line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                  {family.description}
                              </p>
                              
                              {/* Interactive Scale Indicator */}
                              <div className="flex items-center gap-2 pt-1 opacity-20 group-hover:opacity-100 transition-opacity duration-700">
                                  <div className="h-[1px] flex-1 bg-gray-300">
                                      <motion.div 
                                          initial={{ width: 0 }}
                                          whileInView={{ width: "100%" }}
                                          transition={{ duration: 1.5, delay: 0.5 }}
                                          className="h-full bg-current" 
                                          style={{ color: family.accent }} 
                                      />
                                  </div>
                                  <span className="text-[6px] font-black uppercase tracking-widest text-gray-400 italic">Intensity</span>
                              </div>
                          </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Container>
            </section>
      
                  {/* FEATURED FRAGRANCES - The Grid */}
      
                  <section className="pt-8 pb-20">
      
                    <Container>
      
                      <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-8 mb-16 border-b border-gray-100 pb-12 text-center md:text-left">
      
                        <div className="space-y-4 items-center md:items-start flex flex-col">
      
                            <div className="flex items-center gap-3">
      
                                <span className="w-8 h-px bg-brand-pink"></span>
      
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-pink">Selection</span>
      
                            </div>
      
                            <h2 className="text-4xl md:text-5xl font-serif italic text-gray-900">Signature Scents</h2>
      
                        </div>
            <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                {['All', 'For Her', 'For Him', 'Unisex'].map((cat) => (
                    <button key={cat} className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all hover:bg-gray-50 first:bg-gray-900 first:text-white first:shadow-lg">
                        {cat}
                    </button>
                ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-12 md:gap-x-5">
            {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : (
                fragranceProducts.map((product, index) => (
                    <motion.div 
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <ProductCard {...product} image={product.imageUrl} />
                    </motion.div>
                ))
            )}
          </div>
        </Container>
      </section>

      {/* THE RITUAL OF LAYERING - Scientific Diagram Style */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <Container>
          <div className="text-center space-y-6 max-w-2xl mx-auto mb-24">
            <div className="flex items-center justify-center gap-4">
                <span className="h-px w-8 bg-gray-200"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-400">The Atelier Method</span>
                <span className="h-px w-8 bg-gray-200"></span>
            </div>
            <h2 className="text-4xl md:text-6xl font-serif italic text-gray-900 leading-tight">The Art of <br/> Fragrance Layering</h2>
            <p className="text-gray-500 text-sm font-light italic leading-relaxed">A biological approach to personal scent. Discover how to synchronize different olfactory layers to create a signature that is uniquely yours.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-100 -translate-y-1/2 hidden md:block z-0"></div>

            {[
                { 
                    step: "01", 
                    title: "The Base", 
                    sub: "Anchoring Note", 
                    desc: "Start with a rich, woody foundation. These molecules provide the longevity and depth of your signature.",
                    icon: ShieldCheck
                },
                { 
                    step: "02", 
                    title: "The Heart", 
                    sub: "Character Note", 
                    desc: "Add floral or spicy middle layers. This defines the emotional narrative and 'soul' of the scent.",
                    icon: Heart
                },
                { 
                    step: "03", 
                    title: "The Light", 
                    sub: "Radiance Note", 
                    desc: "Finish with citrus or aquatic top notes for an immediate, luminous burst of freshness.",
                    icon: Zap
                }
            ].map((ritual, i) => (
                <div key={i} className="relative z-10 space-y-8 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/40 group hover:border-brand-pink transition-all duration-500">
                    <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-brand-pink group-hover:text-white transition-all duration-500 shadow-inner">
                        <ritual.icon size={32} strokeWidth={1} />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-brand-pink">{ritual.step}</span>
                            <h3 className="text-2xl font-serif italic text-gray-900">{ritual.title}</h3>
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">{ritual.sub}</p>
                        <p className="text-xs text-gray-500 leading-[1.8] font-light italic">{ritual.desc}</p>
                    </div>
                    <button className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-gray-900 group-hover:text-brand-pink transition-colors">
                        Explore Notes <ArrowRight size={12} />
                    </button>
                </div>
            ))}
          </div>
        </Container>
      </section>

      {/* PRESERVATION & CONSULTATION */}
      <section className="py-32">
        <Container>
          <div className="bg-gray-900 rounded-[4rem] overflow-hidden relative shadow-2xl border border-white/5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.1)_0%,transparent_50%)]"></div>
            
            <div className="grid lg:grid-cols-2 gap-16 p-12 md:p-24 relative z-10 items-center">
                <div className="space-y-10">
                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-pink">Preservation</span>
                        <h2 className="text-4xl md:text-6xl font-serif italic text-white leading-tight">Protect Your <br/> Liquid Memories</h2>
                    </div>
                    <div className="space-y-6">
                        {[
                            { icon: Moon, text: "Store in cool, dark environments to preserve biological integrity." },
                            { icon: Wind, text: "Apply to pulse points for natural projection and evolution." },
                            { icon: Sparkles, text: "Allow the fragrance to settle naturally without friction." }
                        ].map((tip, i) => (
                            <div key={i} className="flex items-center gap-6 group">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-pink group-hover:bg-brand-pink group-hover:text-white transition-all">
                                    <tip.icon size={18} strokeWidth={1.5} />
                                </div>
                                <p className="text-white/60 text-sm font-light italic">{tip.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] p-12 border border-white/10 text-center space-y-8">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto border border-white/20">
                        <Sparkles size={32} className="text-brand-pink animate-pulse" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-serif italic text-white">Scent Concierge</h3>
                        <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Personalized Olfactory Mapping</p>
                    </div>
                    <p className="text-white/60 text-sm font-light leading-relaxed italic">
                        "Finding a signature scent is a synchronization of soul and science. Our experts are ready to curate your journey."
                    </p>
                    <button className="w-full bg-white text-gray-900 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-pink hover:text-white transition-all duration-500 shadow-xl">
                        Book Consultation
                    </button>
                </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
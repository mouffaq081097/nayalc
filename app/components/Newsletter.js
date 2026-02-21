import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Sparkles, Mail, ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setEmail('');
        formRef.current.reset();
      } else {
        toast.error(data.message || 'Subscription failed.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('An unexpected error occurred.');
    }
  };

  return (
    <section className="py-24 bg-[#FAF9F6] relative overflow-hidden border-t border-gray-100">
      {/* Tactile Paper Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Minimal Badge */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-3"
            >
                <span className="w-8 h-px bg-brand-pink/30"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-pink flex items-center gap-2">
                    <Sparkles size={10} />
                    Exclusive Invitation
                </span>
                <span className="w-8 h-px bg-brand-pink/30"></span>
            </motion.div>

            {/* Typography - Apple/Luxury Style */}
            <div className="space-y-4">
                <h2 className="text-4xl md:text-6xl font-serif text-gray-900 italic leading-tight">
                    Join the <span className="font-sans not-italic font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500">Lumière Club</span>
                </h2>
                <p className="text-base md:text-lg font-sans text-gray-500 max-w-xl mx-auto leading-relaxed">
                    Elevate your beauty ritual. Receive private previews, expert botanical insights, and bespoke offers reserved for our inner circle.
                </p>
            </div>

            {/* Refined Form */}
            <div className="w-full max-w-md mt-4">
                <form ref={formRef} onSubmit={handleSubmit} className="relative group">
                    <div className="relative flex flex-col md:flex-row gap-3">
                        <div className="relative flex-grow">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-pink transition-colors">
                                <Mail size={18} strokeWidth={1.5} />
                            </div>
                            <input 
                                type="email" 
                                placeholder="Indicate your email address" 
                                required 
                                className="w-full h-14 pl-14 pr-6 bg-white border border-gray-100 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-pink/10 focus:border-brand-pink transition-all shadow-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="h-14 px-10 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-brand-pink transition-all duration-500 flex items-center justify-center gap-3 shadow-lg shadow-black/5"
                        >
                            Subscribe
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </form>
            </div>

            {/* Perks Grid - Minimalist */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 pt-12 border-t border-gray-100 w-full mt-8">
                {[
                    { label: "20% Selection Credit", sub: "Upon your first acquisition", icon: Check },
                    { label: "Avant-Première Access", sub: "New botanical launches", icon: Check },
                    { label: "Expert Consultation", sub: "Bespoke beauty protocols", icon: Check }
                ].map((perk, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col items-center gap-2"
                    >
                        <div className="w-6 h-6 rounded-full bg-brand-pink/5 flex items-center justify-center text-brand-pink mb-1">
                            <perk.icon size={12} strokeWidth={3} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">{perk.label}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{perk.sub}</span>
                    </motion.div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Artistic Auras */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-brand-pink/[0.03] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] -left-[10%] w-[40%] h-[40%] bg-brand-blue/[0.03] rounded-full blur-[120px]"></div>
      </div>
    </section>
  );
}

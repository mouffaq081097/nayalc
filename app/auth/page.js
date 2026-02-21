'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Mail, Lock, Eye, ArrowLeft, Sparkles, UserPlus, LogIn, Chrome, Facebook, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-left space-y-2">
        <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-px bg-brand-pink/30"></span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-pink">Verified Access</span>
        </div>
        <h3 className="font-serif text-4xl italic text-gray-900 leading-tight">Welcome <br/>to the Inner Circle</h3>
        <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-[280px]">Continue your clinical botanical journey with Naya Lumière.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1" htmlFor="signin-email">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-brand-pink transition-colors" />
            <input
              id="signin-email"
              type="email"
              placeholder="Indicate your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-14 pl-14 pr-6 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-brand-pink focus:ring-4 focus:ring-brand-pink/5 transition-all duration-500 outline-none text-sm font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400" htmlFor="signin-password">Access Code</label>
            <button type="button" className="text-[9px] font-black uppercase tracking-widest text-brand-pink/60 hover:text-brand-pink transition-colors">Recover</button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-brand-pink transition-colors" />
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-14 pl-14 pr-14 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-brand-pink focus:ring-4 focus:ring-brand-pink/5 transition-all duration-500 outline-none text-sm font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4 opacity-50" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 cursor-pointer group px-1">
            <input type="checkbox" className="w-4 h-4 rounded-md border-gray-200 text-brand-pink focus:ring-brand-pink/20 transition-all cursor-pointer" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">Keep Session Active</span>
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-red-500 text-[11px] font-bold text-center bg-red-50 py-4 rounded-2xl border border-red-100"
          >
            {error}
          </motion.p>
        )}

        <button 
          type="submit" 
          disabled={isLoading} 
          className="w-full h-16 bg-black text-white rounded-full font-black uppercase tracking-[0.3em] text-[11px] hover:bg-brand-pink shadow-2xl shadow-black/10 hover:shadow-brand-pink/20 transition-all duration-500 active:scale-95 flex items-center justify-center gap-4 mt-4"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Authenticate Access
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
        <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.5em] text-gray-300"><span className="bg-white px-6">Bespoke Entry</span></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="h-14 flex items-center justify-center gap-3 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all duration-500 group">
          <Chrome size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Passport</span>
        </button>
        <button className="h-14 flex items-center justify-center gap-3 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all duration-500 group">
          <Facebook size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Facebook</span>
        </button>
      </div>
    </motion.div>
  );
}

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await register(username, email, password, firstName, lastName);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-left space-y-2">
        <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-px bg-brand-pink/30"></span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-pink">Registry Initiation</span>
        </div>
        <h3 className="font-serif text-4xl italic text-gray-900 leading-tight">Create your <br/>Personal Atelier</h3>
        <p className="text-sm text-gray-400 font-medium leading-relaxed">Join the world of molecular clinical precision.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Given Name</label>
            <input
              type="text"
              placeholder="Jean"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full h-14 px-6 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-brand-pink focus:ring-4 focus:ring-brand-pink/5 transition-all outline-none text-sm font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Surname</label>
            <input
              type="text"
              placeholder="Dupont"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full h-14 px-6 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-brand-pink focus:ring-4 focus:ring-brand-pink/5 transition-all outline-none text-sm font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Digital Address</label>
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-brand-pink transition-colors" />
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-14 pl-14 pr-6 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-brand-pink focus:ring-4 focus:ring-brand-pink/5 transition-all outline-none text-sm font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Secret Access Code</label>
          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-brand-pink transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create strong security"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-14 pl-14 pr-14 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-brand-pink focus:ring-4 focus:ring-brand-pink/5 transition-all outline-none text-sm font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-[11px] font-bold text-center bg-red-50 py-4 rounded-2xl border border-red-100">
            {error}
          </p>
        )}

        <button 
          type="submit" 
          disabled={isLoading} 
          className="w-full h-16 bg-black text-white rounded-full font-black uppercase tracking-[0.3em] text-[11px] hover:bg-brand-pink shadow-2xl shadow-black/10 hover:shadow-brand-pink/20 transition-all duration-500 active:scale-95 flex items-center justify-center gap-4 mt-2"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Initialize Account
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}

export default function AuthPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAF9F6] relative overflow-hidden flex flex-col font-sans">
      {/* Tactile Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply z-0"></div>
      
      {/* Background Auras */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] -right-[10%] w-[60%] h-[60%] bg-brand-pink/[0.03] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] -left-[10%] w-[60%] h-[60%] bg-brand-blue/[0.03] rounded-full blur-[120px]"></div>
      </div>

      <div className="container mx-auto px-6 pt-4 pb-0 relative z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-brand-pink transition-all group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Exit to Atelier
          </button>

          <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-white shadow-sm border border-gray-100">
             <div className="w-2 h-2 rounded-full bg-brand-pink animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-900">NAYA LUMIÈRE</span>
          </div>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-6 py-4 lg:py-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center h-full">
          
          {/* Left Side: Product Showcase Narrative */}
          <div className="hidden lg:block lg:col-span-7 relative h-full">
            <div className="grid grid-cols-2 gap-6 h-full items-center">
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.2 }}
                    className="space-y-6"
                >
                    <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden border border-white shadow-2xl">
                        <Image src="/Argini+MyMyoso_2x3.jpg" alt="Botanical Science" fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                        <div className="absolute bottom-8 left-8">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-1 block">Protocols</span>
                            <p className="text-xl font-serif italic text-white">The Radiance <br/>Molecular Ritual</p>
                        </div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-brand-pink/5 flex items-center justify-center text-brand-pink mb-4">
                            <ShieldCheck size={20} strokeWidth={1.5} />
                        </div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2">Member Privileges</h4>
                        <ul className="space-y-2">
                            {[
                                "Bespoke AI Skincare Analysis",
                                "Avant-Première Launch Access",
                                "Boutique Exclusive Curation"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                    <div className="w-1 h-1 rounded-full bg-brand-pink"></div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.4 }}
                    className="space-y-6 pt-24"
                >
                    <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-pink/20 blur-[60px] group-hover:bg-brand-pink/40 transition-colors duration-1000"></div>
                        <Sparkles className="text-brand-pink mb-6" size={28} strokeWidth={1.5} />
                        <h4 className="text-2xl font-serif italic leading-tight mb-4">"A commitment <br/>to the purity <br/>of light."</h4>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-px bg-white/20"></div>
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">Geneva Laboratory</span>
                        </div>
                    </div>
                    <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden border border-white shadow-2xl">
                        <Image src="/GerLift_3_4x5 copie.jpg" alt="Atelier Selection" fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                        <div className="absolute bottom-8 left-8">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-1 block">Artisanal</span>
                            <p className="text-xl font-serif italic text-white">The Collection <br/>of Curated Art</p>
                        </div>
                    </div>
                </motion.div>
            </div>
          </div>

          {/* Right Side: Auth Architecture */}
          <div className="lg:col-span-5 w-full max-w-lg mx-auto">
            <div className="bg-white/80 backdrop-blur-3xl rounded-[3.5rem] p-10 md:p-14 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.1)] border border-white relative overflow-hidden">
               {/* Subtle Grain in White Card */}
               <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>

              <Tabs defaultValue="login" className="w-full relative z-10">
                <TabsList className="flex bg-gray-50/50 p-1.5 rounded-full mb-12 border border-gray-100/50 backdrop-blur-sm">
                  <TabsTrigger 
                    value="login" 
                    className="flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-gray-900 text-gray-400"
                  >
                    Authenticate
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-gray-900 text-gray-400"
                  >
                    Initiate
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-0 outline-none">
                  <Login />
                </TabsContent>
                <TabsContent value="register" className="mt-0 outline-none">
                  <Register />
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Footer Detail */}
            <div className="mt-12 text-center space-y-4">
              <div className="flex items-center justify-center gap-4 opacity-30">
                <div className="w-12 h-px bg-gray-400"></div>
                <p className="text-[9px] font-black uppercase tracking-[0.6em] text-gray-500 whitespace-nowrap">EST. 2026 — NAYA ATELIER PRIVÉ</p>
                <div className="w-12 h-px bg-gray-400"></div>
              </div>
              <div className="flex items-center justify-center gap-6 text-gray-400">
                <ShieldCheck size={14} />
                <Lock size={14} />
                <Sparkles size={14} />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

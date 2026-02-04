'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Mail, Lock, Eye, ArrowLeft, Sparkles, UserPlus, LogIn, Chrome, Facebook } from 'lucide-react';
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
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h3 className="font-serif text-3xl italic text-gray-900">Welcome Back</h3>
        <p className="text-sm text-gray-500 font-light">Continue your journey in clinical beauty</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1" htmlFor="signin-email">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-brand-pink transition-colors" />
            <Input
              id="signin-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 pl-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all duration-300"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1" htmlFor="signin-password">Security Code</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-brand-pink transition-colors" />
            <Input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-14 pl-12 pr-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider px-1">
          <label className="flex items-center space-x-2 cursor-pointer group">
            <input type="checkbox" className="rounded-md border-gray-200 text-brand-pink focus:ring-brand-pink/20 transition-all cursor-pointer" />
            <span className="text-gray-400 group-hover:text-gray-600 transition-colors">Stay Signed In</span>
          </label>
          <a href="#" className="text-brand-pink hover:text-brand-pink-dark transition-colors">Reset Access</a>
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-red-500 text-[11px] font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100"
          >
            {error}
          </motion.p>
        )}

        <button 
          type="submit" 
          disabled={isLoading} 
          className="w-full h-14 bg-gray-900 text-white rounded-full font-black uppercase tracking-[0.3em] text-[11px] hover:bg-brand-pink shadow-xl shadow-gray-900/10 hover:shadow-brand-pink/20 transition-all duration-500 active:scale-95 flex items-center justify-center gap-3 mt-6"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={16} />
              Authenticate
            </>
          )}
        </button>
      </form>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.4em] text-gray-300"><span className="bg-white px-4">Social Entry</span></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="h-14 flex items-center justify-center gap-3 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all duration-300 group">
          <Chrome size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Google</span>
        </button>
        <button className="h-14 flex items-center justify-center gap-3 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all duration-300 group">
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
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h3 className="font-serif text-3xl italic text-gray-900">Begin Discovery</h3>
        <p className="text-sm text-gray-500 font-light">Join the elite world of clinical aesthetics</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">First Name</label>
            <Input
              type="text"
              placeholder="Jean"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="h-14 px-5 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Last Name</label>
            <Input
              type="text"
              placeholder="Dupont"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="h-14 px-5 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Unique Identifier</label>
          <Input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="h-14 px-5 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Digital Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-brand-pink transition-colors" />
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 pl-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Access Code</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-brand-pink transition-colors" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-14 pl-12 pr-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-[11px] font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100">
            {error}
          </p>
        )}

        <button 
          type="submit" 
          disabled={isLoading} 
          className="w-full h-14 bg-gray-900 text-white rounded-full font-black uppercase tracking-[0.3em] text-[11px] hover:bg-brand-pink shadow-xl shadow-gray-900/10 hover:shadow-brand-pink/20 transition-all duration-500 active:scale-95 flex items-center justify-center gap-3 mt-4"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus size={16} />
              Register Account
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
    <div className="min-h-screen bg-[#FAF9F6] relative overflow-hidden flex flex-col">
      {/* Tactile Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply z-0"></div>
      
      {/* Background Auras */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] -right-[10%] w-[60%] h-[60%] bg-brand-pink/[0.04] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] -left-[10%] w-[60%] h-[60%] bg-brand-blue/[0.04] rounded-full blur-[120px]"></div>
      </div>

      <div className="container mx-auto px-6 pt-10 pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-brand-pink transition-all group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Return to Atelier
          </button>

          {/* New Status Bar Decoration */}
          <div className="hidden md:flex items-center gap-6 px-6 py-2 rounded-full bg-white/50 backdrop-blur-md border border-gray-100 shadow-sm">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-[9px] font-black tracking-widest text-gray-400">SECURE ENCRYPTION</span>
             </div>
             <div className="w-px h-3 bg-gray-200"></div>
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-black tracking-widest text-gray-400">EST. 2026</span>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-brand-pink animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-900">NAYA LUMIÈRE</span>
          </div>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-6 pt-4 pb-12 lg:pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Side: Visual Narrative */}
          <div className="hidden lg:block relative">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2 }}
              className="relative aspect-[4/5] rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-white"
            >
              <Image
                src="/Gemini_Generated_Image_1d4x5g1d4x5g1d4x.png"
                alt="Luxury Selection"
                fill
                className="object-cover"
                priority
              />
              {/* Glass Overlay Card */}
              <div className="absolute bottom-12 left-12 right-12 p-10 rounded-[2.5rem] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-px bg-brand-pink"></div>
                    <span className="text-[10px] font-black tracking-[0.5em] text-white uppercase">Authenticated</span>
                 </div>
                 <h2 className="text-4xl font-serif text-[#FAF9F6] leading-tight mb-4 italic">The Future of <span className="font-sans not-italic font-black text-brand-pink">Lumière</span></h2>
                 <p className="text-sm text-white/80 font-light leading-relaxed">Join thousands of clinical aesthetic enthusiasts and unlock exclusive access to the private boutique selection.</p>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Auth Architecture */}
          <div className="w-full max-w-lg mx-auto lg:mx-0">
            <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.1)] border border-gray-100 relative overflow-hidden">
               {/* Subtle Grain in White Card */}
               <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>

              <Tabs defaultValue="login" className="w-full relative z-10">
                <TabsList className="flex bg-gray-50 p-1.5 rounded-full mb-12 border border-gray-100">
                  <TabsTrigger 
                    value="login" 
                    className="flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-400"
                  >
                    Authenticate
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-400"
                  >
                    New Registry
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
            <div className="mt-12 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.6em] text-gray-300">EST. 2026 — NAYA ATELIER PRIVÉ</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
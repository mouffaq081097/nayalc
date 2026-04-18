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

function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[9px] font-bold text-[rgba(107,33,168,0.5)] hover:text-[#9333ea] transition-colors mb-4"
        >
          <ArrowLeft size={11} /> Back To Sign In
        </button>
        <h3 className="font-serif italic text-[26px] leading-snug text-[#3b0764]">
          Restore <strong className="not-italic font-black cl-gradient-text">Access</strong>
        </h3>
        <p className="text-[12px] text-[rgba(59,7,100,0.45)] font-medium leading-relaxed">
          Enter your email and we'll send you a secure link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[rgba(107,33,168,0.55)]">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              type="email"
              placeholder="Enter Your Registered Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 pl-12 pr-6 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all duration-300 outline-none text-sm font-medium text-[#3b0764]"
            />
          </div>
        </div>

        {message && (
          <p className="text-green-700 text-[11px] font-bold text-center bg-[rgba(240,253,244,0.8)] py-3 rounded-xl border border-[rgba(187,247,208,0.5)]">
            {message}
          </p>
        )}
        {error && (
          <p className="text-red-600 text-[11px] font-bold text-center bg-[rgba(254,242,242,0.8)] py-3 rounded-xl border border-[rgba(254,202,202,0.5)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-full bg-gradient-to-r from-[rgb(216,180,254)] to-[rgb(126,105,230)] text-white text-[11px] font-black uppercase shadow-[0_8px_24px_rgba(126,105,230,0.35)] hover:shadow-[0_12px_32px_rgba(126,105,230,0.45)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 mt-2"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Send Reset Link <ArrowRight size={14} /></>
          )}
        </button>
      </form>
    </motion.div>
  );
}

function Login({ onForgotClick }) {
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-5 h-px bg-[rgba(216,180,254,0.6)]" />
          <span className="text-[9px] font-bold text-[rgba(147,51,234,0.6)]">Secure Access</span>
        </div>
        <h3 className="font-serif italic text-[26px] leading-snug text-[#3b0764]">
          Welcome Back <br />
          <strong className="not-italic font-black cl-gradient-text">To Your Sanctuary</strong>
        </h3>
        <p className="text-[12px] text-[rgba(59,7,100,0.45)] font-medium leading-relaxed">
          Continue your clinical botanical journey with Naya Lumière.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="signin-email" className="text-[10px] font-bold text-[rgba(107,33,168,0.55)]">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              id="signin-email"
              type="email"
              placeholder="Enter Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 pl-12 pr-6 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all duration-300 outline-none text-sm font-medium text-[#3b0764]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="signin-password" className="text-[10px] font-bold text-[rgba(107,33,168,0.55)]">Password</label>
            <button
              type="button"
              onClick={onForgotClick}
              className="text-[9px] font-bold text-[rgba(147,51,234,0.55)] hover:text-[#9333ea] transition-colors"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-12 pl-12 pr-12 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all duration-300 outline-none text-sm font-medium text-[#3b0764]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(196,167,254,0.7)] hover:text-[#9333ea] transition-colors"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 rounded border-[rgba(196,167,254,0.5)] bg-[rgba(248,240,255,0.5)] text-[#9333ea] focus:ring-[rgba(196,167,254,0.2)] cursor-pointer"
          />
          <span className="text-[10px] font-medium text-[rgba(59,7,100,0.45)] group-hover:text-[#6b21a8] transition-colors">
            Remember Me
          </span>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-red-600 text-[11px] font-bold text-center bg-[rgba(254,242,242,0.8)] py-3 rounded-xl border border-[rgba(254,202,202,0.5)]"
          >
            {error}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-full bg-gradient-to-r from-[rgb(216,180,254)] to-[rgb(126,105,230)] text-white text-[11px] font-black uppercase shadow-[0_8px_24px_rgba(126,105,230,0.35)] hover:shadow-[0_12px_32px_rgba(126,105,230,0.45)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Sign In <ArrowRight size={14} /></>
          )}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[rgba(216,180,254,0.25)]" />
        <span className="text-[9px] font-semibold text-[rgba(147,51,234,0.35)]">Or Continue With</span>
        <div className="flex-1 h-px bg-[rgba(216,180,254,0.25)]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="h-10 flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-[rgba(216,180,254,0.3)] bg-[rgba(248,240,255,0.4)] text-[10px] font-bold text-[#6b21a8] hover:bg-[rgba(248,240,255,0.8)] transition-all group">
          <Chrome size={14} className="text-[rgba(196,167,254,0.7)] group-hover:text-[#9333ea] transition-colors" />
          Google
        </button>
        <button className="h-10 flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-[rgba(216,180,254,0.3)] bg-[rgba(248,240,255,0.4)] text-[10px] font-bold text-[#6b21a8] hover:bg-[rgba(248,240,255,0.8)] transition-all group">
          <Facebook size={14} className="text-[rgba(196,167,254,0.7)] group-hover:text-[#9333ea] transition-colors" />
          Facebook
        </button>
      </div>
    </motion.div>
  );
}

function Register() {
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
      const autoUsername = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      await register(autoUsername, email, password, firstName, lastName);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-5 h-px bg-[rgba(216,180,254,0.6)]" />
          <span className="text-[9px] font-bold text-[rgba(147,51,234,0.6)]">New Account</span>
        </div>
        <h3 className="font-serif italic text-[26px] leading-snug text-[#3b0764]">
          Create Your <br />
          <strong className="not-italic font-black cl-gradient-text">Personal Account</strong>
        </h3>
        <p className="text-[12px] text-[rgba(59,7,100,0.45)] font-medium leading-relaxed">
          Join the world of clinical botanical precision.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="register-firstname" className="text-[10px] font-bold text-[rgba(107,33,168,0.55)]">First Name</label>
            <input
              id="register-firstname"
              type="text"
              placeholder="e.g. Jean"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all outline-none text-sm font-medium text-[#3b0764]"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="register-lastname" className="text-[10px] font-bold text-[rgba(107,33,168,0.55)]">Last Name</label>
            <input
              id="register-lastname"
              type="text"
              placeholder="e.g. Dupont"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all outline-none text-sm font-medium text-[#3b0764]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-email" className="text-[10px] font-bold text-[rgba(107,33,168,0.55)]">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              id="register-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 pl-12 pr-6 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all outline-none text-sm font-medium text-[#3b0764]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-password" className="text-[10px] font-bold text-[rgba(107,33,168,0.55)]">Create Password</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At Least 8 Characters"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-12 pl-12 pr-12 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all outline-none text-sm font-medium text-[#3b0764]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(196,167,254,0.7)] hover:text-[#9333ea] transition-colors"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-[11px] font-bold text-center bg-[rgba(254,242,242,0.8)] py-3 rounded-xl border border-[rgba(254,202,202,0.5)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-full bg-gradient-to-r from-[rgb(216,180,254)] to-[rgb(126,105,230)] text-white text-[11px] font-black uppercase shadow-[0_8px_24px_rgba(126,105,230,0.35)] hover:shadow-[0_12px_32px_rgba(126,105,230,0.45)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 mt-1"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Create Account <ArrowRight size={14} /></>
          )}
        </button>
      </form>
    </motion.div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState('login');

  return (
    <div className="min-h-screen bg-[#FAF9F6] relative overflow-hidden flex flex-col font-sans">
      {/* Tactile Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply z-0"></div>
      
      {/* Background Auras */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] -right-[10%] w-[60%] h-[60%] bg-brand-pink/[0.03] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] -left-[10%] w-[60%] h-[60%] bg-brand-blue/[0.03] rounded-full blur-[120px]"></div>
      </div>

      <div className="container mx-auto px-6 pt-6 pb-0 relative z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 text-[11px] font-semibold text-gray-400 hover:text-brand-pink transition-all group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to store
          </button>

          <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-white shadow-sm border border-gray-100">
             <div className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-pulse"></div>
             <span className="text-[10px] font-bold tracking-wider text-gray-900">NAYA LUMIÈRE</span>
          </div>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-6 py-6 md:py-8 relative z-10 flex items-center justify-center">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center w-full">
          
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
                            <span className="text-[10px] font-bold text-white/60 mb-1 block">Protocols</span>
                            <p className="text-xl font-serif italic text-white">The radiance <br/>molecular ritual</p>
                        </div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-brand-pink/5 flex items-center justify-center text-brand-pink mb-4">
                            <ShieldCheck size={20} strokeWidth={1.5} />
                        </div>
                        <h4 className="text-[13px] font-bold text-gray-900 mb-2">Member privileges</h4>
                        <ul className="space-y-2">
                            {[
                                "Bespoke AI skincare analysis",
                                "Avant-première launch access",
                                "Boutique exclusive curation"
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
                            <span className="text-[10px] font-medium text-white/40 tracking-wider">Geneva Laboratory</span>
                        </div>
                    </div>
                    <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden border border-white shadow-2xl">
                        <Image src="/GerLift_3_4x5 copie.jpg" alt="Atelier Selection" fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                        <div className="absolute bottom-8 left-8">
                            <span className="text-[10px] font-bold text-white/60 mb-1 block">Artisanal</span>
                            <p className="text-xl font-serif italic text-white">The collection <br/>of curated art</p>
                        </div>
                    </div>
                </motion.div>
            </div>
          </div>

          {/* Right Side: Auth Architecture */}
          <div className="lg:col-span-5 w-full max-w-lg mx-auto">
            <div className="bg-white/80 backdrop-blur-3xl rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-14 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.1)] border border-white relative overflow-hidden">
               {/* Subtle Grain in White Card */}
               <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>

              <Tabs value={authMode === 'forgot-password' ? 'login' : authMode} onValueChange={setAuthMode} className="w-full relative z-10">
                <TabsList className="flex bg-gray-50/50 p-1 rounded-full mb-8 md:mb-12 border border-gray-100/50 backdrop-blur-sm">
                  <TabsTrigger 
                    value="login" 
                    className="flex-1 py-3 md:py-4 rounded-full text-[11px] font-bold tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-gray-900 text-gray-400"
                  >
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="flex-1 py-3 md:py-4 rounded-full text-[11px] font-bold tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-gray-900 text-gray-400"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-0 outline-none">
                  {authMode === 'forgot-password' ? (
                    <ForgotPassword onBack={() => setAuthMode('login')} />
                  ) : (
                    <Login onForgotClick={() => setAuthMode('forgot-password')} />
                  )}
                </TabsContent>
                <TabsContent value="register" className="mt-0 outline-none">
                  <Register />
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Footer Detail */}
            <div className="mt-8 md:mt-12 text-center space-y-4">
              <div className="flex items-center justify-center gap-4 opacity-30">
                <div className="w-8 md:w-12 h-px bg-gray-400"></div>
                <p className="text-[10px] font-medium text-gray-500 whitespace-nowrap tracking-widest uppercase">EST. 2026 — NAYA ATELIER PRIVÉ</p>
                <div className="w-8 md:w-12 h-px bg-gray-400"></div>
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

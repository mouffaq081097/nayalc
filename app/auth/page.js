'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Mail, Lock, Eye, ArrowLeft, Sparkles, ShieldCheck, ArrowRight, Chrome, Facebook } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

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
        <h3 className="font-serif italic text-[26px] leading-snug text-[#6b21a8]">
          Restore <strong className="not-italic font-black text-transparent bg-clip-text bg-gradient-to-r from-[rgb(168,85,247)] to-[rgb(126,105,230)]">Access</strong>
        </h3>
        <p className="text-[12px] text-[rgba(107,33,168,0.55)] font-medium leading-relaxed">
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
              className="w-full h-12 pl-12 pr-6 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all duration-300 outline-none text-sm font-medium text-[#6b21a8]"
            />
          </div>
        </div>

        {message && (
          <p className="text-teal-600 text-[11px] font-bold text-center bg-[rgba(240,253,250,0.8)] py-3 rounded-xl border border-[rgba(204,251,241,0.5)]">
            {message}
          </p>
        )}
        {error && (
          <p className="text-amber-600 text-[11px] font-bold text-center bg-[rgba(255,251,235,0.8)] py-3 rounded-xl border border-[rgba(253,230,138,0.5)]">
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
        <h3 className="font-serif italic text-[26px] leading-snug text-[#6b21a8]">
          Welcome Back <br />
          <strong className="not-italic font-black text-transparent bg-clip-text bg-gradient-to-r from-[rgb(168,85,247)] to-[rgb(126,105,230)]">To Your Sanctuary</strong>
        </h3>
        <p className="text-[12px] text-[rgba(107,33,168,0.55)] font-medium leading-relaxed">
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
              className="w-full h-12 pl-12 pr-6 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all duration-300 outline-none text-sm font-medium text-[#6b21a8]"
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
              className="w-full h-12 pl-12 pr-12 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all duration-300 outline-none text-sm font-medium text-[#6b21a8]"
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
          <span className="text-[10px] font-medium text-[rgba(107,33,168,0.55)] group-hover:text-[#6b21a8] transition-colors">
            Remember Me
          </span>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-amber-600 text-[11px] font-bold text-center bg-[rgba(255,251,235,0.8)] py-3 rounded-xl border border-[rgba(253,230,138,0.5)]"
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
        <h3 className="font-serif italic text-[26px] leading-snug text-[#6b21a8]">
          Create Your <br />
          <strong className="not-italic font-black text-transparent bg-clip-text bg-gradient-to-r from-[rgb(168,85,247)] to-[rgb(126,105,230)]">Personal Account</strong>
        </h3>
        <p className="text-[12px] text-[rgba(107,33,168,0.55)] font-medium leading-relaxed">
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
              className="w-full h-12 px-4 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all outline-none text-sm font-medium text-[#6b21a8]"
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
              className="w-full h-12 px-4 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all outline-none text-sm font-medium text-[#6b21a8]"
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
              className="w-full h-12 pl-12 pr-6 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all outline-none text-sm font-medium text-[#6b21a8]"
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
              className="w-full h-12 pl-12 pr-12 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all outline-none text-sm font-medium text-[#6b21a8]"
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
          <p className="text-amber-600 text-[11px] font-bold text-center bg-[rgba(255,251,235,0.8)] py-3 rounded-xl border border-[rgba(253,230,138,0.5)]">
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
    <div className="min-h-screen bg-[#fdf8ff] relative overflow-hidden flex flex-col font-sans">
      {/* Page background auras */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] -right-[10%] w-[50%] h-[50%] bg-[rgba(216,180,254,0.2)] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] -left-[10%] w-[45%] h-[45%] bg-[rgba(167,139,250,0.15)] rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <div className="container mx-auto px-6 pt-6 pb-0 relative z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 text-[10px] font-bold text-[rgba(107,33,168,0.5)] hover:text-[#6b21a8] transition-all group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back To Store
          </button>
        </div>
      </div>

      {/* Main */}
      <main className="flex-grow container mx-auto px-6 py-6 md:py-12 relative z-10 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl mx-auto"
        >
          <div className="bg-white/[0.85] backdrop-blur-3xl rounded-[2.5rem] shadow-[0_40px_100px_-30px_rgba(147,51,234,0.15)] border border-[rgba(216,180,254,0.35)] relative overflow-hidden flex flex-col lg:flex-row">
            
            {/* Left Panel - Atelier Privé Branding */}
            <div className="hidden lg:flex w-[45%] p-12 flex-col justify-between relative border-r border-[rgba(216,180,254,0.2)] bg-gradient-to-b from-[#fdf8ff] to-[#f4ebff] overflow-hidden">
              {/* Inner Auras */}
              <div className="absolute top-[-10%] left-[-20%] w-72 h-72 bg-[rgba(216,180,254,0.4)] rounded-full blur-[70px] pointer-events-none" />
              <div className="absolute bottom-[-10%] right-[-20%] w-72 h-72 bg-[rgba(167,139,250,0.3)] rounded-full blur-[70px] pointer-events-none" />
              
              {/* Top Branding */}
              <div className="relative z-10">
                <div className="mb-10 flex items-center gap-[14px]">
                  <Image 
                    src="/Adobe Express - file (5).png" 
                    alt="Naya Lumière Logo" 
                    width={140} 
                    height={42} 
                    className="h-9 w-auto object-contain"
                  />
                  <div style={{ textAlign: 'left', lineHeight: '1.25' }}>
                    <div
                      style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        letterSpacing: '0.05em', 
                        color: '#3b0764', 
                        textTransform: 'uppercase', 
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" 
                      }}
                    >
                      NAYA
                    </div>
                    <div
                      style={{ 
                        fontSize: '12px', 
                        fontStyle: 'italic', 
                        fontFamily: "Georgia, 'Times New Roman', serif", 
                        color: '#6b21a8',
                        marginTop: '1px'
                      }}
                    >
                      Lumière Cosmetics
                    </div>
                  </div>
                </div>

                <h2 className="font-serif italic text-4xl text-[#6b21a8] leading-[1.15] mb-6">
                  Unlock the <br />
                  <strong className="not-italic font-black text-transparent bg-clip-text bg-gradient-to-r from-[rgb(168,85,247)] to-[rgb(126,105,230)]">
                    Radiance Vault
                  </strong>
                </h2>
                <p className="text-[12px] text-[#6b21a8]/60 font-medium leading-relaxed max-w-[85%]">
                  Step into a world of clinical precision. Members receive exclusive access to bespoke formulations, AI skin analysis, and private collections.
                </p>
              </div>

              {/* Bottom Features */}
              <div className="relative z-10 space-y-5">
                <div className="h-px w-12 bg-gradient-to-r from-[rgba(168,85,247,0.3)] to-transparent mb-6" />
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/60 shadow-sm border border-[rgba(216,180,254,0.5)] flex items-center justify-center backdrop-blur-md">
                    <Sparkles size={14} className="text-[#9333ea]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#6b21a8]">Bespoke AI Consultations</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/60 shadow-sm border border-[rgba(216,180,254,0.5)] flex items-center justify-center backdrop-blur-md">
                    <ShieldCheck size={14} className="text-[#9333ea]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#6b21a8]">Clinical Grade Purity</span>
                </div>
              </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-[55%] p-8 md:p-12 relative flex flex-col justify-center">
              
              {/* Mobile Branding (only visible on mobile) */}
              <div className="flex items-center justify-center mb-10 gap-[14px] lg:hidden">
                <Image 
                  src="/Adobe Express - file (5).png" 
                  alt="Naya Lumière Logo" 
                  width={140} 
                  height={42} 
                  className="h-8 w-auto object-contain"
                />
                <div style={{ textAlign: 'left', lineHeight: '1.25' }}>
                  <div
                    style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      letterSpacing: '0.05em', 
                      color: '#3b0764', 
                      textTransform: 'uppercase', 
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" 
                    }}
                  >
                    NAYA
                  </div>
                  <div
                    style={{ 
                      fontSize: '12px', 
                      fontStyle: 'italic', 
                      fontFamily: "Georgia, 'Times New Roman', serif", 
                      color: '#6b21a8',
                      marginTop: '1px'
                    }}
                  >
                    Lumière Cosmetics
                  </div>
                </div>
              </div>

              <Tabs
                value={authMode === 'forgot-password' ? 'login' : authMode}
                onValueChange={setAuthMode}
                className="w-full max-w-[400px] mx-auto"
              >
                <TabsList className="flex bg-[rgba(248,240,255,0.7)] border border-[rgba(216,180,254,0.25)] rounded-full p-1 mb-8">
                  <TabsTrigger
                    value="login"
                    className="flex-1 py-3 rounded-full text-[11px] font-bold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[rgb(216,180,254)] data-[state=active]:to-[rgb(126,105,230)] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_16px_rgba(126,105,230,0.35)] text-[rgba(107,33,168,0.45)]"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="flex-1 py-3 rounded-full text-[11px] font-bold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[rgb(216,180,254)] data-[state=active]:to-[rgb(126,105,230)] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_16px_rgba(126,105,230,0.35)] text-[rgba(107,33,168,0.45)]"
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

              {/* Mobile Footer */}
              <div className="mt-10 text-center space-y-3 lg:hidden">
                <div className="flex items-center justify-center gap-4 opacity-40">
                  <div className="w-10 h-px bg-[rgba(147,51,234,0.4)]" />
                  <p className="text-[9px] font-medium text-[rgba(107,33,168,0.5)]">Est. 2026 — Naya Lumière Cosmetics</p>
                  <div className="w-10 h-px bg-[rgba(147,51,234,0.4)]" />
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

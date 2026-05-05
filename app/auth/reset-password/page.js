'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Lock, Eye, EyeOff, Check, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Your password has been successfully restored.');
        setTimeout(() => router.push('/auth'), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-6">
        <h3 className="font-serif text-3xl italic text-[#6b21a8]">Invalid Link</h3>
        <p className="text-sm text-[rgba(107,33,168,0.5)] font-medium leading-relaxed">This reset link is invalid or has expired.</p>
        <button
          type="button"
          onClick={() => router.push('/auth')}
          className="text-[rgba(107,33,168,0.5)] hover:text-[#9333ea] font-bold uppercase text-[10px] tracking-widest transition-colors"
        >
          Back to Sign in
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-left space-y-1.5">
        <h3 className="font-serif text-3xl md:text-4xl italic text-[#6b21a8] leading-tight">Define your <br/>new password</h3>
        <p className="text-[13px] md:text-sm text-[rgba(107,33,168,0.5)] font-medium leading-relaxed">Secure your access to the Naya Lumière sanctuary.</p>
      </div>

      {message ? (
        <div className="space-y-6 text-center py-10">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-500" />
          </div>
          <p className="text-green-600 font-bold">{message}</p>
          <p className="text-xs text-[rgba(107,33,168,0.4)]">Redirecting you to the vault...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-[11px] font-semibold text-[rgba(107,33,168,0.5)] ml-1">New password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-purple-400 transition-colors" />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-14 pl-12 pr-12 rounded-2xl border border-purple-100 bg-gray-50/30 focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-[11px] font-semibold text-[rgba(107,33,168,0.5)] ml-1">Confirm password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-purple-400 transition-colors" />
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full h-14 pl-12 pr-12 rounded-2xl border border-purple-100 bg-gray-50/30 focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-sm font-medium"
              />
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
            className="cl-gradient-btn w-full h-16 rounded-full text-[15px] font-semibold flex items-center justify-center gap-4"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Update Password
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] relative overflow-hidden flex flex-col font-sans">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('/textures/natural-paper.png')] mix-blend-multiply z-0"></div>

      <main className="flex-grow container mx-auto px-6 py-12 relative z-10 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <div className="bg-white/80 backdrop-blur-3xl rounded-[3.5rem] p-10 md:p-14 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.1)] border border-purple-100 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('/textures/natural-paper.png')]"></div>
            <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-400" /></div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}

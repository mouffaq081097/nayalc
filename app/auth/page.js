'use client';
import React, { useState, FormEvent, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

const AuthPageContent = () => {
    const [mode, setMode] = useState('signin');
    return (
        <div className="flex items-center justify-center min-h-screen py-12">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
                <Link href="/" className="text-3xl font-serif text-center block">
                    <span style={{ color: 'var(--brand-blue)' }}>Naya </span><span style={{ color: 'var(--brand-pink)' }}>Lumière</span>
                </Link>

                <div className="flex border-b border-gray-200">
                    <button 
                        onClick={() => setMode('signin')}
                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${mode === 'signin' ? 'border-b-2' : ''}`} style={{ color: mode === 'signin' ? 'var(--brand-pink)' : 'var(--brand-muted)', borderColor: mode === 'signin' ? 'var(--brand-pink)' : '' }}
                    >
                        Sign In
                    </button>
                    <button 
                        onClick={() => setMode('register')}
                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${mode === 'register' ? 'border-b-2' : ''}`} style={{ color: mode === 'register' ? 'var(--brand-pink)' : 'var(--brand-muted)', borderColor: mode === 'register' ? 'var(--brand-pink)' : '' }}
                    >
                        Create Account
                    </button>
                </div>

                {mode === 'signin' ? <SignInForm /> : <RegisterForm />}
            </div>
        </div>
    );
};

const AuthPage = () => {
  return (
    <Suspense fallback={<div>Loading authentication page...</div>}>
      <AuthPageContent />
    </Suspense>
  );
};

const SignInForm = () => {
    const [email, setEmail] = useState('user@example.com');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const from = searchParams.get('from') || "/";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            router.replace(from);
        } catch (err) {
            setError('Failed to log in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
                <div>
                    <label htmlFor="signin-email" className="sr-only">Email address</label>
                    <input id="signin-email" name="email" type="email" autoComplete="email" required
                        className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none sm:text-sm focus-border-brand-pink focus-ring-brand-pink"
                        placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="signin-password" className="sr-only">Password</label>
                    <input id="signin-password" name="password" type="password" autoComplete="current-password" required
                        className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[#D18A90] focus:outline-none focus:ring-[#D18A90] sm:text-sm"
                        placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
            </div>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <div>
                <button type="submit"
                    className="group relative flex w-full justify-center rounded-md border border-transparent bg-[#4A6D70] py-2 px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#D18A90] focus:ring-offset-2 disabled:opacity-50"
                    disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </div>
        </form>
    );
}

const RegisterForm = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(name, email, password); // Pass name as username
            router.replace('/account');
        } catch (err) {
            setError(err.message || 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
         <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
                <div>
                    <label htmlFor="register-name" className="sr-only">Full Name</label>
                    <input id="register-name" name="name" type="text" autoComplete="name" required
                        className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none sm:text-sm focus-border-brand-pink focus-ring-brand-pink"
                        placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="register-email" className="sr-only">Email address</label>
                    <input id="register-email" name="email" type="email" autoComplete="email" required
                        className="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[#D18A90] focus:outline-none focus:ring-[#D18A90] sm:text-sm"
                        placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="register-password" className="sr-only">Password</label>
                    <input id="register-password" name="password" type="password" autoComplete="new-password" required
                        className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[#D18A90] focus:outline-none focus:ring-[#D18A90] sm:text-sm"
                        placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
            </div>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <div>
                <button type="submit"
                    className="group relative flex w-full justify-center rounded-md border border-transparent bg-[#4A6D70] py-2 px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#D18A90] focus:ring-offset-2 disabled:opacity-50"
                    disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                </button>
            </div>
        </form>
    );
};

export default AuthPage;

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import SignInPanel, { safePath } from '../components/auth/SignInPanel';

/**
 * /auth: the same sign-in card as the pop-up (SignInContext), as a page — for
 * protected pages that redirect here (account, checkout, admin) and old links.
 * After signing in it goes to ?callbackUrl, else home.
 */
export default function AuthPage() {
  const router = useRouter();
  const [callbackUrl, setCallbackUrl] = useState('/');
  useEffect(() => {
    setCallbackUrl(safePath(new URLSearchParams(window.location.search).get('callbackUrl')) || '/');
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5] font-sans text-[#111114]">
      <header className="border-b border-[#dedede] bg-white">
        <div className="mx-auto flex h-[64px] max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center rounded-md transition-opacity hover:opacity-75">
            <BrandLogo priority />
          </Link>
          <Link href="/" className="inline-flex h-10 items-center gap-1.5 text-[14px] text-[#111114] underline-offset-4 hover:underline">
            <ArrowLeft size={15} /> <span className="hidden sm:inline">Back to store</span><span className="sm:hidden">Store</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:py-12">
        <section aria-labelledby="auth-title" className="w-full max-w-[460px] rounded-2xl bg-white p-6 sm:p-10 sm:shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <SignInPanel callbackUrl={callbackUrl} onSignedIn={() => router.push(callbackUrl)} />
        </section>
      </main>
    </div>
  );
}

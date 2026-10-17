'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useAuth } from './AuthContext';
import SignInPanel, { safePath } from '../components/auth/SignInPanel';

/**
 * The sign-in pop-up (after Shopify): `openSignIn(callbackUrl?)` shows the
 * "Sign in or create account" card over the current page. After signing in it
 * closes and goes to `callbackUrl`, or stays on the page. /auth shows the same
 * panel for protected pages that redirect there.
 */
const SignInContext = createContext({ openSignIn: () => {}, closeSignIn: () => {} });

export const useSignIn = () => useContext(SignInContext);

export function SignInProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState(null); // { callbackUrl } while open
  const dialogRef = useRef(null);

  const openSignIn = useCallback((callbackUrl) => {
    setState({ callbackUrl: safePath(callbackUrl) });
  }, []);
  const closeSignIn = useCallback(() => setState(null), []);

  // Signed in some other way (another tab, Google): nothing left to ask
  useEffect(() => { if (isAuthenticated) setState(null); }, [isAuthenticated]);

  // Esc closes; the page behind doesn't scroll; focus starts inside the card
  useEffect(() => {
    if (!state) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setState(null); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [state]);

  const onSignedIn = () => {
    const target = state?.callbackUrl;
    setState(null);
    if (target && target !== pathname) router.push(target);
    else router.refresh();
  };

  return (
    <SignInContext.Provider value={{ openSignIn, closeSignIn }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) setState(null); }}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signin-modal-title"
            tabIndex={-1}
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white px-6 pb-8 pt-10 shadow-2xl outline-none sm:max-w-[520px] sm:rounded-2xl sm:px-10 sm:pb-10 sm:pt-12"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={() => setState(null)}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-[#5a5a64] transition-colors hover:bg-black/5 hover:text-[#111114] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111114]/30"
            >
              <X size={22} />
            </button>
            <SignInPanel
              titleId="signin-modal-title"
              callbackUrl={state.callbackUrl || pathname || '/'}
              onSignedIn={onSignedIn}
            />
          </div>
        </div>
      )}
    </SignInContext.Provider>
  );
}

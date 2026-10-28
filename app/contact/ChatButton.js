'use client';

import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useSignIn } from '@/app/context/SignInContext';

/** Opens the chat window for signed-in customers; asks everyone else to sign in first. */
export default function ChatButton({ className }) {
  const { isAuthenticated } = useAuth();
  const { setIsChatOpen } = useAppContext();
  const { openSignIn } = useSignIn();
  return (
    <button
      type="button"
      onClick={() => (isAuthenticated ? setIsChatOpen?.(true) : openSignIn())}
      className={className}
    >
      {isAuthenticated ? 'Open chat' : 'Sign in to chat'}
    </button>
  );
}

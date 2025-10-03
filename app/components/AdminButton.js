'use client';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export function AdminButton() {
  const { user } = useAuth();
  const router = useRouter();

  if (user?.email !== 'mouffaq@nayalc.com') {
    return null;
  }

  const handleClick = () => {
    router.push('/admin');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-4 left-4 bg-red-600 text-white px-3 py-1 rounded text-xs opacity-50 hover:opacity-100 transition-opacity z-50"
      title="Admin Access (Demo)"
    >
      Admin
    </button>
  );
}

'use client';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

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
      className="fixed bottom-6 left-6 z-[200] flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 rounded-full shadow-2xl hover:bg-white hover:scale-105 active:scale-95 transition-all duration-500 group"
      title="Access Control Panel"
    >
      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white transition-colors group-hover:bg-indigo-700">
        <ShieldCheck size={14} />
      </div>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 whitespace-nowrap">
        Admin Portal
      </span>
    </button>
  );
}

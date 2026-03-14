'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, noBodyPadding = false, size = 'max-w-md' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-6"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div
        className={`relative w-full ${size} bg-white shadow-2xl 
          rounded-t-[2.5rem] md:rounded-[3rem] 
          h-[92vh] md:h-auto md:max-h-[90vh]
          mt-auto md:mt-0
          flex flex-col
          overflow-hidden 
          animate-in slide-in-from-bottom-full md:slide-in-from-bottom-10 md:zoom-in-95 
          duration-500 z-50 border-t md:border border-gray-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Grab Handle - Mobile Only */}
        <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mt-4 mb-2 md:hidden" />

        {/* Close Button - Premium Position */}
        <button
          className="absolute top-6 right-6 md:top-10 md:right-10 z-[60] p-3 bg-gray-50/80 backdrop-blur-md hover:bg-white text-gray-900 rounded-2xl shadow-sm transition-all hover:rotate-90 group"
          onClick={onClose}
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        {title && (
          <div className="px-10 pt-10 md:px-16 md:pt-16 pb-4 border-b border-gray-50 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
              <h2 className="text-3xl font-serif italic text-gray-900 leading-tight">{title}</h2>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mt-3 ml-5">Operational Protocol</p>
          </div>
        )}
        
        <div className={`flex-1 overflow-y-auto no-scrollbar ${noBodyPadding ? '' : 'p-10 md:p-16'}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
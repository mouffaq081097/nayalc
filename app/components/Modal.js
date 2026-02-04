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
          rounded-t-[2.5rem] md:rounded-[2.5rem] 
          h-[92vh] md:h-auto 
          mt-auto md:mt-0
          overflow-hidden 
          animate-in slide-in-from-bottom-full md:slide-in-from-bottom-10 md:zoom-in-95 
          duration-500 z-50 border-t md:border border-gray-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Grab Handle - Mobile Only */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2 md:hidden" />

        {/* Close Button - Premium Position */}
        <button
          className="absolute top-6 right-6 md:top-8 md:right-8 z-[60] p-3 bg-gray-50/80 backdrop-blur-md hover:bg-white text-gray-900 rounded-2xl shadow-sm transition-all hover:rotate-90 group"
          onClick={onClose}
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        <div className={`relative ${noBodyPadding ? '' : 'p-8 md:p-12'}`}>
          {title && (
            <div className="mb-8 pr-12">
              <h2 className="text-2xl font-serif italic text-gray-900">{title}</h2>
            </div>
          )}
          <div className="max-h-[80vh] md:max-h-[85vh] overflow-y-auto no-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
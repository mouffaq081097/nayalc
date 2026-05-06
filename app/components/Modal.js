'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, noBodyPadding = false, size = 'max-w-md' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    const onEsc = (e) => { if (e.keyCode === 27) onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('keydown', onEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full ${size}
          rounded-t-2xl md:rounded-2xl
          h-[92vh] md:h-auto md:max-h-[90vh]
          mt-auto md:mt-0 flex flex-col overflow-hidden
          bg-white border border-[#e5e5ea]
          animate-in slide-in-from-bottom-full md:slide-in-from-bottom-4 md:zoom-in-95 duration-300 z-50`}
        style={{ boxShadow: '0 8px 40px rgba(17,17,20,.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="w-10 h-1 rounded-full bg-[#e5e5ea] mx-auto mt-3 mb-1 md:hidden" />

        {/* Close button */}
        <button
          className="absolute top-4 right-4 md:top-5 md:right-5 z-[60] w-9 h-9 flex items-center justify-center rounded-full border border-[#e5e5ea] bg-white text-[#5a5a64] hover:bg-[#f3f3f5] transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} strokeWidth={2} />
        </button>

        {title && (
          <div className="px-6 pt-5 pb-4 border-b border-[#e5e5ea] sticky top-0 z-50 bg-white">
            <div className="flex items-center gap-3 pr-10">
              <div
                className="w-1 h-6 rounded-full flex-shrink-0"
                style={{ background: 'linear-gradient(180deg,#c087fc,#9869f7)' }}
              />
              <h2 className="text-[17px] font-semibold text-[#111114]">{title}</h2>
            </div>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto no-scrollbar ${noBodyPadding ? '' : 'p-6'}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;

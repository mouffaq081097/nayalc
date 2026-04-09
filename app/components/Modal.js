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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-md animate-in fade-in duration-500"
        style={{ background: 'rgba(30,10,60,0.55)' }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${size}
          rounded-t-[2.5rem] md:rounded-[2.5rem]
          h-[92vh] md:h-auto md:max-h-[90vh]
          mt-auto md:mt-0
          flex flex-col overflow-hidden
          animate-in slide-in-from-bottom-full md:slide-in-from-bottom-10 md:zoom-in-95
          duration-500 z-50`}
        style={{
          background: 'linear-gradient(160deg, rgba(248,240,255,0.98), rgba(255,248,255,0.96))',
          border: '1px solid rgba(216,180,254,0.45)',
          boxShadow: '0 24px 80px rgba(147,51,234,0.18), 0 4px 24px rgba(196,167,254,0.25)',
          backdropFilter: 'blur(24px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="w-10 h-1 rounded-full mx-auto mt-4 mb-2 md:hidden" style={{ background: 'rgba(196,167,254,0.5)' }} />

        {/* Close button */}
        <button
          className="absolute top-5 right-5 md:top-6 md:right-6 z-[60] w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
          style={{
            background: 'rgba(196,167,254,0.18)',
            border: '1px solid rgba(196,167,254,0.35)',
            color: 'rgb(126,105,230)',
          }}
          onClick={onClose}
        >
          <X size={16} strokeWidth={2} />
        </button>

        {title && (
          <div
            className="px-7 pt-6 pb-4 sticky top-0 z-50"
            style={{
              background: 'linear-gradient(160deg, rgba(248,240,255,0.98), rgba(255,248,255,0.96))',
              borderBottom: '1px solid rgba(216,180,254,0.25)',
            }}
          >
            <div className="flex items-center gap-3 pr-10">
              <div
                className="w-1 h-7 rounded-full flex-shrink-0"
                style={{ background: 'linear-gradient(180deg, rgb(196,167,254), rgb(126,105,230))' }}
              />
              <h2 className="text-[18px] font-bold tracking-tight" style={{ color: '#3b0764' }}>{title}</h2>
            </div>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto no-scrollbar ${noBodyPadding ? '' : 'p-6 md:p-7'}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;

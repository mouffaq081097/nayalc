'use client';

import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, noBodyPadding = false }) => {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none transition-opacity duration-300 ease-in-out backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl mx-auto my-6 transition-transform duration-300 ease-in-out transform scale-95 opacity-0 animate-modal-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/*content*/}
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none z-50">
          {/*header*/}
          <div className="flex items-center justify-between p-5 border-b border-solid border-gray-200 rounded-t">
            <h2 className="text-2xl font-semibold text-gray-900">
              {title}
            </h2>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-gray-400 hover:text-gray-600 float-right text-xl leading-none font-semibold outline-none focus:outline-none"
              onClick={onClose}
            >
              <span className="h-6 w-6 block outline-none focus:outline-none">
                ×
              </span>
            </button>
          </div>
          {/*body*/}
          <div className={`relative flex-auto max-h-[70vh] overflow-y-auto ${noBodyPadding ? '' : 'p-6'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
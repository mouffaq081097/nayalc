"use client";

import React, { useState, forwardRef } from 'react';
import { X } from 'lucide-react';

export const AnnouncementBar = forwardRef(function AnnouncementBarComponent({ message = "", initialVisibility = true }, ref) {
  const [isVisible, setIsVisible] = useState(initialVisibility);

  if (!isVisible) {
    return null;
  }

  return (
    <div ref={ref} className="fixed top-0 left-0 right-0 z-50 bg-gray-800 text-white text-center p-2 flex items-center justify-center relative">
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
});

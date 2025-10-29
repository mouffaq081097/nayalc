"use client";

import React, { forwardRef } from 'react';
import { UaeFlagIcon, StoreIcon, AngleDownIcon } from './Icons';

export const TopBar = forwardRef(function TopBarComponent(props, ref) {
  return (
    <div ref={ref} className="bg-gray-100 text-gray-700 text-xs text-center overflow-hidden transition-[height] duration-300 ease-in-out h-8 flex items-center">
      <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer hover:text-gray-300">
            <UaeFlagIcon className="w-5 h-5" />
            <span className="font-semibold">United Arab Emirates</span>
          </div>
          <span className="text-gray-400">Dubai</span>
        </div>
        {/* Welcome/Announcement Message */}
        <div className="hidden lg:flex items-center justify-center flex-1">
          <p className="text-black font-medium">Free shipping on all orders over AED 200!</p>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#" className="flex items-center gap-2 hover:text-gray-300">
            <StoreIcon className="w-4 h-4" />
            <span>Find My Store</span>
          </a>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-gray-300">Contact Us</a>
          {/* Social Media Links Placeholder */}
          <div className="hidden lg:flex items-center gap-3">
            <a href="#" className="hover:text-gray-300">FB</a>
            <a href="#" className="hover:text-gray-300">IG</a>
            <a href="#" className="hover:text-gray-300">TW</a>
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:text-gray-300">
            <span>EN</span>
            <AngleDownIcon className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
});
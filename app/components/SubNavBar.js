"use client";

import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';

export function SubNavBar({ isScrolled }) {
  return (
    <div className={`bg-gray-100 text-gray-800 text-center overflow-hidden transition-[height] duration-300 ease-in-out h-10 py-2`}>
      <div className="flex items-center justify-between gap-4 text-sm h-full px-4">
        {/* Left Section: Location */}
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          <span className="font-medium">United Arab Emirates</span>
          <span className="text-gray-600">Dubai</span>
        </div>

        {/* Center Section: Store Finder */}
        <a href="/help/stores" className="flex items-center gap-1 hover:underline">
          <img src="https://s3.letoilegulf.com/oasis-strapi-ae-prod/find_You_Store_Icon_488f6c096d.svg" alt="Find My Store Icon" className="h-4 w-4" />
          <span>Find My Store</span>
        </a>

        {/* Right Section: Contact Us & Language */}
        <div className="flex items-center gap-4">
          <a href="/help/contact-information" className="hover:underline">Contact Us</a>
          <div className="flex items-center gap-1 cursor-pointer">
            <span>EN</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

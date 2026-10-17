import React from 'react';

// `wide` (homepage sections, after Pitaka): nearly edge to edge on big screens,
// ~4% side margins, so the product cards can grow with the screen
export function Container({ children, className = '', wide = false }) {
  const width = wide ? 'max-w-[2400px] px-4 sm:px-6 lg:px-10 2xl:px-[4%]' : 'max-w-7xl px-4 sm:px-6 lg:px-8';
  return (
    <div className={`${width} mx-auto ${className}`}>
      {children}
    </div>
  );
}

'use client';
import React from 'react';
import { Search, X } from 'lucide-react';

// Shared building blocks for admin list pages: view pills, search box and empty state

// Filter selects that sit in the toolbar next to the search box
export const toolbarSelectStyle = { width: 'auto', height: 32, paddingTop: 0, paddingBottom: 0, paddingLeft: 10, paddingRight: 8, fontSize: 13 };

export const ViewPill = ({ active, count, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className="shrink-0 inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer hover:bg-[#f1f1f1]"
    style={active ? { background: '#ebebeb', color: 'var(--sp-text)' } : { color: 'var(--sp-text-secondary)' }}
  >
    {children}
    <span
      className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold inline-flex items-center justify-center"
      style={active ? { background: '#ffffff', color: 'var(--sp-text)' } : { background: '#f1f1f1', color: 'var(--sp-text-secondary)' }}
    >
      {count}
    </span>
  </button>
);

export const SearchBox = ({ value, onChange, placeholder, className = 'w-full md:w-72' }) => (
  <div className={`relative shrink-0 ${className}`}>
    <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--sp-text-subdued)' }} />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="sp-input"
      style={{ height: 32, paddingTop: 0, paddingBottom: 0, paddingLeft: 32, paddingRight: value ? 32 : 12, fontSize: 13 }}
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Clear search"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center hover:bg-[#f1f1f1] cursor-pointer"
        style={{ color: 'var(--sp-text-subdued)' }}
      >
        <X size={13} />
      </button>
    )}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="py-14 px-6 flex flex-col items-center text-center">
    {Icon && (
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: '#f1f1f1' }}>
        <Icon size={22} style={{ color: 'var(--sp-text-secondary)' }} />
      </div>
    )}
    <p className="text-[14px] font-semibold" style={{ color: 'var(--sp-text)' }}>{title}</p>
    {description && <p className="text-[13px] mt-1 max-w-[480px] leading-relaxed" style={{ color: 'var(--sp-text-subdued)' }}>{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

'use client';
import React from 'react';
import Link from 'next/link';
import {
  Banknote, BookOpen, ExternalLink, Globe, Home, Image as ImageIcon, LayoutTemplate, LogOut,
  MessageSquare, Percent, Send, Share2, ShoppingBag, Tag, Users,
} from 'lucide-react';

// Store operations. A section's sub-pages show under it while you're inside that section, like Shopify.
const MAIN_NAV = [
  { to: '/admin', text: 'Home', icon: Home },
  {
    to: '/admin/orders', text: 'Orders', icon: ShoppingBag, badge: 'orders',
    children: [
      { to: '/admin/orders/abandoned', text: 'Abandoned checkouts' },
      { to: '/admin/recover-order', text: 'Recover order' },
    ],
  },
  {
    to: '/admin/products', text: 'Products', icon: Tag,
    children: [
      { to: '/admin/categories', text: 'Categories' },
      { to: '/admin/brands', text: 'Brands' },
    ],
  },
  { to: '/admin/users', text: 'Customers', icon: Users },
  { to: '/admin/chat', text: 'Inbox', icon: MessageSquare, badge: 'chats' },
  { to: '/admin/marketing', text: 'Marketing', icon: Send },
  { to: '/admin/coupons', text: 'Discounts', icon: Percent },
  { to: '/admin/payments', text: 'Payments', icon: Banknote },
];

// Pages that edit what shoppers see on the storefront
const STORE_NAV = [
  { to: '/admin/hero', text: 'Hero banner', icon: ImageIcon },
  { to: '/admin/homepage', text: 'Homepage images', icon: LayoutTemplate },
  { to: '/admin/journal', text: 'Journal', icon: BookOpen },
  { to: '/admin/seo', text: 'SEO', icon: Globe },
  { to: '/admin/social', text: 'Social', icon: Share2 },
];

const ALL_LINKS = [...MAIN_NAV.flatMap(item => [item, ...(item.children || [])]), ...STORE_NAV];

// The most specific link matching the path, so /admin/orders/abandoned highlights only "Abandoned checkouts"
const activeHref = (pathname) => ALL_LINKS
  .filter(link => (link.to === '/admin' ? pathname === '/admin' : pathname === link.to || pathname.startsWith(`${link.to}/`)))
  .sort((a, b) => b.to.length - a.to.length)[0]?.to;

const CountBadge = ({ count }) => (count > 0 ? (
  <span className="ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold bg-[#303030] text-white rounded-full">
    {count > 99 ? '99+' : count}
  </span>
) : null);

const NavItem = ({ item, current, inSection, badge, onNavigate }) => (
  <Link
    href={item.to}
    onClick={onNavigate}
    className="sp-nav-link text-[13px] font-medium"
    data-active={current ? 'true' : undefined}
    data-section={inSection ? 'true' : undefined}
    aria-current={current ? 'page' : undefined}
  >
    <item.icon size={18} strokeWidth={2} className="shrink-0" />
    <span>{item.text}</span>
    <CountBadge count={badge} />
  </Link>
);

const SubItem = ({ item, current, onNavigate }) => (
  <Link
    href={item.to}
    onClick={onNavigate}
    className="sp-nav-link sp-nav-sublink text-[13px] font-medium"
    data-active={current ? 'true' : undefined}
    aria-current={current ? 'page' : undefined}
  >
    <span>{item.text}</span>
  </Link>
);

export default function AdminSidebar({ pathname, notifications, onNavigate, onLogout }) {
  const current = activeHref(pathname);
  const badges = {
    orders: notifications?.unreadOrdersCount || 0,
    chats: notifications?.unreadChatsCount || 0,
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--sp-bg)' }}>
      <nav className="flex-1 px-3 py-3 overflow-y-auto no-scrollbar" aria-label="Admin">
        <div className="space-y-0.5">
          {MAIN_NAV.map(item => {
            const children = item.children || [];
            const inSection = current === item.to || children.some(child => child.to === current);
            return (
              <div key={item.to} className="space-y-0.5">
                <NavItem
                  item={item}
                  current={current === item.to}
                  inSection={inSection}
                  badge={badges[item.badge]}
                  onNavigate={onNavigate}
                />
                {inSection && children.map(child => (
                  <SubItem key={child.to} item={child} current={current === child.to} onNavigate={onNavigate} />
                ))}
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3" style={{ borderTop: '1px solid #e0e0e0' }}>
          <div className="flex items-center justify-between pl-2.5 pr-1 pb-1.5">
            <p className="text-[12px] font-semibold" style={{ color: 'var(--sp-text-subdued)' }}>Online store</p>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium transition-colors hover:bg-[#ebebeb]"
              style={{ color: 'var(--sp-text-secondary)' }}
              aria-label="View online store in a new tab"
            >
              View <ExternalLink size={12} />
            </Link>
          </div>
          <div className="space-y-0.5">
            {STORE_NAV.map(item => (
              <NavItem key={item.to} item={item} current={current === item.to} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </nav>

      <div className="px-3 py-3" style={{ borderTop: '1px solid #e0e0e0' }}>
        <button onClick={onLogout} className="sp-nav-link w-full text-[13px] font-medium cursor-pointer">
          <LogOut size={18} strokeWidth={2} className="shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}

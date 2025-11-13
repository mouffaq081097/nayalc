'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, ShoppingBag, MapPin, Heart, Package, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
    const { logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        logout();
        router.push('/');
    };


    const navItems = [
        { to: '/admin', text: 'Dashboard', icon: 'user' },
        { to: '/admin/products', text: 'Products', icon: 'bag' },
        { to: '/admin/categories', text: 'Categories', icon: 'map-pin' },
        { to: '/admin/brands', text: 'Brands', icon: 'heart' },
        { to: '/admin/orders', text: 'Orders', icon: 'orders' },
        { to: '/admin/coupons', text: 'Coupons', icon: 'bag' },
    ];

    const IconMap = {
        user: User,
        bag: ShoppingBag,
        'map-pin': MapPin,
        heart: Heart,
        orders: Package, // Assuming 'orders' maps to Package icon
        logout: LogOut,
        menu: Menu,
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Mobile Sidebar */}
            {isSidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <aside className="w-64 bg-slate-800 text-white flex flex-col">
                        <div className="p-6 text-center border-b border-slate-700">
                            <Link href="/admin" className="text-2xl font-serif">
                                <span className="text-brand-blue">Naya </span><span className="text-brand-pink">Lumière</span>
                                <span className="block text-xs font-sans tracking-widest text-brand-muted">ADMIN</span>
                            </Link>
                        </div>
                        <nav className="flex-1 px-4 py-6">
                            <ul>
                                {navItems.map(item => (
                                    <li key={item.to}>
                                        <Link
                                            href={item.to}
                                            className={`flex items-center space-x-3 px-4 py-3 my-1 rounded-md transition-colors ${
                                                pathname === item.to || (item.to === '/admin' && pathname === '/admin')
                                                    ? 'bg-slate-700 text-white'
                                                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                            }`}
                                            onClick={() => setIsSidebarOpen(false)}
                                        >
                                            {React.createElement(IconMap[item.icon], { className: "w-5 h-5" })}
                                            <span>{item.text}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                         <div className="p-4 border-t border-slate-700 space-y-2">
                            <Link href="/" className="flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-md">
                                {React.createElement(IconMap['logout'], { className: "w-5 h-5 -scale-x-100"})}
                                <span>Back to Store</span>
                            </Link>
                            <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-md">
                                {React.createElement(IconMap['logout'], { className: "w-5 h-5"})}
                                <span>Logout</span>
                            </button>
                        </div>
                    </aside>
                    <div className="flex-1 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 bg-slate-800 text-white flex-col">
                <div className="p-6 text-center border-b border-slate-700">
                    <Link href="/admin" className="text-2xl font-serif">
                        <span className="text-brand-blue">Naya </span><span className="text-brand-pink">Lumière</span>
                        <span className="block text-xs font-sans tracking-widest text-brand-muted">ADMIN</span>
                    </Link>
                </div>
                <nav className="flex-1 px-4 py-6">
                    <ul>
                        {navItems.map(item => (
                            <li key={item.to}>
                                <Link
                                    href={item.to}
                                    className={`flex items-center space-x-3 px-4 py-3 my-1 rounded-md transition-colors ${
                                        pathname === item.to || (item.to === '/admin' && pathname === '/admin')
                                            ? 'bg-slate-700 text-white'
                                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                    }`}
                                >
                                    {React.createElement(IconMap[item.icon], { className: "w-5 h-5" })}
                                    <span>{item.text}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                 <div className="p-4 border-t border-slate-700 space-y-2">
                    <Link href="/" className="flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-md">
                        {React.createElement(IconMap['logout'], { className: "w-5 h-5 -scale-x-100"})}
                        <span>Back to Store</span>
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-md">
                        {React.createElement(IconMap['logout'], { className: "w-5 h-5"})}
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm p-4 flex items-center">
                    <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 mr-2 text-gray-600">
                        {React.createElement(IconMap['menu'], { className: "w-6 h-6" })}
                    </button>
                    <h1 className="text-xl font-semibold text-gray-800">Admin Portal</h1>
                </header>
                <div className="flex-1 p-6 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
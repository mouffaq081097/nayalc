'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, ShoppingBag, MapPin, Heart, Package, LogOut, Menu, X, LayoutDashboard, Tags, Ticket, Users, MessageSquare } from 'lucide-react';
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
        { to: '/admin', text: 'Dashboard', icon: 'dashboard' },
        { to: '/admin/products', text: 'Products', icon: 'package' },
        { to: '/admin/categories', text: 'Categories', icon: 'tags' },
        { to: '/admin/brands', text: 'Brands', icon: 'heart' },
        { to: '/admin/orders', text: 'Orders', icon: 'shopping-bag' },
        { to: '/admin/coupons', text: 'Coupons', icon: 'ticket' },
        { to: '/admin/users', text: 'Users', icon: 'users' },
        { to: '/admin/chat', text: 'Chat', icon: 'message-square' },
    ];

    const IconMap = {
        dashboard: LayoutDashboard,
        package: Package,
        tags: Tags,
        heart: Heart,
        'shopping-bag': ShoppingBag,
        ticket: Ticket,
        users: Users,
        'message-square': MessageSquare,
        logout: LogOut,
        menu: Menu,
        x: X,
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [unreadAdminChatCount, setUnreadAdminChatCount] = useState(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await fetch('/api/admin/chat/unread');
                if (response.ok) {
                    const data = await response.json();
                    setUnreadAdminChatCount(data.unreadCount);
                } else {
                    console.error('Failed to fetch unread admin chat count');
                }
            } catch (error) {
                console.error('Error fetching unread admin chat count:', error);
            }
        };

        fetchUnreadCount();
        // Optional: Set up an interval to refetch the count periodically
        const intervalId = setInterval(fetchUnreadCount, 30000); // Refetch every 30 seconds
        return () => clearInterval(intervalId);
    }, []);

    const currentPage = navItems.find(item => pathname === item.to || (pathname.startsWith(item.to) && item.to !== '/admin'));
    const pageTitle = currentPage ? currentPage.text : 'Admin Portal';

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="p-6 text-center border-b border-gray-200">
                <Link href="/admin" className="text-2xl font-serif">
                    <span className="text-indigo-600">Naya</span><span className="text-pink-500">Lumière</span>
                    <span className="block text-xs font-sans tracking-widest text-gray-500">ADMIN</span>
                </Link>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map(item => (
                    <Link
                        key={item.to}
                        href={item.to}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            pathname === item.to || (item.to !== '/admin' && pathname.startsWith(item.to))
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                        onClick={() => isSidebarOpen && setIsSidebarOpen(false)}
                    >
                        {React.createElement(IconMap[item.icon], { className: "w-5 h-5" })}
                        <span>{item.text}</span>
                        {item.to === '/admin/chat' && unreadAdminChatCount > 0 && (
                            <span className="ml-auto px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
                                {unreadAdminChatCount}
                            </span>
                        )}
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-200 space-y-2">
                <Link href="/" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg">
                    {React.createElement(IconMap['logout'], { className: "w-5 h-5 -scale-x-100"})}
                    <span>Back to Store</span>
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg">
                    {React.createElement(IconMap['logout'], { className: "w-5 h-5"})}
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile Sidebar */}
            {isSidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <aside className="w-72 bg-white text-gray-800 flex flex-col shadow-lg">
                        <SidebarContent />
                    </aside>
                    <div className="flex-1 bg-black/30" onClick={() => setIsSidebarOpen(false)}></div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 bg-white text-gray-800 flex-col border-r border-gray-200">
                <SidebarContent />
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm p-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 -ml-2 mr-2 text-gray-600">
                            {React.createElement(IconMap[isSidebarOpen ? 'x' : 'menu'], { className: "w-6 h-6" })}
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">{pageTitle}</h1>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
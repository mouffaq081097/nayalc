'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAppContext } from '../../context/AppContext';
import Link from 'next/link';
import { MessageSquare, Trash2, Clock, ArrowRight, Search, Sparkles, ShieldCheck, Inbox, BotMessageSquare } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

const TABS = [
    { id: 'pending', label: 'Pending', description: 'Needs a reply' },
    { id: 'ai', label: 'AI Handling', description: 'Bot is active' },
    { id: 'closed', label: 'Closed', description: 'Resolved' },
    { id: 'all', label: 'All', description: 'Every conversation' },
];

function getStatusBadge(status) {
    switch (status) {
        case 'pending_admin_response':
            return { label: 'Needs Reply', classes: 'bg-red-50 text-red-600 border-red-200' };
        case 'open':
            return { label: 'Needs Reply', classes: 'bg-red-50 text-red-600 border-red-200' };
        case 'ai_handling':
            return { label: 'AI Handling', classes: 'bg-purple-50 text-purple-600 border-purple-200' };
        case 'pending_customer_response':
            return { label: 'Awaiting Client', classes: 'bg-orange-50 text-orange-600 border-orange-200' };
        case 'closed':
            return { label: 'Closed', classes: 'bg-gray-100 text-gray-400 border-gray-200' };
        default:
            return { label: status?.replace(/_/g, ' ') || 'Unknown', classes: 'bg-gray-50 text-gray-400 border-gray-200' };
    }
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const AdminChatPage = () => {
    const { fetchWithAuth } = useAppContext();
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    const socketRef = useRef(null);

    // Socket initialization — runs after first data load
    useEffect(() => {
        const initSocket = async () => {
            await fetch('/api/socket');
            const sock = io('/', { path: '/api/socket_io' });
            socketRef.current = sock;

            sock.on('connect', () => sock.emit('join_room', 'admin'));

            sock.on('receive_message', (message) => {
                const convId = message.conversation_id || message.conversationId;
                const msgText = message.message_text || message.messageText;
                const senderType = message.sender_type || message.senderType;
                const now = new Date().toISOString();
                setConversations(prev => prev.map(conv =>
                    conv.id === convId ? {
                        ...conv,
                        updatedAt: now,
                        lastMessage: msgText,
                        lastMessageAt: now,
                        unreadCount: senderType === 'customer' ? (conv.unreadCount || 0) + 1 : conv.unreadCount,
                    } : conv
                ));
            });

            sock.on('conversation_status_updated', (updated) => {
                setConversations(prev => prev.map(conv =>
                    conv.id === updated.id ? { ...conv, ...updated } : conv
                ));
            });
        };

        if (!isLoading) initSocket();

        return () => {
            if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
        };
    }, [isLoading]);

    const fetchAllConversations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetchWithAuth('/api/chat-global/conversations');
            if (!response.ok) throw new Error('Failed to fetch conversations');
            const data = await response.json();
            // Sort by lastMessageAt desc
            data.sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt));
            setConversations(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [fetchWithAuth]);

    useEffect(() => { fetchAllConversations(); }, [fetchAllConversations]);

    const handleDeleteConversation = async (conversationId) => {
        if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
        try {
            const res = await fetchWithAuth(`/api/chat/conversation/${conversationId}`, { method: 'DELETE' });
            if (res.ok) setConversations(prev => prev.filter(c => c.id !== conversationId));
        } catch (err) {
            console.error(err);
        }
    };

    // Tab filtering
    const applyTab = (list, tab) => {
        switch (tab) {
            case 'pending':
                return list.filter(c => c.status === 'pending_admin_response' || c.status === 'open');
            case 'ai':
                return list.filter(c => c.status === 'ai_handling');
            case 'closed':
                return list.filter(c => c.status === 'closed');
            default:
                return list;
        }
    };

    // Search + tab filter, always sorted by lastMessageAt
    const searchFiltered = conversations.filter(c =>
        (c.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const displayList = applyTab(searchFiltered, activeTab).sort(
        (a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt)
    );

    // Tab counts (on full search-filtered list, not display list)
    const tabCounts = {
        pending: searchFiltered.filter(c => c.status === 'pending_admin_response' || c.status === 'open').length,
        ai: searchFiltered.filter(c => c.status === 'ai_handling').length,
        closed: searchFiltered.filter(c => c.status === 'closed').length,
        all: searchFiltered.length,
    };

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-[3px] border-cl-purple border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-gray-400">Loading conversations...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 ">Inbox</h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {tabCounts.pending > 0
                            ? `${tabCounts.pending} conversation${tabCounts.pending > 1 ? 's' : ''} need${tabCounts.pending === 1 ? 's' : ''} a reply`
                            : 'All clients have been addressed'}
                    </p>
                </div>
                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cl-purple/20 focus:border-indigo-400 transition-all"
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                        {tabCounts[tab.id] > 0 && (
                            <span className={`text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 ${
                                activeTab === tab.id
                                    ? tab.id === 'pending' ? 'bg-red-500 text-white' : 'bg-cl-purple text-white'
                                    : 'bg-gray-300 text-gray-600'
                            }`}>
                                {tabCounts[tab.id]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Conversation List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {displayList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-8">
                        {activeTab === 'pending' ? (
                            <>
                                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                                    <ShieldCheck size={28} className="text-green-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700">All caught up</p>
                                    <p className="text-sm text-gray-400 mt-1">No clients are currently waiting for a reply.</p>
                                </div>
                            </>
                        ) : activeTab === 'ai' ? (
                            <>
                                <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center">
                                    <BotMessageSquare size={28} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700">No active AI conversations</p>
                                    <p className="text-sm text-gray-400 mt-1">The AI assistant is not currently handling any chats.</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
                                    <Inbox size={28} className="text-gray-300" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700">No conversations found</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {searchTerm ? `No results for "${searchTerm}"` : 'Nothing here yet.'}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {displayList.map((conv, index) => {
                            const badge = getStatusBadge(conv.status);
                            const initials = getInitials(conv.customerName);
                            const isUrgent = conv.status === 'pending_admin_response' || conv.status === 'open';

                            return (
                                <motion.div
                                    key={conv.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className={`group flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60 transition-colors ${isUrgent && conv.unreadCount > 0 ? 'bg-red-50/30' : ''}`}
                                >
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${
                                            isUrgent ? 'bg-red-100 text-red-600' :
                                            conv.status === 'ai_handling' ? 'bg-purple-100 text-purple-600' :
                                            'bg-gray-100 text-gray-500'
                                        }`}>
                                            {initials}
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className={`text-sm font-semibold leading-none ${conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {conv.customerName || 'Anonymous'}
                                            </p>
                                            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.classes}`}>
                                                {badge.label}
                                            </span>
                                            {conv.status === 'ai_handling' && (
                                                <Sparkles size={11} className="text-purple-400 shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-400 leading-none mb-1.5">{conv.customerEmail}</p>
                                        {conv.lastMessage ? (
                                            <p className={`text-xs truncate max-w-[480px] ${conv.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                                                {conv.lastMessage.slice(0, 80)}{conv.lastMessage.length > 80 ? '…' : ''}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-300 italic">No messages yet</p>
                                        )}
                                    </div>

                                    {/* Right: time + actions */}
                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                            <Clock size={11} />
                                            {formatTimeAgo(conv.lastMessageAt || conv.updatedAt)}
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/admin/chat/${conv.id}`}>
                                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-cl-purple text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                                                    Open <ArrowRight size={12} />
                                                </button>
                                            </Link>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                                                        <MessageSquare size={12} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-gray-100 p-1.5">
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteConversation(conv.id)}
                                                        className="rounded-lg px-3 py-2 text-sm font-medium gap-2.5 text-red-600 hover:bg-red-50 cursor-pointer"
                                                    >
                                                        <Trash2 size={14} /> Delete conversation
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default AdminChatPage;

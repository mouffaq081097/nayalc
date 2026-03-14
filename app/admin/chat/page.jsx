'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAppContext } from '../../context/AppContext';
import Link from 'next/link';
import { Loader2, MessageSquare, MoreHorizontal, Trash2, Zap, Clock, User, ArrowRight, MessageCircle, ShieldCheck, Search } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

const AdminChatPage = () => {
    const { fetchWithAuth } = useAppContext();
    const [conversations, setConversations] = useState([]);
    const [liveConversations, setLiveConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const socketRef = useRef(null);

    // Socket.io initialization and event listeners
    useEffect(() => {
        const initSocket = async () => {
            await fetch('/api/socket');
            const newSocket = io('/', { path: '/api/socket_io' });
            socketRef.current = newSocket;

            newSocket.on('connect', () => {
                newSocket.emit('join_room', 'admin');
            });

            newSocket.on('receive_message', (message) => {
                setConversations(prev => {
                    const existingConvIndex = prev.findIndex(conv => conv.id === message.conversationId);
                    if (existingConvIndex > -1) {
                        const updatedConv = {
                            ...prev[existingConvIndex],
                            updatedAt: new Date().toISOString(),
                            status: message.senderType === 'customer' ? 'pending_admin_response' : prev[existingConvIndex].status,
                        };
                        const newConvs = [...prev];
                        newConvs[existingConvIndex] = updatedConv;
                        return newConvs;
                    }
                    return prev;
                });
                
                setLiveConversations(prev => {
                    const updatedPrev = prev.map(conv =>
                        conv.id === message.conversationId
                            ? { ...conv, updatedAt: new Date().toISOString(), status: message.senderType === 'customer' ? 'pending_admin_response' : conv.status }
                            : conv
                    );
                    return updatedPrev.filter(conv => conv.status === 'open' || conv.status === 'pending_admin_response');
                });
            });

            newSocket.on('conversation_status_updated', (updatedConversation) => {
                setConversations(prev => {
                    const existingConvIndex = prev.findIndex(conv => conv.id === updatedConversation.id);
                    if (existingConvIndex > -1) {
                        const newConvs = [...prev];
                        newConvs[existingConvIndex] = updatedConversation;
                        return newConvs;
                    }
                    return prev;
                });
                setLiveConversations(prev => {
                    const updatedPrev = prev.map(conv => conv.id === updatedConversation.id ? updatedConversation : conv);
                    return updatedPrev.filter(conv => conv.status === 'open' || conv.status === 'pending_admin_response');
                });
            });
        };

        if (isLoading === false) {
            initSocket();
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isLoading]);

    const fetchAllConversations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetchWithAuth('/api/chat-global/conversations');
            if (!response.ok) {
                throw new Error('Failed to fetch conversations');
            }
            const data = await response.json();
            setConversations(data);
            const live = data.filter(conv => 
                conv.status === 'open' || conv.status === 'pending_admin_response'
            );
            setLiveConversations(live);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [fetchWithAuth]);

    useEffect(() => {
        fetchAllConversations();
    }, [fetchAllConversations]);

    const handleDeleteConversation = async (conversationId) => {
        if (!conversationId) return;

        if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
            try {
                const res = await fetchWithAuth(`/api/chat/conversation/${conversationId}`, {
                    method: 'DELETE',
                });
                if (res.ok) {
                    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
                    setLiveConversations(prev => prev.filter(conv => conv.id !== conversationId));
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'open': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'pending_admin_response': return 'bg-red-50 text-red-600 border-red-100 animate-pulse';
            case 'pending_customer_response': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'closed': return 'bg-gray-50 text-gray-400 border-gray-100';
            default: return 'bg-gray-50 text-gray-400 border-gray-100';
        }
    };

    const filteredConversations = conversations.filter(conv => 
        (conv.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conv.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Activating Concierge Network...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Concierge Network</h2>
                    <p className="text-sm text-gray-400 mt-1">Managing real-time interactions with Naya Lumière clientele</p>
                </div>
                
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by client identity..."
                        className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Live Attention Section */}
            <section className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 mb-6 flex items-center gap-3">
                    <span className="w-10 h-px bg-red-500/20"></span>
                    <Zap size={12} className="animate-pulse" />
                    Priority Attention Required ({liveConversations.length})
                </h3>
                
                {liveConversations.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] border border-dashed border-gray-100 p-12 flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-200">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Protocol Nominal</p>
                            <p className="text-xs text-gray-300 italic mt-1">No clients currently awaiting concierge intervention.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {liveConversations.map(conv => (
                                <motion.div 
                                    key={conv.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="group relative bg-white rounded-[2rem] border border-red-100 shadow-xl shadow-red-500/5 overflow-hidden flex flex-col hover:border-red-200 transition-all duration-500"
                                >
                                    <div className="p-8 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
                                                <User size={28} strokeWidth={1.5} />
                                            </div>
                                            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${getStatusStyles(conv.status)}`}>
                                                Priority
                                            </span>
                                        </div>
                                        
                                        <div>
                                            <h4 className="text-xl font-bold text-gray-900 tracking-tight">{conv.customerName || 'Anonymous Client'}</h4>
                                            <p className="text-xs text-gray-400 font-medium truncate">{conv.customerEmail}</p>
                                        </div>

                                        <div className="flex items-center gap-4 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} />
                                                Last Active: {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Link href={`/admin/chat/${conv.id}`} className="mt-auto">
                                        <button className="w-full py-5 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 transition-all flex items-center justify-center gap-3">
                                            Enter Consultation
                                            <ArrowRight size={14} />
                                        </button>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </section>

            {/* Archive Section */}
            <section className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 flex items-center gap-3">
                    <span className="w-10 h-px bg-gray-100"></span>
                    Conversation Archives
                </h3>
                
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                    {filteredConversations.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center gap-4">
                            <MessageSquare size={40} className="text-gray-100" />
                            <p className="text-lg font-medium text-gray-400 italic">No historical dossiers found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-50">
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Dossier</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol State</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Transmission</th>
                                        <th className="px-8 py-5"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredConversations.map((conv) => (
                                        <tr key={conv.id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-white group-hover:shadow-md transition-all">
                                                        <MessageCircle size={24} strokeWidth={1.5} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{conv.customerName || 'N/A'}</p>
                                                        <p className="text-[11px] text-gray-400 font-medium italic truncate max-w-[200px]">{conv.customerEmail}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${getStatusStyles(conv.status)}`}>
                                                    {conv.status?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {new Date(conv.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">
                                                        {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <Link href={`/admin/chat/${conv.id}`}>
                                                        <button className="px-5 py-2.5 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all">
                                                            Enter
                                                        </button>
                                                    </Link>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-300 hover:text-gray-900 transition-all">
                                                                <MoreHorizontal size={18} />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border-gray-100 p-2">
                                                            <DropdownMenuItem onClick={() => handleDeleteConversation(conv.id)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3 text-red-600">
                                                                <Trash2 size={16} /> Delete Dossier
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default AdminChatPage;
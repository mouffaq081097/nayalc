'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { useAuth } from '@/app/context/AuthContext';
import { useAppContext } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Send, ArrowLeft, MessageSquare, Loader2, Trash2, User, Clock, ShieldCheck, Zap, Mail, MessageCircle, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

let socket;

const AdminConversationPage = () => {
    const { conversationId } = useParams();
    const { user } = useAuth();
    const { fetchWithAuth } = useAppContext();
    const router = useRouter();

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const messagesEndRef = useRef(null);

    const displayLimit = 20;
    const [offset, setOffset] = useState(0);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const scrollToBottom = (behavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const handleDeleteConversation = async () => {
        if (!conversationId) return;
        if (window.confirm('Are you sure you want to delete this historical dossier? This action is irreversible.')) {
            try {
                const res = await fetchWithAuth(`/api/chat/conversation/${conversationId}`, {
                    method: 'DELETE',
                });
                if (res.ok) router.push('/admin/chat');
            } catch (err) {
                console.error(err);
            }
        }
    };

    const socketInitializer = useCallback(async () => {
        await fetch('/api/socket');
        socket = io('/', { path: '/api/socket_io' });

        socket.on('connect', () => {
            if (conversationId) socket.emit('join_room', `conversation-${conversationId}`);
        });

        socket.on('receive_message', (message) => {
            setMessages((prevMessages) => {
                if (prevMessages.some(msg => msg.id === message.id)) return prevMessages;
                return [...prevMessages, message];
            });
            scrollToBottom();
        });
    }, [conversationId]);

    const fetchConversationDetails = useCallback(async () => {
        try {
            const res = await fetchWithAuth(`/api/chat/conversation/${conversationId}`);
            if (!res.ok) throw new Error('Failed to fetch conversation');
            const data = await res.json();
            setConversation(data);
            setNewStatus(data.status);
        } catch (err) {
            setError(err.message);
        }
    }, [conversationId, fetchWithAuth]);

    const fetchMessages = useCallback(async (isLoadMore = false) => {
        if (!conversationId) return;
        if (isLoadMore) setIsLoadingMore(true);
        else setIsLoading(true);

        try {
            const res = await fetchWithAuth(`/api/chat/conversation/${conversationId}/messages?limit=${displayLimit}&offset=${isLoadMore ? offset : 0}`);
            if (!res.ok) throw new Error('Failed to fetch messages');
            const data = await res.json();

            setMessages((prevMessages) => {
                const uniqueNewMessages = data.messages.filter(
                    (newMessage) => !prevMessages.some((existingMessage) => existingMessage.id === newMessage.id)
                );
                return isLoadMore ? [...uniqueNewMessages, ...prevMessages] : data.messages.reverse();
            });

            setHasMoreMessages(data.totalMessages > (offset + data.messages.length));
            setOffset(prevOffset => prevOffset + data.messages.length);

            if (!isLoadMore) {
                setInitialLoadComplete(true);
                setTimeout(() => scrollToBottom("auto"), 100);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [conversationId, offset, fetchWithAuth]);

    useEffect(() => {
        if (conversationId && user?.id) {
            socketInitializer();
            fetchConversationDetails();
            fetchMessages();
        }
        return () => { if (socket) socket.disconnect(); };
    }, [conversationId, user?.id]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user?.id || !conversationId) return;
        setIsSending(true);
        const messagePayload = { senderId: user.id, sender_type: 'admin', content: newMessage };

        try {
            const res = await fetchWithAuth(`/api/chat/conversation/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messagePayload),
            });
            if (res.ok) {
                const newMessageData = await res.json();
                setMessages((prevMessages) => {
                    if (prevMessages.some(msg => msg.id === newMessageData.id)) return prevMessages;
                    return [...prevMessages, newMessageData];
                });
                setNewMessage('');
                scrollToBottom();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!newStatus || !conversationId) return;
        try {
            const res = await fetchWithAuth(`/api/chat/conversation/${conversationId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                const updatedConv = await res.json();
                setConversation(updatedConv.conversation);
            }
        } catch (err) {
            console.error(err);
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

    if (isLoading && !initialLoadComplete) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Opening Secure Portal...</p>
            </div>
        );
    }

    if (!conversation) return null;

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <Link href="/admin/chat">
                        <button className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:shadow-lg transition-all">
                            <ArrowLeft size={20} />
                        </button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tighter">Concierge Portal</h1>
                            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${getStatusStyles(conversation.status)}`}>
                                {conversation.status?.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 font-medium italic">Consultation Dossier #{conversation.id}</p>
                    </div>
                </div>
                
                <Button onClick={handleDeleteConversation} variant="outline" className="rounded-xl border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition-all">
                    <Trash2 size={16} className="mr-2" /> Dissolve Dossier
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Chat Interface */}
                <div className="lg:col-span-8 flex flex-col h-[70vh] bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <MessageCircle size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Transmission</p>
                                <p className="text-sm font-bold text-gray-900">Synchronized with {conversation.customerName || 'Client'}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="rounded-full border-green-100 bg-green-50 text-green-600 text-[9px] font-black tracking-widest">SECURE PORTAL</Badge>
                    </div>

                    <div className="flex-grow overflow-y-auto p-8 space-y-6 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]">
                        {hasMoreMessages && (
                            <button 
                                onClick={() => fetchMessages(true)} 
                                disabled={isLoadingMore}
                                className="w-full py-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                            >
                                {isLoadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronUp size={14} />}
                                Load Historical Transmissions
                            </button>
                        )}

                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div 
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] space-y-2 ${msg.senderType === 'admin' ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-6 py-4 rounded-[2rem] text-sm font-medium shadow-sm transition-all duration-500 ${
                                            msg.senderType === 'admin' 
                                            ? 'bg-indigo-600 text-white rounded-br-none' 
                                            : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'
                                        }`}>
                                            {msg.messageText}
                                        </div>
                                        <div className={`flex items-center gap-2 px-2 ${msg.senderType === 'admin' ? 'flex-row-reverse' : ''}`}>
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                                                {msg.senderType === 'admin' ? 'You' : conversation.customerName || 'Client'}
                                            </p>
                                            <span className="w-1 h-1 rounded-full bg-gray-100"></span>
                                            <p className="text-[9px] font-medium text-gray-300 italic">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-6 border-t border-gray-50 bg-white">
                        <div className="relative flex items-end gap-4">
                            <Textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Compose response..."
                                className="flex-1 min-h-[60px] max-h-[200px] bg-gray-50/50 border-gray-100 rounded-3xl px-6 py-4 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium resize-none no-scrollbar"
                                disabled={isSending}
                            />
                            <button 
                                onClick={handleSendMessage} 
                                disabled={isSending || !newMessage.trim()} 
                                className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200 hover:bg-gray-900 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                            >
                                {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="lg:col-span-4 space-y-10">
                    <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8 border-b border-gray-50 pb-4 flex justify-between items-center">
                            Client Identity
                            <User size={14} className="text-gray-300" />
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                    <User size={28} strokeWidth={1.5} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-bold text-gray-900 leading-none">{conversation.customerName || 'Verified Client'}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Portal Active</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-3">
                                    <Mail size={14} className="text-gray-300" />
                                    <p className="text-xs font-medium text-gray-500 italic truncate">{conversation.customerEmail}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock size={14} className="text-gray-300" />
                                    <p className="text-xs font-medium text-gray-500 italic">Initiated {new Date(conversation.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8 border-b border-gray-50 pb-4 flex justify-between items-center">
                            Protocol Control
                            <ShieldCheck size={14} />
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transmission State</Label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger className="w-full h-12 rounded-xl bg-gray-50 border-gray-100 font-bold">
                                        <SelectValue placeholder="Transition Protocol" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-2xl border-gray-100">
                                        <SelectItem value="open">Active Portal</SelectItem>
                                        <SelectItem value="pending_admin_response">Requires Concierge</SelectItem>
                                        <SelectItem value="pending_customer_response">Awaiting Client</SelectItem>
                                        <SelectItem value="closed">Archive Dossier</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleUpdateStatus} className="w-full py-6 bg-gray-900 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                Update Protocol State
                            </Button>
                        </div>
                    </section>

                    <div className="p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/30">
                        <div className="flex items-center gap-3 mb-4 text-indigo-600">
                            <Zap size={18} />
                            <span className="text-[11px] font-black uppercase tracking-widest">Concierge Efficiency</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium italic leading-relaxed">
                            Maintain Naya Lumière standards by responding within 15 minutes of client transmission.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminConversationPage;
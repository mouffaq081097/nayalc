'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { useAuth } from '@/app/context/AuthContext';
import { useAppContext } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Send, ArrowLeft, Loader2, Trash2, User, Clock, ShieldCheck, Zap, Mail, MessageCircle, ChevronUp, Sparkles, FileText, UserCheck, ShoppingBag, Star } from 'lucide-react';
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
    const [isAiDrafting, setIsAiDrafting] = useState(false);
    const [isAiSummarizing, setIsAiSummarizing] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const [customerContext, setCustomerContext] = useState(null);

    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    const displayLimit = 20;
    const [offset, setOffset] = useState(0);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const scrollToBottom = (behavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const handleDeleteConversation = async () => {
        if (!conversationId) return;
        if (window.confirm('Are you sure you want to delete this historical dossier? This action is irreversible.')) {
            try {
                const res = await fetchWithAuth(`/api/chat/conversation/${conversationId}`, { method: 'DELETE' });
                if (res.ok) router.push('/admin/chat');
            } catch (err) {
                console.error(err);
            }
        }
    };

    const socketInitializer = useCallback(async () => {
        await fetch('/api/socket');
        const sock = io('/', { path: '/api/socket_io' });
        socketRef.current = sock;

        sock.on('connect', () => {
            if (conversationId) sock.emit('join_room', `conversation-${conversationId}`);
        });

        sock.on('receive_message', (message) => {
            setMessages((prev) => {
                if (prev.some(msg => msg.id === message.id)) return prev;
                return [...prev, message];
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

            // Fetch customer context (loyalty + last order)
            if (data.userId || data.user_id) {
                const userId = data.userId || data.user_id;
                try {
                    const ctxRes = await fetchWithAuth(`/api/users/${userId}/context`);
                    if (ctxRes.ok) {
                        const ctx = await ctxRes.json();
                        setCustomerContext(ctx);
                    }
                } catch (_) {}
            }
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
                const uniqueNew = data.messages.filter(
                    m => !prevMessages.some(e => e.id === m.id)
                );
                return isLoadMore ? [...uniqueNew, ...prevMessages] : data.messages.reverse();
            });

            setHasMoreMessages(data.totalMessages > (offset + data.messages.length));
            setOffset(prev => prev + data.messages.length);

            if (!isLoadMore) {
                setInitialLoadComplete(true);
                setTimeout(() => scrollToBottom('auto'), 100);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [conversationId, offset, fetchWithAuth]);

    // Mark messages as read when admin opens conversation
    const markAsRead = useCallback(async () => {
        if (!conversationId) return;
        try {
            await fetchWithAuth(`/api/chat/conversation/${conversationId}/messages/read`, { method: 'PUT' });
        } catch (_) {}
    }, [conversationId, fetchWithAuth]);

    useEffect(() => {
        if (conversationId && user?.id) {
            socketInitializer();
            fetchConversationDetails();
            fetchMessages();
            markAsRead();
        }
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [conversationId, user?.id]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user?.id || !conversationId) return;
        setIsSending(true);
        try {
            const res = await fetchWithAuth(`/api/chat/conversation/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderId: user.id, sender_type: 'admin', content: newMessage }),
            });
            if (res.ok) {
                const newMsg = await res.json();
                setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
                setNewMessage('');
                scrollToBottom();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    const handleAiDraft = async () => {
        setIsAiDrafting(true);
        try {
            const res = await fetchWithAuth(`/api/chat/conversation/${conversationId}/ai-draft`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                const { draft } = await res.json();
                setNewMessage(draft);
            }
        } catch (err) {
            console.error('AI draft error:', err);
        } finally {
            setIsAiDrafting(false);
        }
    };

    const handleAiSummary = async () => {
        setIsAiSummarizing(true);
        try {
            const res = await fetchWithAuth(`/api/chat/conversation/${conversationId}/ai-summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                const { summary } = await res.json();
                setAiSummary(summary);
            }
        } catch (err) {
            console.error('AI summary error:', err);
        } finally {
            setIsAiSummarizing(false);
        }
    };

    const handleTakeOver = async () => {
        try {
            const res = await fetchWithAuth(`/api/chat/conversation/${conversationId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'open' }),
            });
            if (res.ok) {
                setConversation(prev => ({ ...prev, status: 'open' }));
                setNewStatus('open');
            }
        } catch (err) {
            console.error('Take over error:', err);
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
            case 'ai_handling': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'pending_admin_response': return 'bg-red-50 text-red-600 border-red-100 animate-pulse';
            case 'pending_customer_response': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'closed': return 'bg-gray-50 text-gray-400 border-gray-100';
            default: return 'bg-gray-50 text-gray-400 border-gray-100';
        }
    };

    const getTierColor = (tier) => {
        switch (tier?.toLowerCase()) {
            case 'gold': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'silver': return 'text-gray-500 bg-gray-50 border-gray-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    if (isLoading && !initialLoadComplete) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-cl-purple border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-400">Opening Secure Portal...</p>
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
                        <button className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-cl-purple hover:shadow-lg transition-all">
                            <ArrowLeft size={20} />
                        </button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-black text-gray-900 ">Concierge Portal</h1>
                            <span className={`px-3 py-1 text-[9px] font-black rounded-full border ${getStatusStyles(conversation.status)}`}>
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
                            <div className="w-10 h-10 rounded-xl bg-cl-purple flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <MessageCircle size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400">Active Transmission</p>
                                <p className="text-sm font-bold text-gray-900">Synchronized with {conversation.customerName || 'Client'}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="rounded-full border-green-100 bg-green-50 text-green-600 text-[9px] font-black">SECURE PORTAL</Badge>
                    </div>

                    <div className="flex-grow overflow-y-auto p-8 space-y-6 no-scrollbar bg-gray-50/30">
                        {hasMoreMessages && (
                            <button
                                onClick={() => fetchMessages(true)}
                                disabled={isLoadingMore}
                                className="w-full py-4 text-[9px] font-black text-gray-300 hover:text-cl-purple transition-all flex items-center justify-center gap-2"
                            >
                                {isLoadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronUp size={14} />}
                                Load Historical Transmissions
                            </button>
                        )}

                        <AnimatePresence initial={false}>
                            {messages.map((msg) => {
                                const isAdmin = msg.senderType === 'admin';
                                const isAi = msg.senderType === 'ai';
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] space-y-2 flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                            {isAi && (
                                                <span className="text-[9px] font-black text-purple-500 flex items-center gap-1 px-1">
                                                    <Sparkles size={9} /> Naya AI
                                                </span>
                                            )}
                                            <div className={`px-6 py-4 rounded-[2rem] text-sm font-medium shadow-sm ${
                                                isAdmin
                                                    ? 'bg-cl-purple text-white rounded-br-none'
                                                    : isAi
                                                        ? 'bg-purple-50 border-l-4 border-purple-400 text-gray-700 rounded-bl-none italic'
                                                        : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'
                                            }`}>
                                                {msg.messageText || msg.message_text}
                                            </div>
                                            <div className={`flex items-center gap-2 px-2 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                                                <p className="text-[9px] font-black text-gray-300  ">
                                                    {isAdmin ? 'You' : isAi ? 'AI Specialist' : conversation.customerName || 'Client'}
                                                </p>
                                                <span className="w-1 h-1 rounded-full bg-gray-100" />
                                                <p className="text-[9px] font-medium text-gray-300 italic">
                                                    {new Date(msg.createdAt || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-6 border-t border-gray-50 bg-white space-y-3">
                        {/* AI Summary Card */}
                        <AnimatePresence>
                            {aiSummary && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line overflow-hidden"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] font-black   text-purple-500 flex items-center gap-1.5">
                                            <Sparkles size={10} /> AI Summary
                                        </span>
                                        <button onClick={() => setAiSummary('')} className="text-gray-300 hover:text-gray-500 text-xs">✕</button>
                                    </div>
                                    {aiSummary}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* AI Co-Pilot buttons */}
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={handleAiDraft}
                                disabled={isAiDrafting}
                                className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-100 text-purple-600 rounded-xl text-[10px] font-black   hover:bg-purple-100 transition-all disabled:opacity-50"
                            >
                                {isAiDrafting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                AI Draft Reply
                            </button>
                            <button
                                onClick={handleAiSummary}
                                disabled={isAiSummarizing}
                                className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-100 text-gray-500 rounded-xl text-[10px] font-black   hover:bg-gray-100 transition-all disabled:opacity-50"
                            >
                                {isAiSummarizing ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                                Summarize
                            </button>
                            {conversation.status === 'ai_handling' && (
                                <button
                                    onClick={handleTakeOver}
                                    className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-cl-bg-lavender border border-indigo-100 text-cl-purple rounded-xl text-[10px] font-black   hover:bg-cl-purple-light transition-all"
                                >
                                    <UserCheck size={12} /> Take Over Chat
                                </button>
                            )}
                        </div>

                        <div className="flex items-end gap-4">
                            <Textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Compose response..."
                                className="flex-1 min-h-[60px] max-h-[200px] bg-gray-50/50 border-gray-100 rounded-3xl px-6 py-4 focus:bg-white focus:ring-4 focus:ring-cl-purple/5 transition-all text-sm font-medium resize-none no-scrollbar"
                                disabled={isSending}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isSending || !newMessage.trim()}
                                className="w-14 h-14 rounded-2xl bg-cl-purple flex items-center justify-center text-white shadow-xl shadow-indigo-200 hover:bg-gray-900 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                            >
                                {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Client Identity */}
                    <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-[10px] font-black  tracking-[0.3em] text-gray-900 mb-6 border-b border-gray-50 pb-4 flex justify-between items-center">
                            Client Identity
                            <User size={14} className="text-gray-300" />
                        </h3>
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-cl-bg-lavender flex items-center justify-center text-cl-purple shadow-inner shrink-0">
                                    <User size={24} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-gray-900 leading-tight">{conversation.customerName || 'Verified Client'}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        <p className="text-[9px] font-black text-gray-400  ">Active</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-3">
                                    <Mail size={13} className="text-gray-300 shrink-0" />
                                    <p className="text-xs font-medium text-gray-500 truncate">{conversation.customerEmail}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock size={13} className="text-gray-300 shrink-0" />
                                    <p className="text-xs font-medium text-gray-500">Initiated {new Date(conversation.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Customer Context: Loyalty + Last Order */}
                            {customerContext && (
                                <div className="pt-4 border-t border-gray-50 space-y-3">
                                    {customerContext.loyaltyTier && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-gray-400   flex items-center gap-1.5">
                                                <Star size={10} /> Loyalty
                                            </span>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getTierColor(customerContext.loyaltyTier)}`}>
                                                {customerContext.loyaltyTier} · {customerContext.loyaltyPoints || 0} pts
                                            </span>
                                        </div>
                                    )}
                                    {customerContext.lastOrder && (
                                        <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                                            <p className="text-[10px] font-black text-gray-400   flex items-center gap-1.5">
                                                <ShoppingBag size={10} /> Last Order
                                            </p>
                                            <p className="text-xs font-semibold text-gray-700">#{customerContext.lastOrder.id} · AED {parseFloat(customerContext.lastOrder.totalAmount || 0).toFixed(2)}</p>
                                            <p className="text-[10px] text-gray-400">{customerContext.lastOrder.status} · {new Date(customerContext.lastOrder.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Protocol Control */}
                    <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-[10px] font-black  tracking-[0.3em] text-gray-900 mb-6 border-b border-gray-50 pb-4 flex justify-between items-center">
                            Protocol Control
                            <ShieldCheck size={14} />
                        </h3>
                        <div className="space-y-5">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-gray-400  ">Transmission State</Label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger className="w-full h-12 rounded-xl bg-gray-50 border-gray-100 font-bold">
                                        <SelectValue placeholder="Transition Protocol" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-2xl border-gray-100">
                                        <SelectItem value="open">Active Portal</SelectItem>
                                        <SelectItem value="ai_handling">AI Handling</SelectItem>
                                        <SelectItem value="pending_admin_response">Requires Concierge</SelectItem>
                                        <SelectItem value="pending_customer_response">Awaiting Client</SelectItem>
                                        <SelectItem value="closed">Archive Dossier</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleUpdateStatus} className="w-full py-6 bg-gray-900 hover:bg-cl-purple text-white rounded-xl text-[10px] font-black   transition-all">
                                Update Protocol State
                            </Button>
                        </div>
                    </section>

                    <div className="p-6 bg-cl-bg-lavender/50 rounded-[2rem] border border-indigo-100/30">
                        <div className="flex items-center gap-3 mb-3 text-cl-purple">
                            <Zap size={16} />
                            <span className="text-[11px] font-black  ">Concierge Efficiency</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium italic leading-relaxed">
                            Maintain Naya Lumière standards by responding within 15 minutes of client transmission.
                        </p>
                    </div>
                </div>
            </div>
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default AdminConversationPage;

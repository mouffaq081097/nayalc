'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/app/context/AuthContext';
import { useAppContext } from '@/app/context/AppContext';
import { Send, MessageSquare, X, Loader2, Sparkles, ShoppingBag, Zap, HelpCircle, UserCheck, Clock, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const QUICK_ACTIONS = [
    { id: 'ritual', label: 'Skincare Ritual', icon: <Sparkles className="w-3 h-3" />, prompt: "I'd like a personalized skincare ritual for my skin type." },
    { id: 'order', label: 'Order Status', icon: <ShoppingBag className="w-3 h-3" />, prompt: "Can you help me check the status of my latest order?" },
    { id: 'advice', label: 'Skin Advice', icon: <Zap className="w-3 h-3" />, prompt: "I need a recommendation for my specific skin concerns." },
    { id: 'help', label: 'General Help', icon: <HelpCircle className="w-3 h-3" />, prompt: "I have a question about Naya Lumière services." },
];

function formatGroupTimestamp(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (diffDays === 0) return `Today ${time}`;
    if (diffDays === 1) return `Yesterday ${time}`;
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${time}`;
}

const ChatWidget = () => {
    const { user } = useAuth();
    const { fetchWithAuth, isChatOpen, setIsChatOpen } = useAppContext();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversationId, setConversationId] = useState(null);
    const [conversationStatus, setConversationStatus] = useState('open');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isRequestingHuman, setIsRequestingHuman] = useState(false);
    const [adminIsTyping, setAdminIsTyping] = useState(false);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);

    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const adminTypingTimeoutRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const createOrFetchConversation = useCallback(async () => {
        if (!user?.id) return null;
        try {
            const response = await fetchWithAuth('/api/chat-global/conversations', {
                method: 'POST',
                body: JSON.stringify({ user_id: user.id }),
            });
            if (!response.ok) throw new Error('Failed');
            const data = await response.json();
            const newConvId = data.conversationId || data.conversation?.id;
            setConversationId(newConvId);
            if (data.status) setConversationStatus(data.status);
            return newConvId;
        } catch (error) {
            console.error('Failed to fetch or create conversation:', error);
            return null;
        }
    }, [user?.id, fetchWithAuth]);

    useEffect(() => {
        if (user?.id) createOrFetchConversation();
    }, [user?.id, createOrFetchConversation]);

    // Socket setup
    useEffect(() => {
        if (!user?.id) return;

        const initSocket = async () => {
            await fetch('/api/socket');
            const newSocket = io('/', { path: '/api/socket_io' });
            socketRef.current = newSocket;

            newSocket.on('connect', () => setIsConnected(true));

            newSocket.on('receive_message', (message) => {
                const transformed = {
                    ...message,
                    messageText: message.message_text || message.messageText,
                    senderType: message.sender_type || message.senderType,
                    createdAt: message.created_at || message.createdAt || new Date().toISOString(),
                    status: 'sent',
                };
                setMessages((prev) => {
                    // Replace matching temp message by content+senderType to avoid duplicates
                    const tempIndex = prev.findIndex(
                        m => m.id?.startsWith('temp-') &&
                            m.messageText === transformed.messageText &&
                            m.senderType === transformed.senderType
                    );
                    if (tempIndex !== -1) {
                        const next = [...prev];
                        next[tempIndex] = transformed;
                        return next;
                    }
                    if (prev.some(m => m.id === transformed.id)) return prev;
                    return [...prev, transformed];
                });

                if (transformed.senderType !== 'customer' && !isChatOpen) {
                    setUnreadMessageCount(prev => prev + 1);
                }
            });

            newSocket.on('conversation_status_updated', (data) => {
                if (data.status) setConversationStatus(data.status);
            });

            newSocket.on('admin_typing', ({ isTyping }) => {
                setAdminIsTyping(isTyping);
                if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);
                if (isTyping) {
                    adminTypingTimeoutRef.current = setTimeout(() => setAdminIsTyping(false), 3500);
                }
            });

            newSocket.on('disconnect', () => setIsConnected(false));
        };

        initSocket();

        return () => {
            if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
            if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [user?.id, isChatOpen]);

    // Clear unread on open
    useEffect(() => {
        if (user?.id && isChatOpen) setUnreadMessageCount(0);
    }, [user?.id, isChatOpen]);

    // Fetch messages
    useEffect(() => {
        if (!conversationId || !user?.id) return;
        const fetchMessages = async () => {
            setIsLoading(true);
            try {
                const response = await fetchWithAuth(`/api/chat/conversation/${conversationId}/messages?limit=50`);
                if (!response.ok) throw new Error('Failed to fetch messages.');
                const data = await response.json();
                if (!data.messages || data.messages.length === 0) {
                    setMessages([{
                        id: 'welcome-msg',
                        messageText: `Welcome to Naya Lumière, ${user.first_name}! How can our specialists assist you today?`,
                        senderType: 'support',
                        createdAt: new Date().toISOString(),
                    }]);
                } else {
                    setMessages(data.messages.slice().reverse());
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMessages();
    }, [conversationId, user?.id, fetchWithAuth, user?.first_name]);

    // Join room once connected
    useEffect(() => {
        if (socketRef.current && isConnected && user?.id && conversationId) {
            socketRef.current.emit('join_room', `conversation-${conversationId}`);
        }
    }, [isConnected, user?.id, conversationId]);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        if (!conversationId || !socketRef.current) return;
        socketRef.current.emit('typing', { conversationId, isTyping: true, senderType: 'customer' });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current?.emit('typing', { conversationId, isTyping: false, senderType: 'customer' });
        }, 2000);
    };

    const handleSendMessage = async (contentOverride = null) => {
        const textToSend = (contentOverride || newMessage).trim();
        if (!textToSend || !user?.id || isSending) return;

        setIsSending(true);
        let currentConvId = conversationId;

        if (!currentConvId) {
            currentConvId = await createOrFetchConversation();
            if (!currentConvId) { setIsSending(false); return; }
        }

        // Stop typing indicator
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socketRef.current?.emit('typing', { conversationId: currentConvId, isTyping: false, senderType: 'customer' });

        const tempId = 'temp-' + Date.now();
        setMessages((prev) => [...prev, {
            id: tempId,
            messageText: textToSend,
            createdAt: new Date().toISOString(),
            senderType: 'customer',
            status: 'sending',
        }]);
        if (!contentOverride) setNewMessage('');

        try {
            const response = await fetchWithAuth(`/api/chat/conversation/${currentConvId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ senderId: user.id, sender_type: 'customer', content: textToSend }),
            });
            if (!response.ok) throw new Error('Send failed');
            const data = await response.json();
            setMessages((prev) => prev.map(msg => msg.id === tempId ? { ...data, status: 'sent' } : msg));
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages((prev) => prev.map(msg => msg.id === tempId ? { ...msg, status: 'failed' } : msg));
        } finally {
            setIsSending(false);
        }
    };

    const handleRetry = (failedMsg) => {
        setMessages((prev) => prev.filter(m => m.id !== failedMsg.id));
        handleSendMessage(failedMsg.messageText);
    };

    const handleRequestHuman = async () => {
        if (!conversationId || isRequestingHuman) return;
        setIsRequestingHuman(true);
        try {
            const res = await fetchWithAuth(`/api/chat/conversation/${conversationId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'pending_admin_response' }),
            });
            if (res.ok) {
                setConversationStatus('pending_admin_response');
                setMessages(prev => [...prev, {
                    id: 'human-' + Date.now(),
                    messageText: "You've been connected to our concierge team. A specialist will be with you shortly.",
                    senderType: 'support',
                    createdAt: new Date().toISOString(),
                }]);
            }
        } catch (error) {
            console.error('Error requesting human:', error);
        } finally {
            setIsRequestingHuman(false);
        }
    };

    if (!user) return null;

    const isAiHandling = conversationStatus === 'ai_handling';
    const hasCustomerMessages = messages.some(m => m.senderType === 'customer');

    // Build render list with grouped timestamp dividers (5-min gap)
    const renderItems = [];
    let lastTs = null;
    messages.forEach((msg, i) => {
        const msgTime = msg.createdAt ? new Date(msg.createdAt) : null;
        if (msgTime && (!lastTs || (msgTime - lastTs) > 5 * 60 * 1000)) {
            renderItems.push({ type: 'timestamp', time: msg.createdAt, key: `ts-${i}` });
            lastTs = msgTime;
        }
        renderItems.push({ type: 'message', msg, key: msg.id || i });
    });

    return (
        <div className="fixed inset-0 pointer-events-none z-[200]">
            {/* FAB */}
            <AnimatePresence>
                {!isChatOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute hidden md:flex bottom-8 right-8 pointer-events-auto"
                    >
                        <button
                            onClick={() => setIsChatOpen(true)}
                            className="relative w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-xl hover:bg-gray-700 transition-colors"
                        >
                            <MessageSquare className="w-6 h-6" />
                            <AnimatePresence>
                                {unreadMessageCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white"
                                    >
                                        {unreadMessageCount}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat panel */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="fixed inset-0 md:inset-auto md:bottom-8 md:right-8 flex flex-col w-full h-full md:w-[380px] md:h-[580px] bg-white md:rounded-2xl md:shadow-2xl overflow-hidden border border-gray-200 pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                    <div className="w-8 h-8 rounded-full overflow-hidden relative">
                                        <Image src="/favicon.jpeg" alt="Support" fill className="object-cover" />
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 leading-none">Naya Support</p>
                                    <p className="text-xs text-gray-400 mt-0.5 leading-none">
                                        {isAiHandling ? 'AI · Online' : 'Typically replies instantly'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages area */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 space-y-0.5">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                                </div>
                            ) : (
                                <>
                                    {messages.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-center space-y-1.5 py-8">
                                            <p className="text-gray-900 font-semibold text-sm">Hi {user.first_name}!</p>
                                            <p className="text-xs text-gray-500 max-w-[220px] leading-relaxed">
                                                Ask us anything about skincare, orders, or our collection.
                                            </p>
                                        </div>
                                    )}

                                    {renderItems.map((item) => {
                                        if (item.type === 'timestamp') {
                                            return (
                                                <div key={item.key} className="flex justify-center py-3">
                                                    <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                                                        {formatGroupTimestamp(item.time)}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        const { msg } = item;
                                        const isCustomer = msg.senderType === 'customer';
                                        const isAi = msg.senderType === 'ai';
                                        const isFailed = msg.status === 'failed';
                                        const isSendingMsg = msg.status === 'sending';

                                        return (
                                            <div key={item.key} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} mb-1.5`}>
                                                {!isCustomer && (
                                                    <div className="shrink-0 w-6 h-6 rounded-full overflow-hidden mr-2 mt-auto mb-1 relative">
                                                        <Image src="/favicon.jpeg" alt="Naya" fill className="object-cover" />
                                                    </div>
                                                )}
                                                <div className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                                    {isAi && (
                                                        <span className="text-[10px] text-purple-500 font-medium flex items-center gap-1 mb-1 ml-0.5">
                                                            <Sparkles className="w-2.5 h-2.5" /> Naya AI
                                                        </span>
                                                    )}
                                                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                                        isCustomer
                                                            ? isFailed
                                                                ? 'bg-red-50 text-red-700 border border-red-200 rounded-br-sm'
                                                                : 'bg-gray-900 text-white rounded-br-sm'
                                                            : isAi
                                                                ? 'bg-white text-gray-800 border border-purple-100 shadow-sm rounded-bl-sm'
                                                                : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
                                                    }`}>
                                                        {msg.messageText}
                                                    </div>
                                                    {isCustomer && (
                                                        <div className="flex items-center gap-1 mt-1 px-0.5">
                                                            {isSendingMsg && <Clock className="w-3 h-3 text-gray-300" />}
                                                            {msg.status === 'sent' && <Check className="w-3 h-3 text-gray-300" />}
                                                            {isFailed && (
                                                                <button
                                                                    onClick={() => handleRetry(msg)}
                                                                    className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 font-medium transition-colors"
                                                                >
                                                                    <AlertCircle className="w-3 h-3" /> Failed · Tap to retry
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Typing indicator */}
                                    <AnimatePresence>
                                        {adminIsTyping && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 4 }}
                                                className="flex items-end gap-2 mb-1.5"
                                            >
                                                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 relative">
                                                    <Image src="/favicon.jpeg" alt="Naya" fill className="object-cover" />
                                                </div>
                                                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-3.5 py-3 shadow-sm flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input area */}
                        <div className="bg-white border-t border-gray-100 shrink-0">
                            {/* Talk to Human */}
                            <AnimatePresence>
                                {isAiHandling && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pt-3">
                                            <button
                                                onClick={handleRequestHuman}
                                                disabled={isRequestingHuman}
                                                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-60"
                                            >
                                                {isRequestingHuman
                                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                                    : <UserCheck className="w-3 h-3" />
                                                }
                                                Talk to a Human
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Quick actions — hidden after first customer message */}
                            <AnimatePresence>
                                {!hasCustomerMessages && (
                                    <motion.div
                                        initial={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1 no-scrollbar">
                                            {QUICK_ACTIONS.map(action => (
                                                <button
                                                    key={action.id}
                                                    onClick={() => handleSendMessage(action.prompt)}
                                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-100 transition-colors whitespace-nowrap"
                                                >
                                                    {action.icon}
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Textarea + Send */}
                            <div className="flex items-end gap-2 px-4 py-3">
                                <textarea
                                    ref={inputRef}
                                    value={newMessage}
                                    onChange={handleInputChange}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    rows={1}
                                    className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 leading-relaxed overflow-y-auto"
                                    style={{ minHeight: '40px', maxHeight: '120px' }}
                                />
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!newMessage.trim() || isSending}
                                    className="shrink-0 w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mb-0.5"
                                >
                                    {isSending
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Send className="w-4 h-4" />
                                    }
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default ChatWidget;

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/app/context/AuthContext'; // Assuming AuthContext provides user info
import { useAppContext } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Send, MessageSquare, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTimeAgo } from '../lib/utils'; // Import formatTimeAgo
import Image from 'next/image';

let socket; // Global socket instance is replaced by useRef

const ChatWidget = () => {
    const { user, logout } = useAuth(); // Get authenticated user from context
    const { fetchWithAuth, isChatOpen, setIsChatOpen } = useAppContext(); // Get memoized fetchWithAuth from AppContext
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversationId, setConversationId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false); // New state for send button loading

    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null); // Use useRef for socket instance
    const [isConnected, setIsConnected] = useState(false); // Track socket connection status

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const createOrFetchConversation = useCallback(async () => {
        if (!user?.id) {
            return null; // No user, no conversation
        }
        try {
            const response = await fetchWithAuth('/api/chat-global/conversations', {
                method: 'POST',
                body: JSON.stringify({ user_id: user.id }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'No error message available.' }));
                console.error('Failed to fetch or create conversation. Status:', response.status, 'Error Data:', errorData);
                throw new Error('Failed to fetch or create conversation.');
            }

            const data = await response.json();
            const newConvId = data.conversationId || data.conversation?.id;
            setConversationId(newConvId);
            return newConvId;
        } catch (error) {
            console.error('Failed to fetch or create conversation:', error);
            return null;
        }
    }, [user?.id]); // Only depends on user.id

    useEffect(() => {
        if (user?.id) {
            // Proactively try to fetch or create a conversation for the user
            createOrFetchConversation();
        }
    }, [user?.id, createOrFetchConversation]);

    // New useEffect for Socket.io initialization and listener setup
    useEffect(() => {
        if (!user?.id) return; // Only proceed if user is authenticated

        const initSocket = async () => {
            await fetch('/api/socket'); // Ensure Socket.io server is initialized
            const newSocket = io('/', { path: '/api/socket_io' });
            socketRef.current = newSocket; // Store socket instance in ref

            newSocket.on('connect', () => {
                setIsConnected(true);
            });

            newSocket.on('receive_message', (message) => {
                const transformedMessage = {
                    ...message,
                    messageText: message.message_text || message.messageText,
                    senderType: message.sender_type || message.senderType,
                    createdAt: message.created_at || message.createdAt || new Date().toISOString(), // Fallback for createdAt
                };
                setMessages((prevMessages) => {
                    if (prevMessages.some(msg => msg.id === transformedMessage.id)) {
                        return prevMessages;
                    }
                    const newMessages = [...prevMessages, transformedMessage];
                    return newMessages;
                });

                if (transformedMessage.senderType !== 'customer') {
                    setUnreadMessageCount(prevCount => prevCount + 1);
                }
            });

            newSocket.on('disconnect', () => {
                setIsConnected(false);
            });
        };

        initSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user?.id, conversationId]); // Updated dependencies
    // Original useEffect for widget open/close state management
    useEffect(() => {
        if (user?.id && isChatOpen) {
            setUnreadMessageCount(0);
        } else if (user?.id && !isChatOpen) {
        }

        // Cleanup function for this specific useEffect if needed
        return () => {
            // Any cleanup related to isChatOpen or conversation fetching when component unmounts or isChatOpen changes
        };
    }, [user?.id, isChatOpen]); // Dependencies for this useEffect

    useEffect(() => {
        if (conversationId && user?.id) {
            const fetchMessages = async () => {
                setIsLoading(true);
                try {
                    const url = `/api/chat/conversation/${conversationId}/messages`;
                    const response = await fetchWithAuth(url);

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ message: 'No error message available.' }));
                        console.error('Failed to fetch messages. Status:', response.status, 'Error Data:', errorData);
                        throw new Error('Failed to fetch messages.');
                    }
                    
                    const data = await response.json();
                    
                    if (data.messages && data.messages.length === 0) {
                        // This is a new conversation, add a welcome message.
                        const welcomeMessage = {
                            id: 'welcome-msg',
                            messageText: 'Welcome to Nayalc! How can we help you today?',
                            senderType: 'support',
                            createdAt: new Date().toISOString(),
                        };
                        setMessages([welcomeMessage]);
                    } else {
                        setMessages((prevMessages) => {
                            const uniqueNewMessages = data.messages.filter(
                                (newMessage) => !prevMessages.some((existingMessage) => existingMessage.id === newMessage.id)
                            );
                            return [...prevMessages, ...uniqueNewMessages];
                        });
                    }

                } catch (error) {
                    console.error('Error fetching messages:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMessages();
        }
    }, [conversationId, user?.id, fetchWithAuth]); // User ID and fetchWithAuth are dependencies

    // This useEffect handles joining the room when socket is connected and conversationId is available
    useEffect(() => {
        if (socketRef.current && isConnected && user?.id && conversationId) {
            socketRef.current.emit('join_room', `conversation-${conversationId}`);
        }
    }, [socketRef.current, isConnected, user?.id, conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user?.id || isSending) return; // Prevent double-send

        setIsSending(true); // Start sending process

        let currentConversationId = conversationId;

        // If conversationId is not set, create or fetch one first
        if (!currentConversationId) {
            setIsLoading(true); // Indicate loading while creating conversation
            currentConversationId = await createOrFetchConversation();
            setIsLoading(false); // Stop loading regardless of success
            if (!currentConversationId) {
                console.error('Failed to get a conversation ID.');
                setIsSending(false); // Ensure sending state is reset
                return; // Cannot send message without a conversation ID
            }
        }

        const messagePayload = {
            senderId: user.id,
            sender_type: 'customer',
            content: newMessage,
            conversationId: currentConversationId,
        };

        // Optimistic UI Update: Add message to state immediately
        const tempId = Date.now().toString() + Math.random().toString(36).substring(2, 9); // Client-generated temporary ID
        const tempMessage = {
            id: tempId,
            conversation_id: currentConversationId,
            sender_id: user.id,
            messageText: newMessage,
            createdAt: new Date().toISOString(), // Use current time as fallback
            senderType: 'customer',
            status: 'sending' // Custom status for optimistic message
        };

        setMessages((prevMessages) => [...prevMessages, tempMessage]);
        setNewMessage(''); // Clear input immediately
        scrollToBottom();

        try {
            const data = await fetchWithAuth(`/api/chat/conversation/${currentConversationId}/messages`, {
                method: 'POST',
                body: JSON.stringify(messagePayload),
            });

            setMessages((prevMessages) => {
                // Find and update the optimistic message, or add if not found (e.g., if API was very fast)
                const updatedMessages = prevMessages.map(msg =>
                    msg.id === tempId ? { ...data, status: 'sent' } : msg
                );
                // If the message wasn't found (e.g., due to race condition or component unmount), add it
                if (!updatedMessages.some(msg => msg.id === data.id)) {
                    return [...prevMessages, { ...data, status: 'sent' }];
                }
                return updatedMessages;
            });

        } catch (error) {
            console.error('Error sending message:', error);
            // Revert optimistic update on error
            setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== tempId));
            // Optionally show an error message to the user
        } finally {
            setIsSending(false); // End sending process
            scrollToBottom();
        }
    };

    if (!user) return null;

    return (
        <div className={`fixed z-[100] transition-all duration-300 ${
            isChatOpen 
                ? 'inset-0 md:inset-auto md:bottom-24 md:right-4 md:z-50' 
                : 'bottom-24 right-4 md:bottom-4 z-50'
        }`}>
            {!isChatOpen && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative hidden md:block"
                >
                    <Button
                        className="rounded-full w-14 h-14 flex items-center justify-center shadow-lg bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-pink)]"
                        onClick={() => setIsChatOpen(true)}
                    >
                        <MessageSquare className="w-6 h-6" />
                        {unreadMessageCount > 0 && (
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                {unreadMessageCount}
                            </span>
                        )}
                    </Button>
                </motion.div>
            )}

            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: typeof window !== 'undefined' && window.innerWidth < 768 ? 100 : 50, scale: typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: typeof window !== 'undefined' && window.innerWidth < 768 ? 100 : 50, scale: typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 0.8 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white flex flex-col w-full h-full md:w-80 md:h-[500px] md:rounded-2xl md:shadow-2xl overflow-hidden border-t md:border border-gray-100"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <h3 className="font-bold text-gray-900">Customer Support</h3>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setIsChatOpen(false)}
                                className="rounded-full hover:bg-gray-100 h-10 w-10"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        {isLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <p className="text-sm font-medium">Loading conversation...</p>
                            </div>
                        ) : (
                            <div className="flex-1 px-4 py-6 overflow-y-auto space-y-4 bg-[#F8F9FA]/50">
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                            <MessageSquare className="w-8 h-8 text-[var(--brand-blue)]" />
                                        </div>
                                        <p className="text-gray-900 font-bold mb-1">Hello! 👋</p>
                                        <p className="text-sm text-gray-500">Our team is here to help. Send us a message and we'll get back to you as soon as possible.</p>
                                    </div>
                                )}
                                
                                {[...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((msg, index) => {
                                    const isCustomer = msg.senderType === 'customer';
                                    return (
                                        <motion.div
                                            key={msg.id || index}
                                            initial={{ opacity: 0, x: isCustomer ? 20 : -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex items-end gap-2 ${isCustomer ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {!isCustomer && (
                                                <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden border border-gray-100 shadow-sm">
                                                    <Image
                                                        src="/favicon.jpeg"
                                                        alt="Support"
                                                        width={32}
                                                        height={32}
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-1 max-w-[80%]">
                                                <div
                                                    className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                                                        isCustomer
                                                            ? 'bg-black text-white rounded-br-none'
                                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                                    }`}
                                                >
                                                    <p className="leading-relaxed">{msg.messageText}</p>
                                                </div>
                                                <span className={`text-[10px] font-medium text-gray-400 ${isCustomer ? 'text-right' : 'text-left'}`}>
                                                    {formatTimeAgo(msg.createdAt)}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-100 bg-white pb-safe">
                            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-[1.5rem] border border-gray-100 focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                                <Input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Message us..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 focus-visible:ring-0 h-10 px-4"
                                />
                                <Button 
                                    onClick={handleSendMessage} 
                                    size="icon" 
                                    className="bg-black text-white hover:bg-gray-800 rounded-full h-9 w-9 shrink-0 transition-transform active:scale-95" 
                                    disabled={!newMessage.trim() || isSending}
                                >
                                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatWidget;


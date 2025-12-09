'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/app/context/AuthContext'; // Assuming AuthContext provides user info
import { useAppContext } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Send, MessageSquare, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

let socket; // Global socket instance is replaced by useRef

const ChatWidget = () => {
    const { user, logout } = useAuth(); // Get authenticated user from context
    const { fetchWithAuth } = useAppContext(); // Get memoized fetchWithAuth from AppContext
    const [isOpen, setIsOpen] = useState(false);
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
        if (user?.id && isOpen) {
            setUnreadMessageCount(0);
        } else if (user?.id && !isOpen) {
        }

        // Cleanup function for this specific useEffect if needed
        return () => {
            // Any cleanup related to isOpen or conversation fetching when component unmounts or isOpen changes
        };
    }, [user?.id, isOpen]); // Dependencies for this useEffect

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
                    setMessages((prevMessages) => {
                        const uniqueNewMessages = data.messages.filter(
                            (newMessage) => !prevMessages.some((existingMessage) => existingMessage.id === newMessage.id)
                        );
                        return [...prevMessages, ...uniqueNewMessages];
                    });

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
        <div className="fixed bottom-24 right-4 md:bottom-4 z-50">
            {!isOpen && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                >
                    <Button
                        className="rounded-full w-14 h-14 flex items-center justify-center shadow-lg bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-pink)]"
                        onClick={() => setIsOpen(true)}
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

            {isOpen && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-lg shadow-xl flex flex-col w-80 h-96"
                    >
                        <div className="flex justify-between items-center p-3 border-b border-gray-200">
                            <h3 className="font-semibold text-lg">Customer Support</h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-gray-500">Loading messages...</p>
                            </div>
                        ) : (
                            <div className="flex-1 p-3 overflow-y-auto space-y-2">
                                {messages.length === 0 && <p className="text-gray-500 text-sm text-center">No messages yet. Start a conversation!</p>}
                                {messages.map((msg, index) => {
                                    return (
                                        <motion.div
                                            key={msg.id || index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] p-2 rounded-lg ${msg.senderType === 'customer'
                                                    ? 'bg-[var(--brand-blue)] text-white'
                                                    : 'bg-gray-200 text-gray-800'
                                                    }`}
                                            >
                                                <p className="text-sm">{msg.messageText}</p>
                                                <span className="text-xs text-black-400 block text-right mt-1">
                                                    {msg.createdAt && !isNaN(new Date(msg.createdAt)) ? new Date(msg.createdAt).toLocaleTimeString() : 'N/A'}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )
                                })}                            <div ref={messagesEndRef} />
                            </div>
                        )}
                        <div className="p-3 border-t border-gray-200 flex">
                            <Input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Type your message..."
                                className="flex-1 mr-2"
                            />
                            <Button onClick={handleSendMessage} size="icon" className="bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-pink)]" disabled={isSending}>
                                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </Button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default ChatWidget;


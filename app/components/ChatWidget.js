'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/app/context/AuthContext'; // Assuming AuthContext provides user info
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Send, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

let socket; // Global socket instance is replaced by useRef

const ChatWidget = () => {
    const { user } = useAuth(); // Get authenticated user from context
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversationId, setConversationId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null); // Use useRef for socket instance
    const [isConnected, setIsConnected] = useState(false); // Track socket connection status

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const createOrFetchConversation = useCallback(async () => {
        if (!user?.id) return null; // No user, no conversation
        try {
            const response = await fetch('/api/chat-global/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id }),
            });
            const data = await response.json();
            if (response.ok) {
                const newConvId = data.conversationId || data.conversation.id;
                setConversationId(newConvId);
                console.log('createOrFetchConversation: setConversationId to:', newConvId);
                return newConvId;
            } else {
                console.error('Failed to fetch or create conversation:', data.message);
                return null;
            }
        } catch (error) {
            console.error('Error fetching/creating conversation:', error);
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

        console.log('User useEffect: Initializing Socket.io connection...');
        const initSocket = async () => {
            await fetch('/api/socket'); // Ensure Socket.io server is initialized
            const newSocket = io({ path: '/api/socket_io' });
            socketRef.current = newSocket; // Store socket instance in ref
            console.log('Socket.io client initialized:', socketRef.current);

            newSocket.on('connect', () => {
                console.log('User client connected to Socket.io server with ID:', newSocket.id);
                setIsConnected(true);
            });

            newSocket.on('receive_message', (message) => {
                const transformedMessage = {
                    ...message,
                    messageText: message.message_text || message.messageText,
                    senderType: message.sender_type || message.senderType,
                    createdAt: message.created_at || message.createdAt,
                };
                setMessages((prevMessages) => {
                    console.log('receive_message: current prevMessages:', prevMessages);
                    console.log('receive_message: transformedMessage:', transformedMessage);
                    if (prevMessages.some(msg => msg.id === transformedMessage.id)) {
                        console.log('receive_message: Duplicate message ID detected, skipping.');
                        return prevMessages;
                    }
                    const newMessages = [...prevMessages, transformedMessage];
                    console.log('receive_message: newMessages after adding:', newMessages);
                    return newMessages;
                });
                console.log('Received and transformed message:', transformedMessage);
                console.log('Notification check - isOpen:', isOpen, 'senderType:', transformedMessage.senderType, 'Condition:', (!isOpen && transformedMessage.senderType !== 'customer'));

                if (transformedMessage.senderType !== 'customer') {
                    setUnreadMessageCount(prevCount => prevCount + 1);
                }
            });

            newSocket.on('disconnect', () => {
                console.log('User client disconnected from Socket.io server');
                setIsConnected(false);
            });
        };

        initSocket();

        return () => {
            if (socketRef.current) {
                console.log('User useEffect cleanup: Disconnecting socketRef.');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user?.id, conversationId]); // Updated dependencies
    // Original useEffect for widget open/close state management
    useEffect(() => {
        if (user?.id && isOpen) {
            console.log('User useEffect: Widget opened, resetting notification and setting loading.');
            setUnreadMessageCount(0);
            // fetchOrCreateConversation is now handled by a separate useEffect
            // socketInitializer is also handled by a separate useEffect
        } else if (user?.id && !isOpen) {
            console.log('User useEffect: user.id present but widget is closed.');
        }

        // Cleanup function for this specific useEffect if needed
        return () => {
            // Any cleanup related to isOpen or conversation fetching when component unmounts or isOpen changes
        };
    }, [user?.id, isOpen]); // Dependencies for this useEffect

    useEffect(() => {
        console.log('User useEffect for fetching messages triggered.');
        console.log('Dependencies:', { conversationId, userId: user?.id });
        if (conversationId && user?.id) {
            console.log('Conditions met, calling fetchMessages for conversationId:', conversationId);
            const fetchMessages = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(`/api/chat/conversation/${conversationId}/messages`);
                    console.log('fetchMessages: API response.ok:', response.ok);
                    const data = await response.json();
                    console.log('fetchMessages: API response data:', data);
                    if (response.ok) {
                        setMessages((prevMessages) => {
                            console.log('fetchMessages: Previous messages in state:', prevMessages);
                            const uniqueNewMessages = data.messages.filter(
                                (newMessage) => !prevMessages.some((existingMessage) => existingMessage.id === newMessage.id)
                            );
                            console.log('fetchMessages: Unique new messages from data:', uniqueNewMessages);
                            return [...prevMessages, ...uniqueNewMessages];
                        });
                        console.log('fetchMessages: Fetched and updated messages in state.');
                    } else {
                        console.error('Failed to fetch messages:', data.message);
                    }
                } catch (error) {
                    console.error('Error fetching messages:', error);
                } finally {
                    setIsLoading(false);
                    console.log('fetchMessages: isLoading set to false.');
                }
            };
            fetchMessages();
        }
    }, [conversationId, user?.id]); // User ID is a dependency

    // This useEffect handles joining the room when socket is connected and conversationId is available
    useEffect(() => {
        console.log('User useEffect for joining room triggered.');
        console.log('Join room dependencies:', { socketExists: !!socketRef.current, socketConnected: isConnected, userId: user?.id, conversationId });
        if (socketRef.current && isConnected && user?.id && conversationId) {
            console.log('Conditions met, emitting join_room (User side):', `conversation-${conversationId}`);
            socketRef.current.emit('join_room', `conversation-${conversationId}`);
        }
    }, [socketRef.current, isConnected, user?.id, conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user?.id) return;

        let currentConversationId = conversationId;

        // If conversationId is not set, create or fetch one first
        if (!currentConversationId) {
            setIsLoading(true); // Indicate loading while creating conversation
            currentConversationId = await createOrFetchConversation();
            setIsLoading(false); // Stop loading regardless of success
            if (!currentConversationId) {
                console.error('Failed to get a conversation ID.');
                return; // Cannot send message without a conversation ID
            }
        }

        const messagePayload = {
            senderId: user.id,
            sender_type: 'customer',
            content: newMessage,
            conversationId: currentConversationId,
        };

        try {
            const response = await fetch(`/api/chat/conversation/${currentConversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messagePayload),
            });
            const data = await response.json();
            if (response.ok) {
                setMessages((prevMessages) => {
                    // Prevent adding duplicate messages
                    if (prevMessages.some(msg => msg.id === data.id)) {
                        return prevMessages;
                    }
                    return [...prevMessages, data];
                });
                setNewMessage('');
            } else {
                console.error('Failed to send message:', data.message);
            }
        } catch (error) {
            console.error('Error sending message:', error);
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
                                    console.log('Rendering message:', msg);
                                    return (
                                        <motion.div
                                            key={msg.id}
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
                                                    {new Date(msg.createdAt).toLocaleTimeString()}
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
                            <Button onClick={handleSendMessage} size="icon" className="bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-pink)]">
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default ChatWidget;


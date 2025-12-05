'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Send, ArrowLeft, MessageSquare, Loader2, Trash, User, Clock } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/app/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/components/ui/select';

let socket; // Global socket instance

const AdminConversationPage = () => {
    const { conversationId } = useParams();
    const { user } = useAuth(); // Assuming admin user is also available via AuthContext
    const router = useRouter();

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const messagesEndRef = useRef(null);

    // Pagination states
    const displayLimit = 10; // Number of messages to load at once
    const [offset, setOffset] = useState(0);
    const [totalMessages, setTotalMessages] = useState(0);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);


    const scrollToBottom = (behavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const handleDeleteConversation = async () => {
        if (!conversationId) return;

        if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
            try {
                const res = await fetch(`/api/chat/conversation/${conversationId}`, {
                    method: 'DELETE',
                });
                if (res.ok) {
                    alert('Conversation deleted successfully!');
                    router.push('/admin/chat'); // Redirect to conversation list
                } else {
                    const errData = await res.json();
                    alert(`Failed to delete conversation: ${errData.message}`);
                }
            } catch (err) {
                alert(`Error deleting conversation: ${err.message}`);
            }
        }
    };


    const socketInitializer = useCallback(async () => {
        await fetch('/api/socket');
        socket = io({ path: '/api/socket_io' });

        socket.on('connect', () => {
            console.log('Admin connected to Socket.io server');
            if (conversationId) {
                socket.emit('join_room', `conversation-${conversationId}`);
            }
        });

        socket.on('receive_message', (message) => {
            setMessages((prevMessages) => {
                // Prevent adding duplicate messages
                if (prevMessages.some(msg => msg.id === message.id)) {
                    return prevMessages;
                }
                // Append new messages to ensure they appear at the bottom
                const newMsgs = [...prevMessages, message];
                setTotalMessages(prev => prev + 1); // Increment total messages count
                return newMsgs;
            });
            scrollToBottom(); // Scroll to bottom on new message
        });

        socket.on('disconnect', () => {
            console.log('Admin disconnected from Socket.io server');
        });
    }, [conversationId]);

            const fetchConversationDetails = useCallback(async () => {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/chat/conversation/${conversationId}`);
                    if (!res.ok) throw new Error('Failed to fetch conversation');
                    const data = await res.json();
                    setConversation(data);
                    setNewStatus(data.status);
                } catch (err) {
                    setError(err.message);
                } finally {
                    // setIsLoading(false); // Set false after messages are fetched
                }
            }, [conversationId]);
    const fetchMessages = useCallback(async (isLoadMore = false) => {
        if (!conversationId) return;

        if (isLoadMore) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true); // Only for initial full load
        }

        try {
            const res = await fetch(`/api/chat/conversation/${conversationId}/messages?limit=${displayLimit}&offset=${offset}`);
            if (!res.ok) throw new Error('Failed to fetch messages');
            const data = await res.json();
            
            setMessages((prevMessages) => {
                const uniqueNewMessages = data.messages.filter(
                    (newMessage) => !prevMessages.some((existingMessage) => existingMessage.id === newMessage.id)
                );
                // Append new messages because they are fetched in DESC order and we want newest at bottom
                return [...prevMessages, ...uniqueNewMessages];
            });
            setTotalMessages(data.totalMessages);
            setHasMoreMessages(data.totalMessages > (offset + data.messages.length));
            setOffset(prevOffset => prevOffset + data.messages.length); // Update offset for next load

            if (!isLoadMore) {
                setInitialLoadComplete(true); // Mark initial load complete
                scrollToBottom("auto"); // Scroll to bottom instantly on initial load
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [conversationId, displayLimit, offset]);

    useEffect(() => {
        if (conversationId && user?.id) {
            socketInitializer();
            fetchConversationDetails();
            fetchMessages(); // Initial fetch
        }

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [conversationId, user, socketInitializer, fetchConversationDetails, fetchMessages]);

    useEffect(() => {
        // Only scroll to bottom for new messages if initial load is complete
        if (initialLoadComplete) {
            scrollToBottom();
        }
    }, [messages, initialLoadComplete]);

    // Effect to clear notification when admin views the conversation
    useEffect(() => {
        if (conversation && conversation.status === 'pending_admin_response') {
            const clearNotification = async () => {
                try {
                    await fetch(`/api/chat/conversation/${conversationId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ status: 'open' }),
                    });
                    // Optimistically update local state
                    setConversation(prev => ({ ...prev, status: 'open' }));
                    console.log(`Conversation ${conversationId} status updated to 'open' upon admin view.`);
                } catch (error) {
                    console.error('Error clearing admin notification:', error);
                }
            };
            clearNotification();
        }
    }, [conversationId, conversation]); // Rerun when conversation or conversationId changes

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user?.id || !conversationId) return;

        setIsSending(true);
        const messagePayload = {
            senderId: user.id, // Assuming admin user ID
            sender_type: 'admin',
            content: newMessage, // Changed from message_text
        };

        try {
            const res = await fetch(`/api/chat/conversation/${conversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messagePayload),
            });
            if (res.ok) {
                const newMessageData = await res.json(); // Get the returned message data
                setMessages((prevMessages) => {
                    // Prevent adding duplicate messages
                    if (prevMessages.some(msg => msg.id === newMessageData.id)) {
                        return prevMessages;
                    }
                    return [...prevMessages, newMessageData];
                });
                setNewMessage('');
                // Message will also be added via socket event for other clients, but local UI is updated instantly
            } else {
                const errData = await res.json();
                console.error('Failed to send message:', errData.message);
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setIsSending(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!newStatus || !conversationId) return;

        try {
            const res = await fetch(`/api/chat/conversation/${conversationId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                const updatedConv = await res.json();
                setConversation(updatedConv.conversation);
                // Optionally, inform user or refresh conversation list
            } else {
                const errData = await res.json();
                console.error('Failed to update status:', errData.message);
            }
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const getStatusBadgeVariant = (status) => {
        switch (status?.toLowerCase()) {
            case 'open': return 'default';
            case 'pending_admin_response': return 'destructive';
            case 'pending_customer_response': return 'secondary';
            case 'closed': return 'outline';
            default: return 'default';
        }
    };


    if (isLoading && !initialLoadComplete) { // Only show full loading screen on initial load
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-32 w-32 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
    }

    if (!conversation) {
        return <div className="text-center mt-10 text-gray-500">Conversation not found.</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="mb-6 flex items-center justify-between">
                <Link href="/admin/chat">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Conversations
                    </Button>
                </Link>
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Conversation with {conversation.customerName || 'N/A'} (ID: {conversation.id})
                    </h1>
                    <Button variant="destructive" size="icon" onClick={handleDeleteConversation}>
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Conversation Details & Status */}
                <div className="md:col-span-1 bg-white shadow-lg rounded-xl p-6 h-fit space-y-4">
                    <div className="pb-2 border-b border-gray-200 mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Details</h2>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-gray-500" />
                        <p className="text-gray-800 font-medium">Customer: {conversation.customerName} (<span className="text-sm text-gray-600">{conversation.customerEmail}</span>)</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <p className="text-gray-800 font-medium">Started: <span className="text-sm text-gray-600">{new Date(conversation.createdAt).toLocaleString()}</span></p>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-2">Status</h3>
                        <Badge variant={getStatusBadgeVariant(conversation.status)} className="ml-2 py-2 px-3 text-base">
                            {conversation.status}
                        </Badge>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-2">Update Status</h3>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Change status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="pending_admin_response">Pending Admin Response</SelectItem>
                                <SelectItem value="pending_customer_response">Pending Customer Response</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleUpdateStatus} className="mt-3 w-full">Update Status</Button>
                    </div>
                </div>

                {/* Message Area */}
                <div className="md:col-span-2 bg-white shadow-lg rounded-xl flex flex-col flex-1 min-h-[500px]">
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
                        {isLoadingMore && <div className="text-center text-gray-500"><Loader2 className="h-4 w-4 animate-spin inline-block mr-2" /> Loading more messages...</div>}
                        {!isLoadingMore && hasMoreMessages && (
                            <div className="text-center">
                                <Button variant="link" onClick={() => fetchMessages(true)} disabled={isLoadingMore}>
                                    Load More
                                </Button>
                            </div>
                        )}
                        {messages.length === 0 && !isLoading && <div className="text-center text-gray-500 mt-10">
                                <MessageSquare className="h-10 w-10 mx-auto mb-3" />
                                <p>No messages in this conversation yet.</p>
                            </div>
                        }
                        {messages.map((msg, index) => (
                            // Console log removed from here to avoid syntax error, will add it inside the JSX if needed
                            <div
                                key={msg.id}
                                className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                            >
                                {console.log('Rendering message in admin:', msg.id, msg.messageText, msg)} {/* Moved console.log here */}
                                <div
                                    className={`max-w-[75%] p-3 ${
                                        msg.senderType === 'admin'
                                            ? 'bg-indigo-600 text-white rounded-xl rounded-br-none'
                                            : 'bg-gray-100 text-gray-800 rounded-xl rounded-bl-none'
                                    }`}
                                >
                                    <p className="text-sm font-semibold">{msg.senderType === 'admin' ? 'You' : conversation.customerName || 'Customer'}</p>
                                    <p className="text-base">{msg.messageText}</p>
                                    <span className="text-xs text-gray-400 block text-right mt-1">
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t border-gray-200 flex items-center bg-white shadow-md">
                        <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Type your message..."
                            className="flex-1 mr-2 resize-none rounded-3xl py-2 focus:ring-indigo-500 focus:border-indigo-500"
                            rows={1}
                            disabled={isSending}
                        />
                        <Button onClick={handleSendMessage} disabled={isSending} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 h-10 w-10">
                            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminConversationPage;



'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAppContext } from '../../context/AppContext';
import Link from 'next/link';
import { Loader2, MessageSquare, MoreHorizontal, Trash2 } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';

const AdminChatPage = () => {
    const { fetchWithAuth } = useAppContext();
    const [conversations, setConversations] = useState([]);
    const [liveConversations, setLiveConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const socketRef = useRef(null); // Use useRef for socket instance

    // Socket.io initialization and event listeners
    useEffect(() => {
        const initSocket = async () => {
            await fetch('/api/socket'); // Ensure Socket.io server is initialized
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
                            updatedAt: new Date().toISOString(), // Update timestamp
                            status: message.senderType === 'customer' ? 'pending_admin_response' : prev[existingConvIndex].status,
                            // Optionally, update last message snippet here if available
                        };
                        const newConvs = [...prev];
                        newConvs[existingConvIndex] = updatedConv;
                        return newConvs;
                    } else {
                        // If conversation not found, it might be a new one, re-fetch all
                        // For simplicity, let's refetch all for now, or add specific logic
                        return prev;
                    }
                });
                // Re-filter live conversations
                setLiveConversations(prev => {
                    const updatedPrev = prev.map(conv =>
                        conv.id === message.conversationId
                            ? { ...conv, updatedAt: new Date().toISOString(), status: message.senderType === 'customer' ? 'pending_admin_response' : conv.status }
                            : conv
                    );
                    // If the updated conversation's status changes to non-live, filter it out
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
                    // Update if status is live, remove if not
                    const updatedPrev = prev.map(conv => conv.id === updatedConversation.id ? updatedConversation : conv);
                    return updatedPrev.filter(conv => conv.status === 'open' || conv.status === 'pending_admin_response');
                });
            });


            newSocket.on('disconnect', () => {
            });
        };

        if (isLoading === false) { // Only initialize socket after initial conversation data is loaded
            initSocket();
        }


        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isLoading, setConversations, setLiveConversations]); // Depends on isLoading to ensure data is loaded and state setters

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
    }, [fetchWithAuth, setConversations, setLiveConversations]); // Added fetchWithAuth and setters to dependencies

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
                    alert('Conversation deleted successfully!');
                    setConversations(prev => prev.filter(conv => conv.id !== conversationId)); // Remove from local state
                    setLiveConversations(prev => prev.filter(conv => conv.id !== conversationId)); // Remove from live state
                } else {
                    const errData = await res.json();
                    alert(`Failed to delete conversation: ${errData.message}`);
                }
            } catch (err) {
                alert(`Error deleting conversation: ${err.message}`);
            }
        }
    };


    const getStatusVariant = (status) => {
        switch (status?.toLowerCase()) {
            case 'open': return 'default';
            case 'pending_admin_response': return 'destructive'; // Highlight for admin to respond
            case 'pending_customer_response': return 'secondary';
            case 'closed': return 'outline';
            default: return 'default';
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-32 w-32 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold text-gray-900">Customer Chats</h1>

            {/* Live Customers Section */}
            <div className="bg-white shadow-lg rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Live Customers ({liveConversations.length})</h2>
                {liveConversations.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                        <p>No customers currently online or needing attention.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {liveConversations.map(conv => (
                            <Link key={conv.id} href={`/admin/chat/${conv.id}`} className="block">
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-semibold text-gray-800 truncate">{conv.customerName || 'N/A'}</p>
                                        <Badge variant={getStatusVariant(conv.status)}>{conv.status}</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">{conv.customerEmail}</p>
                                    <span className="text-xs text-gray-500 mt-1 block">Last updated: {new Date(conv.updatedAt).toLocaleTimeString()}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-4">All Conversations</h2>
            {conversations.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                    <p>No conversations found.</p>
                </div>
            ) : (
                <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {conversations.map((conv) => (
                            <li key={conv.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                                <Link href={`/admin/chat/${conv.id}`} className="flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-lg font-semibold text-gray-800">
                                            {conv.customerName || 'N/A'}
                                        </p>
                                        <span className="text-xs text-gray-500">
                                            {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <p className="truncate">{conv.customerEmail}</p>
                                        {/* Optional: Add a last message snippet here if available from API */}
                                    </div>
                                </Link>

                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <Badge variant={getStatusVariant(conv.status)}>{conv.status}</Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AdminChatPage;

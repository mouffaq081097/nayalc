'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, MessageSquare, CheckCircle, XCircle, ChevronRight, MoreHorizontal, Trash2 } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';

const AdminChatPage = () => {
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllConversations = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/chat-global/conversations');
                if (!response.ok) {
                    throw new Error('Failed to fetch conversations');
                }
                const data = await response.json();
                setConversations(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllConversations();
    }, []);

    const handleDeleteConversation = async (conversationId) => {
        if (!conversationId) return;

        if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
            try {
                const res = await fetch(`/api/chat/conversation/${conversationId}`, {
                    method: 'DELETE',
                });
                if (res.ok) {
                    alert('Conversation deleted successfully!');
                    setConversations(prev => prev.filter(conv => conv.id !== conversationId)); // Remove from local state
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
            {conversations.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                    <p>No active conversations found.</p>
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

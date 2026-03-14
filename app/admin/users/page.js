'use client';
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Mail, Phone, Home, User, Search, ChevronDown, UserCheck, Shield, Star, MapPin, ExternalLink, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AllUsersPage = () => {
    const { fetchWithAuth } = useAppContext();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedUsers, setExpandedUsers] = useState({});

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetchWithAuth('/api/users');
                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [fetchWithAuth]);

    const toggleUserAddresses = (userId) => {
        setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
    };

    const filteredUsers = users.filter(user =>
        (user.first_name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (user.last_name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Synchronizing Client Directory...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-red-500">
                <Shield size={40} className="opacity-20" />
                <p className="font-bold uppercase tracking-widest text-sm">Access Protocol Failure: {error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Client Directory</h2>
                    <p className="text-sm text-gray-400 mt-1">Managing {users.length} verified accounts in the Naya Lumière ecosystem</p>
                </div>
                
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or ID..."
                        className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredUsers.map((user) => (
                        <motion.div 
                            key={user.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col"
                        >
                            <div className="p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600">
                                                <User size={32} strokeWidth={1.5} />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-green-500 border-2 border-white flex items-center justify-center shadow-sm">
                                                <UserCheck size={12} className="text-white" />
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">{user.first_name} {user.last_name}</h3>
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">ID: {user.id.toString().padStart(5, '0')}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="px-3 py-1 bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400 rounded-full border border-gray-100">Verified</span>
                                        <div className="flex gap-0.5 text-amber-400">
                                            {[...Array(5)].map((_, i) => <Star key={i} size={8} className="fill-current" />)}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 pt-4 border-t border-gray-50">
                                    <div className="flex items-center group cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                            <Mail size={18} />
                                        </div>
                                        <div className="ml-4 overflow-hidden">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Email Address</p>
                                            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center group cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                            <Phone size={18} />
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Contact Number</p>
                                            <p className="text-sm font-medium text-gray-900">{user.phone_number || 'No primary contact'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center group">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                            <Calendar size={18} />
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Member Since</p>
                                            <p className="text-sm font-medium text-gray-900">Oct 2025</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-gray-50">
                                    <button 
                                        onClick={() => toggleUserAddresses(user.id)} 
                                        className="w-full flex justify-between items-center group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${expandedUsers[user.id] ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-50 text-gray-400'}`}>
                                                <Home size={18} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Logistics Hub</p>
                                                <p className="text-sm font-bold text-gray-900">Address Book ({user.addresses?.length || 0})</p>
                                            </div>
                                        </div>
                                        <ChevronDown className={`text-gray-300 transition-transform duration-500 ${expandedUsers[user.id] ? 'rotate-180 text-indigo-600' : ''}`} />
                                    </button>
                                    
                                    <AnimatePresence>
                                        {expandedUsers[user.id] && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-6 space-y-4">
                                                    {user.addresses && user.addresses.length > 0 ? (
                                                        user.addresses.map((address) => (
                                                            <div key={address.id} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 relative group/addr">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <MapPin size={12} className="text-indigo-600" />
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">{address.address_label}</p>
                                                                    </div>
                                                                    {address.is_default && <span className="text-[8px] font-black text-white bg-indigo-600 rounded-full px-2 py-0.5 uppercase tracking-tighter">Default</span>}
                                                                </div>
                                                                <div className="text-xs text-gray-500 space-y-1 font-medium italic">
                                                                    <p>{address.address_line1}</p>
                                                                    {address.address_line2 && <p>{address.address_line2}</p>}
                                                                    <p className="text-gray-900 not-italic font-bold">{address.city}, {address.state}</p>
                                                                    <p className="uppercase tracking-widest text-[10px] pt-1">{address.country} · {address.zip_code}</p>
                                                                </div>
                                                                <button className="absolute top-4 right-4 opacity-0 group-hover/addr:opacity-100 transition-opacity">
                                                                    <ExternalLink size={14} className="text-gray-300 hover:text-indigo-600" />
                                                                </button>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100 flex flex-col items-center justify-center gap-2">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 italic">No logistics data available</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                            
                            <div className="mt-auto bg-gray-50/50 p-4 border-t border-gray-50 flex items-center justify-between">
                                <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors">View Order History</button>
                                <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors">Suspend Account</button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredUsers.length === 0 && (
                <div className="min-h-[300px] bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
                    <User size={40} className="text-gray-200" />
                    <p className="text-lg font-medium text-gray-400 italic">No clients matching those parameters found in our registry.</p>
                </div>
            )}
        </div>
    );
};

export default AllUsersPage;
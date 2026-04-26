'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { io } from 'socket.io-client';
import { 
    Mail, Phone, User, Search, UserCheck, Shield, Calendar, 
    ShieldAlert, ShieldCheck, LayoutGrid, List, MoreHorizontal, 
    EyeOff, Archive, ExternalLink, MapPin, Home, ChevronDown, Circle, Star
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Image from 'next/image';

const AllUsersPage = () => {
    const { fetchWithAuth } = useAppContext();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [expandedUsers, setExpandedUsers] = useState({});
    const [onlineUsers, setOnlineUsers] = useState([]);
    const socketRef = useRef(null);

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

    useEffect(() => {
        const initSocket = async () => {
            await fetch('/api/socket');
            const socket = io('/', { path: '/api/socket_io' });
            socketRef.current = socket;

            socket.on('connect', () => {
                socket.emit('join_room', 'admin');
                socket.emit('get_online_users', (ids) => {
                    setOnlineUsers(ids.map(id => Number(id)));
                });
            });

            socket.on('user_status_change', ({ userId, status }) => {
                const id = Number(userId);
                if (status === 'online') {
                    setOnlineUsers(prev => prev.includes(id) ? prev : [...prev, id]);
                } else {
                    setOnlineUsers(prev => prev.filter(i => i !== id));
                }
            });
        };

        initSocket();

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const toggleAdminRole = async (userId, currentStatus) => {
        const newStatus = !currentStatus;
        const confirmMsg = newStatus 
            ? "Are you sure you want to grant Admin privileges to this user?" 
            : "Are you sure you want to revoke Admin privileges from this user?";
            
        if (!window.confirm(confirmMsg)) return;

        try {
            const response = await fetchWithAuth(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                body: JSON.stringify({ is_admin: newStatus })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update role');
            }
            
            setUsers(prevUsers => prevUsers.map(u => 
                u.id === userId ? { ...u, is_admin: newStatus } : u
            ));
            
            toast.success(`Admin privileges ${newStatus ? 'granted' : 'revoked'} successfully.`);
        } catch (err) {
            toast.error(err.message);
        }
    };

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
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-purple-100 border-t-[#9333ea] rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-red-500">
                <Shield size={40} className="opacity-20" />
                <p className="font-bold text-sm">Access Protocol Failure: {error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={15} style={{ color: 'rgba(147,51,234,0.4)' }} />
                    <input
                        type="text" placeholder="Search clients…"
                        className="w-full pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all rounded-full"
                        style={{
                            background: 'rgba(255,255,255,0.8)',
                            border: '1px solid rgba(216,180,254,0.55)',
                            color: '#3b0764',
                        }}
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* View toggle */}
                    <div className="flex rounded-full p-1" style={{ background: 'rgba(243,232,255,0.6)', border: '1px solid rgba(216,180,254,0.4)' }}>
                        <button onClick={() => setViewMode('grid')}
                            className="p-1.5 rounded-full transition-all"
                            style={viewMode === 'grid' ? { background: '#fff', color: '#9333ea', boxShadow: '0 1px 4px rgba(147,51,234,0.2)' } : { color: 'rgba(107,33,168,0.5)' }}>
                            <LayoutGrid size={15} />
                        </button>
                        <button onClick={() => setViewMode('list')}
                            className="p-1.5 rounded-full transition-all"
                            style={viewMode === 'list' ? { background: '#fff', color: '#9333ea', boxShadow: '0 1px 4px rgba(147,51,234,0.2)' } : { color: 'rgba(107,33,168,0.5)' }}>
                            <List size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid / List */}
            <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                    <motion.div key="grid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredUsers.map(user => (
                            <div key={user.id}
                                className="group relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300  "
                                style={{ background: 'rgba(243,232,255,0.38)', border: '1px solid rgba(216,180,254,0.4)' }}
                            >
                                {/* Status badges */}
                                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                                    {user.is_admin && (
                                        <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-purple-600 text-white shadow-sm flex items-center gap-1 border border-purple-500">
                                            <ShieldCheck size={8} /> Admin
                                        </span>
                                    )}
                                    <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-white/80 text-gray-600 border border-gray-200 backdrop-blur-sm flex items-center gap-1">
                                        <UserCheck size={8} /> Verified
                                    </span>
                                </div>

                                {/* Quick-action menu top-right */}
                                <div className="absolute top-3 right-3 z-10  transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-purple-100 flex items-center justify-center shadow-sm">
                                                <MoreHorizontal size={13} className="text-purple-400" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-purple-100 p-1.5">
                                            <DropdownMenuItem onClick={() => toggleAdminRole(user.id, user.is_admin)} className="rounded-lg px-3 py-2.5 text-sm gap-2.5">
                                                {user.is_admin ? <><ShieldAlert size={14} className="text-orange-500" /> Revoke Admin</> : <><ShieldCheck size={14} className="text-purple-500" /> Make Admin</>}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toast("User details portal coming soon")} className="rounded-lg px-3 py-2.5 text-sm gap-2.5">
                                                <ExternalLink size={14} className="text-blue-500" /> View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toast("Suspend feature coming soon")} className="rounded-lg px-3 py-2.5 text-sm gap-2.5 text-red-600 focus:bg-red-50">
                                                <EyeOff size={14} /> Suspend Account
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Avatar Container — mimics the white product image card */}
                                <div
                                    className="relative mx-3 mt-3 rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 cursor-pointer"
                                    style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.85)' }}
                                    onClick={() => toggleUserAddresses(user.id)}
                                >
                                    <div className="relative w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-purple-400 mb-4 border border-purple-100 shadow-sm transition-transform duration-500 overflow-hidden">
                                        {user.profile_image ? (
                                            <Image src={user.profile_image} alt={`${user.first_name} ${user.last_name}`} fill className="object-cover" />
                                        ) : (
                                            <User size={28} />
                                        )}
                                    </div>
                                    {onlineUsers.includes(Number(user.id)) && (
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-4">
                                            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-green-100 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-[8px] font-bold text-green-600 uppercase">Online</span>
                                            </div>
                                        </div>
                                    )}
                                    <h3 className="text-sm font-bold text-gray-900 text-center leading-tight">{user.first_name} {user.last_name}</h3>
                                    <p className="text-[10px] font-semibold text-gray-400 mt-1">ID: {user.id.toString().padStart(5, '0')}</p>
                                </div>

                                {/* Info section */}
                                <div className="px-4 pt-3 pb-4 flex flex-col flex-grow">
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Mail size={12} className="text-purple-400 shrink-0" />
                                            <span className="text-[11px] truncate">{user.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Phone size={12} className="text-purple-400 shrink-0" />
                                            <span className="text-[11px] truncate">{user.phone_number || 'No contact'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar size={12} className="text-purple-400 shrink-0" />
                                            <span className="text-[11px]">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span>
                                        </div>
                                    </div>

                                    {/* Loyalty Section */}
                                    <div className="mb-4 pt-3 border-t border-purple-50">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                                <span className="text-[11px] font-bold text-gray-700">Prestige Rewards</span>
                                            </div>
                                            <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                                                {user.loyalty_points || 0} pts
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => toast("Detailed ledger view coming soon")}
                                            className="w-full py-1.5 rounded-lg border border-dashed border-purple-200 text-[9px] font-bold text-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all uppercase tracking-tight"
                                        >
                                            View Point history
                                        </button>
                                    </div>

                                    {/* Logistics / Address Book Toggle */}
                                    <div className="mb-4 pt-3 border-t border-purple-50">
                                        <button 
                                            onClick={() => toggleUserAddresses(user.id)} 
                                            className="w-full flex justify-between items-center group/addr"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${expandedUsers[user.id] ? 'bg-purple-600 text-white shadow-md' : 'bg-purple-50 text-purple-400 '}`}>
                                                    <Home size={14} />
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-700">Address Book ({user.addresses?.length || 0})</span>
                                            </div>
                                            <ChevronDown size={14} className={`text-gray-300 transition-transform duration-300 ${expandedUsers[user.id] ? 'rotate-180 text-purple-600' : ''}`} />
                                        </button>
                                        
                                        <AnimatePresence>
                                            {expandedUsers[user.id] && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-3 space-y-2 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
                                                        {user.addresses && user.addresses.length > 0 ? (
                                                            user.addresses.map((address) => (
                                                                <div key={address.id} className="p-3 bg-white/60 rounded-xl border border-purple-100/50 relative group/item">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <MapPin size={10} className="text-purple-500" />
                                                                            <p className="text-[9px] font-bold text-gray-800">{address.address_label}</p>
                                                                        </div>
                                                                        {address.is_default && <span className="text-[7px] font-black text-white bg-purple-400 rounded-full px-1.5 py-0.5">Default</span>}
                                                                    </div>
                                                                    <div className="text-[9px] text-gray-500 leading-relaxed font-medium">
                                                                        <p>{address.address_line1}</p>
                                                                        <p className="text-gray-900 font-bold">{address.city}, {address.state}</p>
                                                                        <p className="text-[8px] opacity-70">{address.country} · {address.zip_code}</p>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 bg-white/40 rounded-xl border border-dashed border-purple-100 flex items-center justify-center">
                                                                <p className="text-[9px] text-gray-400 italic">No addresses found</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Action button — matches user-side "Edit Product" */}
                                    <button
                                        onClick={() => toast("User details portal coming soon")}
                                        className="mt-auto w-full py-2 rounded-full text-[11px] font-semibold transition-all duration-200 hover:shadow-md"
                                        style={{
                                            background: 'rgba(255,255,255,0.7)',
                                            border: '1px solid rgba(216,180,254,0.6)',
                                            color: '#6b21a8',
                                        }}
                                    >
                                        Manage Client
                                    </button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div key="list" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(216,180,254,0.35)' }}>
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: 'rgba(248,240,255,0.7)' }}>
                                    {['Client','Contact','Addresses','Loyalty','Status','Joined',''].map((h, i) => (
                                        <th key={i} className={`px-6 py-4 text-[10px] font-black text-purple-400 ${i>=6 ? 'text-right' : 'text-left'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-50">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="group transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-12 h-12 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-400 flex-shrink-0 overflow-hidden">
                                                    {user.profile_image ? (
                                                        <Image src={user.profile_image} alt={`${user.first_name} ${user.last_name}`} fill className="object-cover" />
                                                    ) : (
                                                        <User size={18} />
                                                    )}
                                                    {onlineUsers.includes(Number(user.id)) && (
                                                        <div className="absolute inset-0 border-2 border-green-500 rounded-full animate-pulse" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                                        {user.first_name} {user.last_name}
                                                        {onlineUsers.includes(Number(user.id)) && (
                                                            <span className="w-2 h-2 rounded-full bg-green-500" title="Online" />
                                                        )}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-gray-400">ID: {user.id.toString().padStart(5, '0')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-700">{user.email}</p>
                                            <p className="text-[10px] text-gray-400">{user.phone_number || 'No phone'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[11px] font-bold text-gray-600 hover:bg-white hover:border-purple-200 transition-all">
                                                        <MapPin size={12} className="text-purple-400" />
                                                        {user.addresses?.length || 0} Saved
                                                        <ChevronDown size={10} className="text-gray-400" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-64 p-3 rounded-2xl shadow-xl border-purple-100 max-h-80 overflow-y-auto no-scrollbar">
                                                    <p className="text-[10px] font-black text-purple-500 mb-3 px-1">Saved Logistics Hubs</p>
                                                    {user.addresses && user.addresses.length > 0 ? (
                                                        user.addresses.map((addr) => (
                                                            <div key={addr.id} className="mb-2 p-3 bg-purple-50/30 rounded-xl border border-purple-100/50 last:mb-0">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <p className="text-[10px] font-bold text-gray-900">{addr.address_label}</p>
                                                                    {addr.is_default && <span className="text-[7px] font-black text-white bg-purple-400 px-1.5 py-0.5 rounded-full">Primary</span>}
                                                                </div>
                                                                <p className="text-[9px] text-gray-500 font-medium">{addr.address_line1}, {addr.city}</p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-[10px] text-gray-400 italic text-center py-4">No logistics data recorded.</p>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                                <span className="text-sm font-bold text-gray-700">{user.loyalty_points || 0} pts</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {user.is_admin && (
                                                    <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-purple-100 text-purple-700 flex items-center gap-1 border border-purple-200">
                                                        Admin
                                                    </span>
                                                )}
                                                <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-green-50 text-green-600 border border-green-200">
                                                    Verified
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 transition-opacity">
                                                <button onClick={() => toggleAdminRole(user.id, user.is_admin)} className="p-2 rounded-lg hover:bg-purple-100 text-gray-400 hover:text-purple-600 transition-all" title="Toggle Admin">
                                                    <ShieldCheck size={14} />
                                                </button>
                                                <button onClick={() => toast("Suspend feature coming soon")} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all" title="Suspend">
                                                    <EyeOff size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}
            </AnimatePresence>

            {filteredUsers.length === 0 && (
                <div className="min-h-[260px] bg-white rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3" style={{ borderColor: 'rgba(216,180,254,0.5)' }}>
                    <Archive size={36} className="text-purple-200" />
                    <p className="text-gray-400 font-medium">No clients found</p>
                </div>
            )}
        </div>
    );
};

export default AllUsersPage;

'use client';
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Mail, Phone, Home, User, Search, ChevronDown } from 'lucide-react';

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
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
    }

    return (
        <div>
            <div className="flex justify-end items-center mb-8">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="pl-10 pr-4 py-2 border rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center space-x-4">
                                <div className="bg-indigo-100 p-3 rounded-full">
                                    <User className="h-8 w-8 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-gray-900">{user.first_name} {user.last_name}</p>
                                    <p className="text-sm text-gray-500">User ID: {user.id}</p>
                                </div>
                            </div>
                            
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center text-gray-700">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                    <p className="ml-3">{user.email}</p>
                                </div>
                                <div className="flex items-center text-gray-700">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                    <p className="ml-3">{user.phone_number || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div className="mt-6">
                                <button onClick={() => toggleUserAddresses(user.id)} className="w-full flex justify-between items-center text-lg font-semibold text-gray-800">
                                    <div className="flex items-center">
                                        <Home className="h-5 w-5 mr-2" />
                                        Addresses
                                    </div>
                                    <ChevronDown className={`transform transition-transform duration-300 ${expandedUsers[user.id] ? 'rotate-180' : ''}`} />
                                </button>
                                <div className={`mt-4 space-y-2 text-sm text-gray-600 overflow-hidden transition-all duration-500 ease-in-out ${expandedUsers[user.id] ? 'max-h-screen' : 'max-h-0'}`}>
                                    {user.addresses && user.addresses.length > 0 ? (
                                        user.addresses.map((address) => (
                                            <div key={address.id} className="p-4 bg-gray-50 rounded-lg">
                                                <p className="font-semibold">{address.address_label} {address.is_default && <span className="text-xs text-white bg-green-500 rounded-full px-2 py-1 ml-2">Default</span>}</p>
                                                <p>{address.address_line1}, {address.address_line2}</p>
                                                <p>{address.city}, {address.state} {address.zip_code}</p>
                                                <p>{address.country}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="p-4 bg-gray-50 rounded-lg">No registered addresses.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {filteredUsers.length === 0 && (
                <div className="text-center mt-10">
                    <p className="text-xl text-gray-500">No users found.</p>
                </div>
            )}
        </div>
    );
};

export default AllUsersPage;

'use client';
import React, { useState, FormEvent, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import Modal from '../components/Modal';
import { Icon } from '../components/Icon';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

const AccountPage = () => {
    const { isAuthenticated, user, logout } = useAuth();
    
    const { contactInfo, shippingAddresses, updateContactInfo, addShippingAddress, updateShippingAddress, deleteShippingAddress } = useUser();

    // State for Contact Info form
    // State for Contact Info form
    const [contactFormData, setContactFormData] = useState(contactInfo);
    
    // State for Address Modal
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const initialAddressForm = { shipping_address: '', city: '', zip_code: '', country: 'United Arab Emirates' };
    const [addressFormData, setAddressFormData] = useState(initialAddressForm);

    useEffect(() => {
        setContactFormData(contactInfo);
    }, [contactInfo]);
    
    const handleLogout = () => {
        if(window.confirm('Are you sure you want to log out?')) {
            logout();
        }
    }

    const handleContactChange = (e) => {
        const { name, value } = e.target;
        setContactFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContactSubmit = (e) => {
        e.preventDefault();
        updateContactInfo(contactFormData);
        alert('Contact information updated!');
    };
    
    // Address Modal Handlers
    const handleOpenAddAddressModal = () => {
        setEditingAddress(null);
        setAddressFormData(initialAddressForm);
        setIsAddressModalOpen(true);
    };
    
    const handleOpenEditAddressModal = (address) => {
        setEditingAddress(address);
        setAddressFormData(address);
        setIsAddressModalOpen(true);
    };

    const handleCloseAddressModal = () => {
        setIsAddressModalOpen(false);
        setEditingAddress(null);
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setAddressFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressSubmit = (e) => {
        e.preventDefault();
        
        if (editingAddress) {
            updateShippingAddress({ ...addressFormData, id: editingAddress.id });
        } else {
            addShippingAddress(addressFormData);
        }
        handleCloseAddressModal();
    };

    const handleDeleteAddress = (addressId) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            deleteShippingAddress(addressId);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="py-20">
                <div className="max-w-md mx-auto text-center bg-white p-12 rounded-lg shadow-lg">
                    <h1 className="text-2xl font-serif font-bold mb-4" style={{ color: 'var(--brand-text)' }}>Access Your Account</h1>
                    <p className="mb-6" style={{ color: 'var(--brand-muted)' }}>
                        Please sign in to view your account details, order history, and manage your addresses.
                    </p>
                    <Link 
                        href="/auth" 
                        className="inline-block text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-colors"
                        style={{ backgroundColor: 'var(--brand-blue)' }}
                    >
                        Sign In or Register
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'var(--brand-secondary)' }}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-serif font-bold" style={{ color: 'var(--brand-text)' }}>My Account</h1>
                    <p className="mt-2" style={{ color: 'var(--brand-muted)' }}>Welcome back, {user?.username}! Manage your account below.</p>
                </div>

                <div className="space-y-12">
                     {/* Navigation Section */}
                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link href="/orders" className="flex items-center p-4 rounded-lg hover:bg-[#F5F3F1] transition-colors" style={{ borderColor: 'rgba(160, 184, 186, 0.5)', borderWidth: '1px', borderStyle: 'solid' }}>
                                <Icon name="orders" className="w-8 h-8" style={{ color: 'var(--brand-blue)' }} />
                                <div className="ml-4">
                                    <h3 className="font-semibold" style={{ color: 'var(--brand-text)' }}>My Orders</h3>
                                    <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>View your order history and track status</p>
                                </div>
                            </Link>
                             <button onClick={handleLogout} className="flex items-center p-4 rounded-lg hover:bg-[#F5F3F1] transition-colors text-left" style={{ borderColor: 'rgba(160, 184, 186, 0.5)', borderWidth: '1px', borderStyle: 'solid' }}>
                                <Icon name="logout" className="w-8 h-8" style={{ color: 'var(--brand-blue)' }} />
                                <div className="ml-4">
                                    <h3 className="font-semibold" style={{ color: 'var(--brand-text)' }}>Logout</h3>
                                    <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>Sign out of your account</p>
                                </div>
                            </button>
                        </div>
                    </section>
                    {/* Contact Information */}
                    <section className="bg-white p-8 rounded-lg shadow-md">
                        <h2 className="text-2xl font-serif mb-6" style={{ color: 'var(--brand-text)' }}>Contact Information</h2>
                        <form onSubmit={handleContactSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium" style={{ color: 'var(--brand-text)' }}>Full Name</label>
                                    <input type="text" name="name" id="name" value={contactFormData.name} onChange={handleContactChange} className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus-ring-brand-pink focus-border-brand-pink" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium" style={{ color: 'var(--brand-text)' }}>Email Address</label>
                                    <input type="email" name="email" id="email" value={contactFormData.email} onChange={handleContactChange} className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm bg-gray-100 focus-ring-brand-pink focus-border-brand-pink" readOnly />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium" style={{ color: 'var(--brand-text)' }}>Phone Number</label>
                                <input type="tel" name="phone" id="phone" value={contactFormData.phone} onChange={handleContactChange} className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus-ring-brand-pink focus-border-brand-pink" />
                            </div>
                            <div className="text-right pt-2">
                                <button type="submit" className="text-white px-6 py-2 rounded-full font-bold hover:opacity-90 transition-colors" style={{ backgroundColor: 'var(--brand-blue)' }}>Save Changes</button>
                            </div>
                        </form>
                    </section>

                    {/* Shipping Addresses */}
                    <section className="bg-white p-8 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-serif" style={{ color: 'var(--brand-text)' }}>Shipping Addresses</h2>
                            <button onClick={handleOpenAddAddressModal} className="text-white px-4 py-2 rounded-full font-semibold text-sm hover:opacity-90 flex items-center space-x-2" style={{ backgroundColor: 'var(--brand-blue)' }}>
                                <Icon name="plus" className="w-4 h-4" />
                                <span>Add New Address</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            
                            {shippingAddresses.length > 0 ? (
                                shippingAddresses.map(addr => (
                                    <div key={addr.id} className="border p-4 rounded-md flex justify-between items-start">
                                        <div>
                                            <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>{addr.address_line1}, {addr.city}, {addr.zip_code}</p>
                                            <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>{addr.country}</p>
                                        </div>
                                        <div className="flex space-x-2 flex-shrink-0 ml-4">
                                            <button onClick={() => handleOpenEditAddressModal(addr)} className="text-blue-600 hover:text-blue-900"><Icon name="edit" className="w-5 h-5" /></button>
                                            <button onClick={() => handleDeleteAddress(addr.id)} className="text-red-600 hover:text-red-900"><Icon name="delete" className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-4" style={{ color: 'var(--brand-muted)' }}>You have no saved addresses.</p>
                            )}
                        </div>
                    </section>
                </div>
                
                {/* Address Form Modal */}
                <Modal isOpen={isAddressModalOpen} onClose={handleCloseAddressModal} title={editingAddress ? 'Edit Address' : 'Add New Address'}>
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                        
                        <input type="text" name="shipping_address" placeholder="Address" value={addressFormData.shipping_address} onChange={handleAddressChange} className="w-full border border-gray-300 rounded-md p-3 text-sm focus-ring-brand-pink focus-border-brand-pink" required />
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" name="city" placeholder="City" value={addressFormData.city} onChange={handleAddressChange} className="col-span-1 w-full border border-gray-300 rounded-md p-3 text-sm focus-ring-brand-pink focus-border-brand-pink" required />
                            <input type="text" name="zip_code" placeholder="Postal Code" value={addressFormData.zip_code} onChange={handleAddressChange} className="col-span-1 w-full border border-gray-300 rounded-md p-3 text-sm focus-ring-brand-pink focus-border-brand-pink" required />
                        </div>
                        <select name="country" value={addressFormData.country} onChange={handleAddressChange} className="w-full border border-gray-300 rounded-md p-3 text-sm focus-ring-brand-pink focus-border-brand-pink">
                            <option>United Arab Emirates</option>
                            <option>Saudi Arabia</option>
                            <option>Qatar</option>
                        </select>
                        <div className="pt-4 flex justify-end space-x-2">
                            <button type="button" onClick={handleCloseAddressModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm hover:opacity-90" style={{ backgroundColor: 'var(--brand-blue)' }}>Save Address</button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
};

export default AccountPage;

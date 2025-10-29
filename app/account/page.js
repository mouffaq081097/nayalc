'use client';
import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { User, Package, Heart, Settings, MapPin, CreditCard, Bell, LogOut, Eye, HandCoins, Mail, Phone, Cake, Lock, Truck, Plus } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useRouter, useSearchParams } from 'next/navigation';


import Modal from '../components/Modal';

const AccountPageContent = () => {
  const { user, logout } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditMode, setIsEditMode] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderSortOrder, setOrderSortOrder] = useState('date-desc');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [wishlistItems, setWishlistItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    birthday: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({...prev,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        username: user.username || '',
        email: user.email,
        birthday: user.birthday || ''
      }));

      const fetchAddresses = async () => {
        try {
          const response = await fetch(`/api/users/${user.id}/addresses`);
          if (response.ok) {
            const fetchedAddresses = await response.json();
            setAddresses(fetchedAddresses);
            if (fetchedAddresses.length > 0) {
              const defaultAddress = fetchedAddresses.find(addr => addr.isDefault) || fetchedAddresses[0];
              setProfileData(prev => ({...prev, phone: defaultAddress.customerPhone}));
            }
          }
        } catch (error) {
          console.error('Failed to fetch addresses:', error);
        }
      };

      fetchAddresses();

      const fetchOrders = async () => {
        try {
          const response = await fetch(`/api/orders?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setOrders(data);
          }
        } catch (error) {
          console.error('Failed to fetch orders:', error);
        }
      };

      fetchOrders();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'wishlist') {
      const fetchWishlist = async () => {
        try {
          console.log('Fetching wishlist for user:', user.id);
          const response = await fetch(`/api/wishlist?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            console.log('Wishlist data received:', data);
            setWishlistItems(data);
          } else {
            console.error('Failed to fetch wishlist with status:', response.status);
          }
        } catch (error) {
          console.error('Failed to fetch wishlist:', error);
        }
      };

      fetchWishlist();
    }
  }, [user, activeTab]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatOrderDate = (dateString) => {
    const orderDate = new Date(dateString);
    const today = new Date();
    if (orderDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return orderDate.toLocaleDateString();
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        alert('Profile updated successfully!');
        setIsEditMode(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to update profile: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('An error occurred while updating your profile.');
    }
  };

  const handleCancelEdit = () => {
    setProfileData(prev => ({...prev,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      username: user.username || '',
      email: user.email,
      birthday: user.birthday || ''
    }));
    setIsEditMode(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleRemoveFromWishlist = async (productId) => {
    if (!user) return;
    try {
      const response = await fetch(`/api/wishlist/${user.id}/${productId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setWishlistItems(prev => prev.filter(item => item.productId !== productId));
        alert('Product removed from wishlist!');
      } else {
        const errorData = await response.json();
        alert(`Failed to remove product from wishlist: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      alert('An error occurred while removing product from wishlist.');
    }
  };

  const handleAddToCartFromWishlist = (item) => {
    addToCart({ product: item, quantity: 1 });
    alert(`${item.name} added to cart!`);
  };

  const openAddressModal = (address) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(false);
  };

  const handleAddressSave = async (addressData) => {
    if (!user) return;

    const method = editingAddress ? 'PUT' : 'POST';
    const endpoint = editingAddress
      ? `/api/users/${user.id}/addresses/${editingAddress.id}`
      : `/api/users/${user.id}/addresses`;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
      });

      if (response.ok) {
        closeAddressModal();
        // Refresh addresses
        const res = await fetch(`/api/users/${user.id}/addresses`);
        if (res.ok) {
          const fetchedAddresses = await res.json();
          setAddresses(fetchedAddresses);
        }
        alert(`Address ${editingAddress ? 'updated' : 'saved'} successfully!`);
      } else {
        const errorData = await response.json();
        alert(`Failed to save address: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Failed to save address:', error);
      alert('An error occurred while saving the address.');
    }
  };

  const handleAddressRemove = async (addressId) => {
    if (!user) return;

    if (confirm('Are you sure you want to remove this address?')) {
      try {
        const response = await fetch(`/api/users/${user.id}/addresses/${addressId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Refresh addresses
          const res = await fetch(`/api/users/${user.id}/addresses`);
          if (res.ok) {
            const fetchedAddresses = await res.json();
            setAddresses(fetchedAddresses);
          }
          alert('Address removed successfully!');
        } else {
          const errorData = await response.json();
          alert(`Failed to remove address: ${errorData.message}`);
        }
      } catch (error) {
        console.error('Failed to remove address:', error);
        alert('An error occurred while removing the address.');
      }
    }
  };

  const AddressForm = ({ address, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      addressLabel: address?.addressLabel || '',
      addressLine1: address?.addressLine1 || '',
      addressLine2: address?.addressLine2 || '',
      city: address?.city || '',
      state: address?.state || '',
      zipCode: address?.zipCode || '',
      country: address?.country || '',
      isDefault: address?.isDefault || false,
    });

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="addressLabel">Address Label</Label>
            <Input id="addressLabel" name="addressLabel" value={formData.addressLabel} onChange={handleChange} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="addressLine1">Address Line 1</Label>
            <Input id="addressLine1" name="addressLine1" value={formData.addressLine1} onChange={handleChange} required />
          </div>
          <div className="col-span-2">
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input id="addressLine2" name="addressLine2" value={formData.addressLine2} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" value={formData.state} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="zipCode">Zip Code</Label>
            <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" value={formData.country} onChange={handleChange} required />
          </div>
          <div className="col-span-2 flex items-center">
            <input type="checkbox" id="isDefault" name="isDefault" checked={formData.isDefault} onChange={handleChange} className="mr-2" />
            <Label htmlFor="isDefault">Set as default address</Label>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save Address</Button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 sticky top-24">
              {/* Profile Header */}
              <div className="text-center mb-6 pb-6 border-b border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-3">
                  {profileData.firstName[0]}{profileData.lastName[0]}
                </div>
                <h3 className="font-medium">{profileData.firstName} {profileData.lastName}</h3>
                <p className="text-sm text-gray-500">@{user?.username}</p>
                <p className="text-sm text-gray-500">{profileData.email}</p>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'orders', label: 'Orders', icon: Package },
                  { id: 'wishlist', label: 'Wishlist', icon: Heart },
                  { id: 'addresses', label: 'Addresses', icon: MapPin },
                  { id: 'payment', label: 'Payment', icon: CreditCard },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'settings', label: 'Settings', icon: Settings },
                  { id: 'logout', label: 'Sign Out', icon: LogOut, onClick: handleLogout }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={item.onClick || (() => setActiveTab(item.id))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-[var(--brand-blue)]/10 to-[var(--brand-pink)]/10 text-[var(--brand-pink)]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl p-8"
            >
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  {isEditMode ? (
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl">Edit Profile</h2>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={profileData.username}
                            onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={profileData.phone}
                            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="birthday">Birthday</Label>
                          <Input
                            id="birthday"
                            type="date"
                            value={profileData.birthday}
                            onChange={(e) => setProfileData(prev => ({ ...prev, birthday: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="mt-8 flex gap-4">
                        <Button onClick={handleSaveChanges} className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90">
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-6 mb-8">
                        <div className="w-24 h-24 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] rounded-full flex items-center justify-center text-white text-4xl">
                          {profileData.firstName[0]}{profileData.lastName[0]}
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold">{profileData.firstName} {profileData.lastName}</h2>
                          <p className="text-lg text-gray-500">@{profileData.username}</p>
                        </div>
                        <Button variant="outline" className="ml-auto" onClick={() => setIsEditMode(true)}>Edit Profile</Button>
                      </div>

                      <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">About</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                            <Mail className="h-6 w-6 text-gray-500" />
                            <div>
                              <Label>Email</Label>
                              <p className="font-semibold">{profileData.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                            <Phone className="h-6 w-6 text-gray-500" />
                            <div>
                              <Label>Phone</Label>
                              <p className="font-semibold">{profileData.phone}</p>
                            </div>
                          </div>
                          {profileData.birthday && <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                            <Cake className="h-6 w-6 text-gray-500" />
                            <div>
                              <Label>Birthday</Label>
                              <p className="font-semibold">{profileData.birthday}</p>
                            </div>
                          </div>}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold mb-4">Security</h3>
                        <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <Lock className="h-6 w-6 text-gray-500" />
                            <div>
                              <Label>Password</Label>
                              <p className="font-semibold">••••••••••••</p>
                            </div>
                          </div>
                          <Button variant="outline">Change Password</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl">Order History</h2>
                  </div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-4">
                      <Input
                        placeholder="Search by order # or product"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        className="w-64"
                      />
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      >
                        <option value="all">All Statuses</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                      <select
                        value={orderSortOrder}
                        onChange={(e) => setOrderSortOrder(e.target.value)}
                        className="border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="total-desc">Total: High to Low</option>
                        <option value="total-asc">Total: Low to High</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    {orders
                      .filter(order => {
                        if (orderStatusFilter === 'all') return true;
                        return order.orderStatus === orderStatusFilter;
                      })
                      .filter(order => {
                        if (!orderSearchQuery) return true;
                        const searchableFields = [
                          order.id.toString(),
                          ...order.items.map(item => item.name)
                        ];
                        return searchableFields.some(field => field.toLowerCase().includes(orderSearchQuery.toLowerCase()));
                      })
                      .sort((a, b) => {
                        switch (orderSortOrder) {
                          case 'date-asc':
                            return new Date(a.createdAt) - new Date(b.createdAt);
                          case 'total-desc':
                            return b.totalAmount - a.totalAmount;
                          case 'total-asc':
                            return a.totalAmount - b.totalAmount;
                          case 'date-desc':
                          default:
                            return new Date(b.createdAt) - new Date(a.createdAt);
                        }
                      })
                      .map((order) => (
                      <div key={order.id} className="bg-gray-50 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="text-lg font-bold">Order #{order.id}</h3>
                            <p className="text-sm text-gray-500">Placed on {formatOrderDate(order.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={`${getStatusColor(order.orderStatus)} text-sm font-semibold`}>
                              {getStatusText(order.orderStatus)}
                            </Badge>
                            <p className="text-xl font-bold mt-1">AED {order.totalAmount}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6 my-6">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <ImageWithFallback
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-20 h-20 object-contain rounded-lg bg-white"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold">{item.name}</h4>
                                <p className="text-sm text-gray-500">{item.brandName}</p>
                                <p className="text-sm font-semibold">Qty: {item.quantity} • AED {item.price}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-4 pt-4 border-t border-gray-200">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Truck className="h-4 w-4 mr-2" />
                            Track Order
                          </Button>
                          {order.orderStatus === 'delivered' && (
                            <Button variant="outline" size="sm" className="flex-1">
                              Reorder
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wishlist Tab */}
              {activeTab === 'wishlist' && (
                <div>
                  <h2 className="text-2xl mb-6">My Wishlist</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistItems.map((item) => (
                      <div key={item.productId} className="border border-gray-200 rounded-xl p-4">
                        <ImageWithFallback
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-48 object-contain rounded-lg mb-4"
                        />
                        <h3 className="font-medium mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{item.brandName}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500 mb-2">{item.description.length > 100 ? item.description.substring(0, 100) + '...' : item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-lg">AED {item.price}</span>
                          {item.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">AED {item.originalPrice}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
                            onClick={() => handleAddToCartFromWishlist(item)}
                          >
                            Add to Cart
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemoveFromWishlist(item.productId)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl">Shipping Addresses</h2>
                    <Button variant="outline" onClick={() => openAddressModal(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Address
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    {addresses.map((address) => (
                      <div key={address.id} className="bg-gray-50 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold">{address.addressLabel}</h3>
                            {address.isDefault && <Badge className="text-xs font-semibold">Default</Badge>}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openAddressModal(address)}>Edit</Button>
                            <Button variant="outline" size="sm" onClick={() => handleAddressRemove(address.id)}>Remove</Button>
                          </div>
                        </div>
                        <p className="text-gray-600">
                          {address.addressLine1}<br />
                          {address.addressLine2 && <span>{address.addressLine2}<br /></span>}
                          {address.city}, {address.state} {address.zipCode}<br />
                          {address.country}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other tabs would be implemented similarly */}
              {activeTab === 'payment' && (
                <div className="text-center">
                  <HandCoins className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h2 className="text-2xl mb-6">Payment Methods</h2>
                  <p className="text-gray-600">We currently support Cash on Delivery for now only.</p>
                </div>
              )}

              {['settings', 'notifications'].includes(activeTab) && (
                <div>
                  <h2 className="text-2xl mb-6">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                  <p className="text-gray-600">This section is coming soon...</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      <Modal isOpen={isAddressModalOpen} onClose={closeAddressModal} title={editingAddress ? 'Edit Address' : 'Add New Address'}>
        <AddressForm
          address={editingAddress}
          onSave={handleAddressSave}
          onCancel={closeAddressModal}
        />
      </Modal>
    </div>
  );
};




export default function AccountPage() {
  return (
    <Suspense fallback={<div>Loading account...</div>}>
      <AccountPageContent />
    </Suspense>
  );
}
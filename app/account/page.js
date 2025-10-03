'use client';
import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, User, Package, Heart, Settings, MapPin, CreditCard, Bell, LogOut, Eye } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useRouter, useSearchParams } from 'next/navigation';

const AccountPageContent = () => {
  const { user, logout } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
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
            const addresses = await response.json();
            if (addresses.length > 0) {
              const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
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
      } else {
        const errorData = await response.json();
        alert(`Failed to update profile: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('An error occurred while updating your profile.');
    }
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
                  <h2 className="text-2xl mb-6">Profile Information</h2>
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
                  <div className="mt-8">
                    <Button onClick={handleSaveChanges} className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90">
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-2xl mb-6">Order History</h2>
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-xl p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium">#{order.id}</h3>
                            <p className="text-sm text-gray-500">Placed on {formatOrderDate(order.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(order.orderStatus)}>
                              {getStatusText(order.orderStatus)}
                            </Badge>
                            <p className="text-lg font-medium mt-1">AED {order.totalAmount}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <ImageWithFallback
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-16 h-16 object-contain rounded-lg"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-gray-500">{item.brandName}</p>
                                <p className="text-sm">Qty: {item.quantity} • AED {item.price}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {order.orderStatus === 'delivered' && (
                            <Button variant="outline" size="sm">
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
                  <h2 className="text-2xl mb-6">Shipping Addresses</h2>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-xl p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge className="mb-2">Default</Badge>
                          <h3 className="font-medium">Home Address</h3>
                          <p className="text-gray-600">
                            123 Fashion Avenue<br />
                            Paris, FR 75001<br />
                            France
                          </p>
                        </div>
                        <div className="space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Remove</Button>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      Add New Address
                    </Button>
                  </div>
                </div>
              )}

              {/* Other tabs would be implemented similarly */}
              {activeTab === 'payment' && (
                <div>
                  <h2 className="text-2xl mb-6">Payment Methods</h2>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-xl p-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <CreditCard className="h-8 w-8 text-gray-400" />
                          <div>
                            <p className="font-medium">•••• •••• •••• 4242</p>
                            <p className="text-sm text-gray-500">Expires 12/26</p>
                          </div>
                        </div>
                        <div className="space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Remove</Button>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      Add New Payment Method
                    </Button>
                  </div>
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
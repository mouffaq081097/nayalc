'use client';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { 
  User, Package, Heart, Settings, MapPin, CreditCard, 
  Bell, LogOut, Eye, Mail, Phone, Cake, Lock, 
  Truck, Plus, ArrowLeft, ChevronRight, Star, Gift, 
  ShoppingBag, LayoutDashboard, Wallet, Sparkles
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Modal from '../components/Modal';
import AddressInputForm from '../components/AddressInputForm';
import AddPaymentMethodForm from '../components/AddPaymentMethodForm';
import BuyAgainSection from '../components/BuyAgainSection';
import { Elements } from '@stripe/react-stripe-js';
import getStripe from '@/lib/stripe';

const stripePromise = getStripe();

const StatCard = ({ icon: Icon, label, value, onClick, color }) => (
  <motion.button
    whileHover={{ y: -4 }}
    onClick={onClick}
    className="flex flex-col items-start p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left w-full"
  >
    <div className={`p-2 rounded-xl mb-3 ${color || 'bg-gray-100'}`}>
      <Icon className="h-5 w-5" />
    </div>
    <span className="text-sm text-gray-500 mb-1">{label}</span>
    <span className="text-xl font-bold">{value}</span>
  </motion.button>
);

const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
      <Icon className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-500 mb-6 max-w-sm">{description}</p>
    {actionText && (
      <Button onClick={onAction} className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)]">
        {actionText}
      </Button>
    )}
  </div>
);

const AccountPageContent = () => {
  const { user, logout } = useAuth();
  const { fetchWithAuth } = useAppContext();
  const { addToCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(!searchParams.get('tab') || searchParams.get('tab') === 'overview');
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [orders, setOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [buyAgainProducts, setBuyAgainProducts] = useState([]);
  const [loyaltyData, setLoyaltyData] = useState({ stats: { points: 0, tier: 'Silver', lifetimeSpend: 0 }, transactions: [] });
  
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

  const [isLoading, setIsLoading] = useState(true);

  // Initial Data Fetching
  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setProfileData({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      username: user.username || '',
      email: user.email || '',
      phone: user.phone_number || '',
      birthday: user.birthday || ''
    });

    const loadAllData = async () => {
      setIsLoading(true);
      try {
        // Fetch everything in parallel
        const [ordersRes, wishlistRes, addressesRes, buyAgainRes, loyaltyRes] = await Promise.all([
          fetchWithAuth(`/api/orders?userId=${user.id}`).then(res => res.json()).catch(() => ({ orders: [] })),
          fetchWithAuth(`/api/wishlist?userId=${user.id}`).then(res => res.json()).catch(() => ({ wishlist: [] })),
          fetchWithAuth(`/api/users/${user.id}/addresses`).then(res => res.json()).catch(() => ([])),
          fetchWithAuth(`/api/users/${user.id}/buy-again`).then(res => res.json()).catch(() => ([])),
          fetchWithAuth(`/api/users/${user.id}/loyalty`).then(res => res.json()).catch(() => ({ stats: { points: 0, tier: 'Silver', lifetimeSpend: 0 }, transactions: [] }))
        ]);

        setOrders(ordersRes.orders || []);
        setWishlistItems(wishlistRes.wishlist || []);
        setAddresses(Array.isArray(addressesRes) ? addressesRes : []);
        setBuyAgainProducts(Array.isArray(buyAgainRes) ? buyAgainRes : []);
        setLoyaltyData(loyaltyRes);
        
        if (Array.isArray(addressesRes) && addressesRes.length > 0) {
          const defaultAddr = addressesRes.find(a => a.isDefault) || addressesRes[0];
          setProfileData(prev => ({ ...prev, phone: defaultAddr.customerPhone || prev.phone }));
        }
      } catch (err) {
        console.error('Error loading account data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [user, router, fetchWithAuth]);

  // Handle Tab changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
      setShowSidebarOnMobile(false);
    } else {
      setActiveTab('overview');
      setShowSidebarOnMobile(true);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setShowSidebarOnMobile(false);
    // Update URL without refresh
    window.history.pushState(null, '', `/account?tab=${tabId}`);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleAddressSave = async (addressData) => {
    const method = editingAddress ? 'PUT' : 'POST';
    const endpoint = editingAddress
      ? `/api/users/${user.id}/addresses/${editingAddress.id}`
      : `/api/users/${user.id}/addresses`;

    try {
      const payload = {
        address_line1: addressData.addressLine1,
        apartment: addressData.apartment,
        city: addressData.city,
        country: addressData.country,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
        is_default: addressData.isDefault,
        zip_code: addressData.zipCode,
        state: addressData.state,
        customer_phone: addressData.customerPhone,
        customer_email: user.email,
        address_label: addressData.addressLabel || addressData.addressLine1
      };

      await fetchWithAuth(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      setIsAddressModalOpen(false);
      // Refresh addresses
      const res = await fetchWithAuth(`/api/users/${user.id}/addresses`).then(r => r.json());
      setAddresses(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error('Failed to save address:', error);
    }
  };

  const handleAddressRemove = async (id) => {
    if (!confirm('Remove this address?')) return;
    try {
      await fetchWithAuth(`/api/users/${user.id}/addresses/${id}`, { method: 'DELETE' });
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch (e) { console.error(e); }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'My Orders', icon: Package, count: orders.length },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, count: wishlistItems.length },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'payment', label: 'Payment Methods', icon: Wallet },
    { id: 'profile', label: 'Profile Details', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[var(--brand-pink)] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Preparing your sanctuary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-8 md:pt-12">
        <div className="grid lg:grid-cols-4 gap-8 items-start">
          
          {/* Sidebar */}
          <aside className={`${showSidebarOnMobile ? 'block' : 'hidden'} lg:block lg:col-span-1 space-y-6`}>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              {/* Profile Card Mini */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-50">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-pink)] flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate text-gray-900">{profileData.firstName} {profileData.lastName}</h3>
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                    <Star className="h-3 w-3 fill-current" />
                    <span>Lumière {loyaltyData.stats.tier}</span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${
                      activeTab === item.id
                        ? 'bg-[#FDF2F8] text-[var(--brand-pink)] font-semibold shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 transition-colors ${activeTab === item.id ? 'text-[var(--brand-pink)]' : 'group-hover:text-gray-700'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.count > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activeTab === item.id ? 'bg-[var(--brand-pink)] text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Loyalty Premium Banner */}
            <div className="relative rounded-3xl p-6 overflow-hidden group transition-all duration-500 shadow-lg hover:shadow-xl">
              {/* Background with multiple layers for depth */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from),_transparent_70%)] from-[var(--brand-pink)]/20 opacity-50"></div>
              
              {/* Animated Sparkles Background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                  animate={{ 
                    opacity: [0.2, 0.5, 0.2],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-pink)]/10 blur-3xl rounded-full" 
                />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
                    <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em]">Lumière Club</span>
                </div>
                
                <h4 className="text-xl font-bold text-white mb-2 leading-tight">
                  Unlock Exclusive <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Beauty Perks</span>
                </h4>
                
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  Earn points on every purchase and redeem for luxury gifts.
                </p>
                
                <Button 
                  onClick={() => handleTabChange('rewards')}
                  className="w-full bg-white hover:bg-amber-50 text-gray-900 font-bold rounded-2xl py-6 shadow-[0_4px_20px_rgba(255,255,255,0.1)] transition-all group-hover:scale-[1.02] active:scale-95"
                >
                  View My Benefits
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              {/* Decorative elements */}
              <Gift className="absolute -right-6 -bottom-6 h-32 w-32 text-white/5 -rotate-12 group-hover:rotate-0 transition-all duration-700 group-hover:scale-110" />
            </div>
          </aside>

          {/* Main Content Area */}
          <main className={`${!showSidebarOnMobile ? 'block' : 'hidden'} lg:block lg:col-span-3`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                {/* Mobile Back Button */}
                {!showSidebarOnMobile && (
                  <button 
                    onClick={() => setShowSidebarOnMobile(true)}
                    className="lg:hidden flex items-center text-gray-500 mb-4 font-medium"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Menu
                  </button>
                )}

                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* Welcome Banner */}
                    <div className="relative rounded-3xl bg-white p-8 border border-gray-100 shadow-sm overflow-hidden">
                       <div className="relative z-10 md:flex justify-between items-center">
                          <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                              Welcome back, {profileData.firstName}!
                            </h1>
                            <p className="text-gray-500">
                              Member since {user?.createdAt ? formatDate(user.createdAt) : '2025'}
                            </p>
                          </div>
                          <div className="mt-4 md:mt-0 flex gap-3">
                            <Button onClick={() => handleTabChange('profile')} variant="outline" className="rounded-xl">Edit Profile</Button>
                            <Button onClick={() => router.push('/all-products')} className="bg-black text-white rounded-xl">Continue Shopping</Button>
                          </div>
                       </div>
                    </div>

                    {/* Dashboard Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard icon={Package} label="Total Orders" value={orders.length} onClick={() => handleTabChange('orders')} color="bg-blue-50 text-blue-600" />
                      <StatCard icon={Heart} label="Wishlist" value={wishlistItems.length} onClick={() => handleTabChange('wishlist')} color="bg-pink-50 text-pink-600" />
                      <StatCard icon={Star} label="Points" value={loyaltyData.stats.points.toLocaleString()} onClick={() => handleTabChange('rewards')} color="bg-amber-50 text-amber-600" />
                      <StatCard icon={MapPin} label="Addresses" value={addresses.length} onClick={() => handleTabChange('addresses')} color="bg-indigo-50 text-indigo-600" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Recent Orders Card */}
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-lg">Recent Orders</h3>
                          <button onClick={() => handleTabChange('orders')} className="text-[var(--brand-pink)] text-sm font-semibold flex items-center">
                            See all <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                        {orders.length > 0 ? (
                          <div className="space-y-4">
                            {orders.slice(0, 3).map(order => (
                              <div key={order.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-sm">Order #{order.id}</p>
                                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                                  </div>
                                </div>
                                <Badge className={`${getStatusColor(order.orderStatus)} text-[10px]`}>
                                  {order.orderStatus}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-400 text-sm">No orders yet</div>
                        )}
                      </div>

                      {/* Default Address Card */}
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-lg">Primary Address</h3>
                          <button onClick={() => handleTabChange('addresses')} className="text-[var(--brand-pink)] text-sm font-semibold flex items-center">
                            Manage <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                        {addresses.length > 0 ? (
                          <div className="p-4 bg-gray-50 rounded-2xl">
                            <div className="flex items-center gap-3 mb-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="font-semibold text-sm">{addresses.find(a => a.isDefault)?.addressLabel || addresses[0].addressLabel}</span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed ml-7">
                              {(addresses.find(a => a.isDefault)?.addressLine1 || addresses.find(a => a.isDefault)?.shippingAddress || addresses[0].addressLine1 || addresses[0].shippingAddress)}<br />
                              {addresses.find(a => a.isDefault)?.city || addresses[0].city}, {addresses.find(a => a.isDefault)?.country || addresses[0].country}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-400 text-sm">No addresses saved</div>
                        )}
                      </div>
                    </div>

                    {/* Buy Again Section */}
                    {buyAgainProducts.length > 0 && (
                      <BuyAgainSection products={buyAgainProducts} />
                    )}
                  </div>
                )}

                {/* --- ORDERS TAB --- */}
                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <h2 className="text-2xl font-bold">Order History</h2>
                      <div className="flex gap-2">
                        <Input placeholder="Search orders..." className="max-w-[200px] rounded-xl bg-white" />
                        <Button variant="outline" className="rounded-xl"><Settings className="h-4 w-4 mr-2" /> Filters</Button>
                      </div>
                    </div>

                    {orders.length > 0 ? (
                      <div className="grid gap-6">
                        {orders.map((order) => (
                          <motion.div 
                            key={order.id} 
                            whileHover={{ y: -2 }}
                            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
                          >
                            <div className="p-6 md:flex items-center justify-between gap-6">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
                                   <Package className="h-8 w-8 text-gray-300" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-lg">Order #{order.id}</h3>
                                    <Badge className={getStatusColor(order.orderStatus)}>{order.orderStatus}</Badge>
                                  </div>
                                  <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)} • {order.items?.length || 0} items</p>
                                </div>
                              </div>
                              
                              <div className="mt-4 md:mt-0 text-right shrink-0">
                                <p className="text-xl font-bold text-gray-900 mb-2">AED {order.totalAmount}</p>
                                <div className="flex gap-2 justify-end">
                                  <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => router.push(`/orders/${order.id}`)}>View Details</Button>
                                  <Button className="bg-black text-white rounded-xl" size="sm" onClick={() => router.push(`/orders/${order.id}`)}>Track</Button>
                                </div>
                              </div>
                            </div>
                            {/* Simple Product List in Card */}
                            <div className="px-6 pb-6 flex gap-2 overflow-x-auto no-scrollbar">
                               {order.items?.map((item, idx) => (
                                 <div key={idx} className="shrink-0 w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 p-1">
                                   <ImageWithFallback src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                                 </div>
                               ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState 
                        icon={Package} 
                        title="No orders yet" 
                        description="When you place an order, it will appear here. Start your beauty journey today!"
                        actionText="Shop New Arrivals"
                        onAction={() => router.push('/new-arrivals')}
                      />
                    )}
                  </div>
                )}

                {/* --- WISHLIST TAB --- */}
                {activeTab === 'wishlist' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Wishlist</h2>
                    {wishlistItems.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {wishlistItems.map((item) => (
                          <div key={item.productId} className="group bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <div className="relative aspect-square mb-4 bg-gray-50 rounded-2xl overflow-hidden">
                              <ImageWithFallback src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                              <button 
                                className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-md rounded-full text-red-500 hover:bg-red-50 transition-colors"
                                onClick={() => {/* handle remove */}}
                              >
                                <Heart className="h-4 w-4 fill-current" />
                              </button>
                            </div>
                            <h3 className="font-bold text-sm truncate">{item.name}</h3>
                            <p className="text-xs text-gray-500 mb-3">{item.brandName}</p>
                            <div className="flex items-center justify-between mt-auto">
                              <span className="font-bold text-gray-900">AED {item.price}</span>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="rounded-full h-8 w-8 p-0 border-[var(--brand-pink)] text-[var(--brand-pink)] hover:bg-[var(--brand-pink)] hover:text-white"
                                onClick={() => addToCart({ product: item, quantity: 1 })}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState 
                        icon={Heart} 
                        title="Your wishlist is empty" 
                        description="Save items you love and they will appear here."
                        actionText="Explore Collections"
                        onAction={() => router.push('/collections')}
                      />
                    )}
                  </div>
                )}

                {/* --- ADDRESSES TAB --- */}
                {activeTab === 'addresses' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold">Shipping Addresses</h2>
                      <Button onClick={() => { setEditingAddress(null); setIsAddressModalOpen(true); }} className="bg-black text-white rounded-xl">
                        <Plus className="h-4 w-4 mr-2" /> Add New
                      </Button>
                    </div>
                    {addresses.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-6">
                        {addresses.map((addr) => (
                          <div key={addr.id} className={`p-6 rounded-3xl border-2 transition-all ${addr.isDefault ? 'border-[var(--brand-pink)] bg-pink-50/20' : 'border-gray-100 bg-white'}`}>
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-xl ${addr.isDefault ? 'bg-[var(--brand-pink)] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                  <MapPin className="h-4 w-4" />
                                </div>
                                <h3 className="font-bold">{addr.addressLabel || 'Address'}</h3>
                              </div>
                              {addr.isDefault && <Badge className="bg-[var(--brand-pink)] text-white text-[10px] uppercase">Default</Badge>}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed mb-6">
                              {addr.addressLine1 || addr.shippingAddress}<br />
                              {addr.apartment && `${addr.apartment}, `}{addr.city}, {addr.state && `${addr.state}, `}{addr.zipCode}<br />
                              {addr.country}
                            </p>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" className="flex-1 rounded-xl text-xs" onClick={() => { setEditingAddress(addr); setIsAddressModalOpen(true); }}>Edit</Button>
                              <Button variant="ghost" size="sm" className="flex-1 rounded-xl text-xs text-red-500 hover:text-red-600" onClick={() => handleAddressRemove(addr.id)}>Remove</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={MapPin} title="No addresses saved" description="Add a shipping address for faster checkout." />
                    )}
                  </div>
                )}

                {/* --- PROFILE TAB --- */}
                {activeTab === 'profile' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold">Profile Details</h2>
                      <Button variant={isEditMode ? 'outline' : 'default'} onClick={() => setIsEditMode(!isEditMode)} className={!isEditMode ? 'bg-black text-white rounded-xl' : 'rounded-xl'}>
                         {isEditMode ? 'Cancel' : 'Edit Profile'}
                      </Button>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Profile Photo Placeholder */}
                        <div className="flex flex-col items-center gap-3">
                           <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-pink)] p-1">
                              <div className="w-full h-full rounded-[20px] bg-white flex items-center justify-center text-4xl font-bold text-gray-200">
                                {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                              </div>
                           </div>
                           <button className="text-[var(--brand-pink)] text-xs font-bold hover:underline">Change Photo</button>
                        </div>

                        <div className="flex-1 grid md:grid-cols-2 gap-6 w-full">
                           <div className="space-y-2">
                              <Label className="text-xs text-gray-400 font-bold uppercase">First Name</Label>
                              {isEditMode ? <Input value={profileData.firstName} onChange={e => setProfileData(p => ({...p, firstName: e.target.value}))} /> : <p className="font-semibold text-gray-900">{profileData.firstName}</p>}
                           </div>
                           <div className="space-y-2">
                              <Label className="text-xs text-gray-400 font-bold uppercase">Last Name</Label>
                              {isEditMode ? <Input value={profileData.lastName} onChange={e => setProfileData(p => ({...p, lastName: e.target.value}))} /> : <p className="font-semibold text-gray-900">{profileData.lastName}</p>}
                           </div>
                           <div className="space-y-2">
                              <Label className="text-xs text-gray-400 font-bold uppercase">Email</Label>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">{profileData.email}</p>
                                <Badge className="bg-green-50 text-green-700 border-none font-bold text-[10px]">Verified</Badge>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <Label className="text-xs text-gray-400 font-bold uppercase">Phone Number</Label>
                              {isEditMode ? <Input value={profileData.phone} onChange={e => setProfileData(p => ({...p, phone: e.target.value}))} /> : <p className="font-semibold text-gray-900">{profileData.phone || 'Not added'}</p>}
                           </div>
                           <div className="space-y-2">
                              <Label className="text-xs text-gray-400 font-bold uppercase">Birthday</Label>
                              {isEditMode ? <Input type="date" value={profileData.birthday} onChange={e => setProfileData(p => ({...p, birthday: e.target.value}))} /> : <p className="font-semibold text-gray-900">{profileData.birthday || 'Not added'}</p>}
                           </div>
                        </div>
                      </div>

                      {isEditMode && (
                        <div className="mt-8 pt-6 border-t border-gray-50 flex justify-end gap-3">
                           <Button variant="outline" className="rounded-xl" onClick={() => setIsEditMode(false)}>Discard</Button>
                           <Button className="bg-black text-white rounded-xl">Save Changes</Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- PAYMENT TAB --- */}
                {activeTab === 'payment' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Payment Methods</h2>
                    {paymentMethods.length > 0 ? (
                      <div className="grid gap-4">
                        {paymentMethods.map((method) => (
                          <div key={method.id} className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-[10px] font-bold text-gray-400">
                                   {method.card.brand.toUpperCase()}
                                </div>
                                <div>
                                   <p className="font-bold text-gray-900">•••• •••• •••• {method.card.last4}</p>
                                   <p className="text-xs text-gray-500">Expires {method.card.exp_month}/{method.card.exp_year}</p>
                                </div>
                             </div>
                             <Button variant="ghost" className="text-red-500 hover:text-red-600 rounded-xl">Remove</Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={Wallet} title="No payment methods" description="Add a payment method for a smoother checkout experience." />
                    )}
                    <div className="mt-6 pt-6 border-t border-gray-50">
                       <h3 className="font-bold mb-4">Add New Method</h3>
                       <AddPaymentMethodForm onSuccess={() => {}} />
                    </div>
                  </div>
                )}

                {/* --- REWARDS TAB --- */}
                {activeTab === 'rewards' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold">Lumière Prestige</h2>
                      <Badge className="bg-amber-100 text-amber-700 border-none px-4 py-1.5 rounded-full font-bold">
                        {loyaltyData.stats.tier} Member
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Points Balance */}
                      <div className="md:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden">
                        <div className="relative z-10">
                          <p className="text-gray-400 font-medium mb-2">Available Balance</p>
                          <div className="flex items-end gap-3 mb-8">
                            <span className="text-5xl font-black">{loyaltyData.stats.points.toLocaleString()}</span>
                            <span className="text-amber-400 font-bold mb-1 tracking-widest">POINTS</span>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Progress to Gold</span>
                              <span className="text-white font-bold">{Math.min(Math.round((loyaltyData.stats.lifetimeSpend / 2000) * 100), 100)}%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((loyaltyData.stats.lifetimeSpend / 2000) * 100), 100}%` }}
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-200"
                              />
                            </div>
                            <p className="text-xs text-gray-500 italic">Spend AED {(2000 - loyaltyData.stats.lifetimeSpend).toFixed(2)} more to reach Gold status</p>
                          </div>
                        </div>
                        <Star className="absolute -right-8 -top-8 h-48 w-48 text-white/5 rotate-12" />
                      </div>

                      {/* Quick Info */}
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold mb-4">How to earn?</h3>
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <ShoppingBag className="h-4 w-4" />
                              </div>
                              <p className="text-xs text-gray-600">1 Point per 1 AED spent</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                                <Heart className="h-4 w-4" />
                              </div>
                              <p className="text-xs text-gray-600">50 Points for every review</p>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full rounded-xl mt-6">View All Rules</Button>
                      </div>
                    </div>

                    {/* Transaction History */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-50">
                        <h3 className="font-bold">Transaction History</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Description</th>
                              <th className="px-6 py-4">Type</th>
                              <th className="px-6 py-4 text-right">Points</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {loyaltyData.transactions.map((t) => (
                              <tr key={t.id} className="text-sm hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-gray-500">{formatDate(t.createdAt)}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{t.description}</td>
                                <td className="px-6 py-4 capitalize">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    t.type === 'earn' ? 'bg-green-50 text-green-600' : 
                                    t.type === 'redeem' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                  }`}>
                                    {t.type}
                                  </span>
                                </td>
                                <td className={`px-6 py-4 text-right font-black ${t.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {t.points > 0 ? '+' : ''}{t.points}
                                </td>
                              </tr>
                            ))}
                            {loyaltyData.transactions.length === 0 && (
                              <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">No transactions found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- PLACEHOLDERS --- */}
                {['notifications', 'settings'].includes(activeTab) && (
                  <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm text-center">
                    <h2 className="text-2xl font-bold mb-2 capitalize">{activeTab}</h2>
                    <p className="text-gray-500">We're refining this experience. Stay tuned!</p>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <Modal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} title={editingAddress ? 'Edit Address' : 'Add New Address'}>
        <AddressInputForm
          initialData={editingAddress}
          onSave={handleAddressSave}
          onCancel={() => setIsAddressModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Account...</div>}>
      <Elements stripe={stripePromise}>
        <AccountPageContent />
      </Elements>
    </Suspense>
  );
}
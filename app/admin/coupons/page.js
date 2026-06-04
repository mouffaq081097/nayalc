'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Search, Calendar, Percent, DollarSign, Edit, Trash2, PlusCircle, Loader2, MoreHorizontal, Ticket, ShieldCheck, Zap, Clock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Modal from '@/app/components/Modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState({
    id: null,
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    expiration_date: '',
    usage_limit: '',
    minimum_purchase_amount: '',
    is_active: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New state variables for the orders modal
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [selectedCouponOrders, setSelectedCouponOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedCouponCode, setSelectedCouponCode] = useState('');

  const fetchCoupons = useCallback(async () => {
    try {
      const response = await fetch('/api/coupons');
      if (!response.ok) {
        throw new Error('Failed to fetch coupons');
      }
      const data = await response.json();
      setCoupons(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentCoupon(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setCurrentCoupon(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditMode(false);
    setCurrentCoupon({
      id: null,
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      expiration_date: '',
      usage_limit: '',
      minimum_purchase_amount: '',
      is_active: true,
    });
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const url = editMode ? `/api/coupons/${currentCoupon.id}` : '/api/coupons';
    const method = editMode ? 'PUT' : 'POST';

    const couponData = {
        ...currentCoupon,
        discount_value: parseFloat(currentCoupon.discount_value) || 0,
        usage_limit: currentCoupon.usage_limit ? parseInt(currentCoupon.usage_limit, 10) : null,
        minimum_purchase_amount: currentCoupon.minimum_purchase_amount ? parseFloat(currentCoupon.minimum_purchase_amount) : null,
        expiration_date: currentCoupon.expiration_date ? new Date(currentCoupon.expiration_date).toISOString() : null,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editMode ? 'update' : 'add'} coupon`);
      }

      await fetchCoupons();
      resetForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (coupon) => {
    setEditMode(true);
    setCurrentCoupon({
        ...coupon,
        expiration_date: coupon.expiration_date ? new Date(coupon.expiration_date).toISOString().substring(0, 10) : '',
        discount_value: coupon.discount_value || '',
        usage_limit: coupon.usage_limit || '',
        minimum_purchase_amount: coupon.minimum_purchase_amount || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this privilege code? This cannot be undone.')) {
      try {
        const response = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error('Failed to delete coupon');
        }
        await fetchCoupons();
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      const response = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      });
      if (!response.ok) throw new Error('Failed to toggle coupon status');
      await fetchCoupons();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleViewOrders = async (coupon) => {
    setIsOrdersModalOpen(true);
    setIsLoadingOrders(true);
    setSelectedCouponCode(coupon.code);
    try {
      const response = await fetch(`/api/coupons/${coupon.id}/orders`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders for coupon');
      }
      const data = await response.json();
      setSelectedCouponOrders(data);
    } catch (err) {
      console.error(err);
      setSelectedCouponOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };
  
  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-400">Loading coupons...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold" style={{ color: '#3b0764' }}>Coupons</h2>
                <p className="text-sm text-gray-400 mt-0.5">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''} total</p>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-grow sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                    <input
                        type="text"
                        placeholder="Search by code..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="cl-gradient-btn gap-2 px-5 py-2.5 text-[11px] active:scale-[0.98] whitespace-nowrap"
                >
                    <PlusCircle size={15} /> Add Coupon
                </button>
            </div>
        </div>

        {/* Coupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence>
                {filteredCoupons.map(coupon => (
                    <motion.div
                        key={coupon.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group relative bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col ${!coupon.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}
                        style={{ borderColor: 'rgba(216,180,254,0.35)' }}
                    >
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 p-6 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity">
                            {coupon.discount_type === 'percentage' ? <Percent size={96} /> : <DollarSign size={96} />}
                        </div>

                        <div className="p-6 space-y-4 flex-grow relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${coupon.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                        <p className="text-[10px] font-semibold text-gray-400">
                                            {coupon.is_active ? 'Active' : 'Inactive'}
                                        </p>
                                    </div>
                                    <h3 className="text-3xl font-black text-gray-900">{coupon.code}</h3>
                                </div>
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="w-10 h-10 rounded-xl hover:bg-gray-50 border border-gray-50 flex items-center justify-center transition-all">
                                            <MoreHorizontal className="h-5 w-5 text-gray-300" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border-gray-100 p-2">
                                        <DropdownMenuItem onClick={() => handleEdit(coupon)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3">
                                            <Edit size={16} className="text-cl-purple" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleToggleActive(coupon)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3">
                                            {coupon.is_active ? (
                                                <><EyeOff size={16} className="text-orange-500" /> Deactivate</>
                                            ) : (
                                                <><Eye size={16} className="text-green-500" /> Activate</>
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleViewOrders(coupon)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3">
                                            <Ticket size={16} className="text-gray-600" /> View Orders
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(coupon.id)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3 text-red-600">
                                            <Trash2 size={16} /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black" style={{ color: '#9333ea' }}>
                                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `AED ${coupon.discount_value}`}
                                </span>
                                <span className="text-[10px] font-medium text-gray-400">off</span>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-3">
                                    <Calendar size={14} className="text-gray-300" />
                                    <span className="text-xs font-medium text-gray-500 italic">
                                        Expires {coupon.expiration_date ? new Date(coupon.expiration_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Indefinite'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Zap size={14} className="text-gray-300" />
                                    <span className="text-xs font-medium text-gray-500 italic">
                                        Min. Order: {coupon.minimum_purchase_amount ? `AED ${coupon.minimum_purchase_amount}` : 'No minimum'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Ticket size={14} className="text-cl-purple-light" />
                                    <span className="text-xs font-bold text-cl-purple italic">
                                        Orders Used: {coupon.actual_order_count || 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto bg-gray-50/40 p-4 border-t border-gray-50 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[9px] font-medium text-gray-400">Usage</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-cl-purple rounded-full" 
                                            style={{ width: coupon.usage_limit ? `${((coupon.actual_order_count || 0) / coupon.usage_limit) * 100}%` : '5%' }}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-900">{coupon.actual_order_count || 0} / {coupon.usage_limit || '∞'}</span>
                                </div>
                            </div>
                            <button onClick={() => handleEdit(coupon)} className="p-2 text-gray-300 hover:text-cl-purple transition-colors">
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>

        {filteredCoupons.length === 0 && (
            <div className="min-h-[280px] bg-white rounded-2xl border border-dashed border-purple-100 flex flex-col items-center justify-center gap-3">
                <Ticket size={36} className="text-purple-200" />
                <p className="text-sm font-medium text-gray-400">{searchTerm ? 'No coupons match your search.' : 'No coupons yet.'}</p>
            </div>
        )}

        {/* Modal Redesign */}
        <Modal
            isOpen={isModalOpen}
            onClose={resetForm}
            title={editMode ? 'Edit Coupon' : 'Add Coupon'}
            size="max-w-4xl"
            noBodyPadding
        >
            <form onSubmit={handleSubmit} className="p-6 lg:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-5">
                            <h3 className="text-xs font-semibold text-purple-600 flex items-center gap-3">
                                <span className="w-8 h-px bg-purple-200"></span>
                                Coupon details
                            </h3>

                            <div className="group">
                                <label htmlFor="code" className="block text-xs font-medium text-purple-400 mb-2 transition-colors group-focus-within:text-purple-600">Coupon code</label>
                                <input
                                    id="code" name="code" value={currentCoupon.code} onChange={handleInputChange}
                                    placeholder="e.g., SUMMER2025"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-900 focus:bg-white focus:border-purple-300 focus:outline-none transition-all text-lg"
                                    required disabled={isSubmitting}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="group">
                                    <label htmlFor="discount_type" className="block text-xs font-medium text-purple-400 mb-2">Discount type</label>
                                    <Select name="discount_type" value={currentCoupon.discount_type} onValueChange={(value) => handleSelectChange('discount_type', value)}>
                                        <SelectTrigger className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 h-auto font-medium text-gray-900 focus:bg-white transition-all">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-gray-100">
                                            <SelectItem value="percentage" className="rounded-lg px-3 py-2.5">Percentage (%)</SelectItem>
                                            <SelectItem value="fixed_amount" className="rounded-lg px-3 py-2.5">Fixed amount (AED)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="group">
                                    <label htmlFor="discount_value" className="block text-xs font-medium text-purple-400 mb-2">Discount value</label>
                                    <input
                                        id="discount_value" name="discount_value" type="number" step="0.01" value={currentCoupon.discount_value} onChange={handleInputChange}
                                        placeholder={currentCoupon.discount_type === 'percentage' ? 'e.g., 15' : 'e.g., 50'}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-900 focus:bg-white focus:border-purple-300 focus:outline-none transition-all"
                                        required disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100/40">
                                <div className="flex items-center gap-2.5 mb-4 text-purple-600">
                                    <ShieldCheck size={16} />
                                    <span className="text-xs font-semibold">Status</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500 font-medium">Is this coupon currently active?</p>
                                    <div className="flex items-center gap-3">
                                        <Checkbox 
                                            id="is_active" checked={currentCoupon.is_active} 
                                            onCheckedChange={(checked) => handleSelectChange('is_active', checked)} 
                                            className="w-6 h-6 rounded-lg border-2 border-indigo-200 data-[state=checked]:bg-cl-purple data-[state=checked]:border-cl-purple"
                                        />
                                        <Label htmlFor="is_active" className="text-[11px] font-black   text-gray-900 cursor-pointer">Active</Label>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-5">
                            <h3 className="text-xs font-semibold text-purple-600 flex items-center gap-3">
                                <span className="w-8 h-px bg-purple-200"></span>
                                Configuration
                            </h3>

                            <div className="group">
                                <label htmlFor="expiration_date" className="block text-xs font-medium text-purple-400 mb-2">Expiration date</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                                    <input
                                        id="expiration_date" name="expiration_date" type="date" value={currentCoupon.expiration_date} onChange={handleInputChange}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 font-medium text-gray-700 focus:bg-white focus:border-purple-300 focus:outline-none transition-all cursor-pointer"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label htmlFor="usage_limit" className="block text-xs font-medium text-purple-400 mb-2">Usage limit</label>
                                <input
                                    id="usage_limit" name="usage_limit" type="number" value={currentCoupon.usage_limit} onChange={handleInputChange}
                                    placeholder="Leave blank for unlimited"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-medium text-gray-900 focus:bg-white focus:border-purple-300 focus:outline-none transition-all"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="group">
                                <label htmlFor="minimum_purchase_amount" className="block text-xs font-medium text-purple-400 mb-2">Minimum order (AED)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                                    <input
                                        id="minimum_purchase_amount" name="minimum_purchase_amount" type="number" step="0.01" value={currentCoupon.minimum_purchase_amount} onChange={handleInputChange}
                                        placeholder="No minimum"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 font-medium text-gray-900 focus:bg-white focus:border-purple-300 focus:outline-none transition-all"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="cl-gradient-btn gap-2 px-6 py-2.5 text-[11px] active:scale-[0.98] disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                editMode ? 'Update coupon' : 'Add coupon'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Orders Modal */}
            <Modal
                isOpen={isOrdersModalOpen}
                onClose={() => setIsOrdersModalOpen(false)}
                title={`Orders using ${selectedCouponCode}`}
                size="max-w-4xl"
            >
                <div className="p-6">
                    {isLoadingOrders ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-cl-purple border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : selectedCouponOrders.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-xs  font-black text-gray-500 ">
                                    <tr>
                                        <th className="px-6 py-4">Order ID</th>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {selectedCouponOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 truncate max-w-[120px]">
                                                {order.id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-900 font-medium">{order.user_name || 'Guest'}</div>
                                                <div className="text-gray-500 text-xs">{order.user_email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black   ${
                                                    order.order_status?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-700' :
                                                    order.order_status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {order.order_status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                                                AED {parseFloat(order.total_amount).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <Ticket size={48} className="mb-4 opacity-20" />
                            <p>No orders have used this privilege code yet.</p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default CouponsPage;

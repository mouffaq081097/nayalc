'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Search, Tag, Calendar, Percent, DollarSign, Edit, Trash2, PlusCircle, Loader2, MoreHorizontal, Ticket, ShieldCheck, Zap, Info, Clock, ArrowRight } from 'lucide-react';
import Modal from '@/app/components/Modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const fetchCoupons = useCallback(async () => {
    try {
      const response = await fetch('/api/coupons');
      if (!response.ok) {
        throw new Error('Failed to fetch coupons');
      }
      const data = await response.json();
      setCoupons(data);
    } catch (err) {
      setError(err.message);
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
      setError(err.message);
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
        setError(err.message);
      }
    }
  };
  
  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Validating Privileges...</p>
        </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Privilege Registry</h2>
                <p className="text-sm text-gray-400 mt-1">Managing {coupons.length} promotional vectors for the Naya Lumière market</p>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="relative flex-grow md:w-64">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by code..."
                        className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <Button 
                    onClick={() => setIsModalOpen(true)} 
                    className="bg-gray-900 hover:bg-indigo-600 text-white rounded-xl px-6 py-6 text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> Issue New Privilege
                </Button>
            </div>
        </div>

        {/* Coupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
                {filteredCoupons.map(coupon => (
                    <motion.div 
                        key={coupon.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group relative bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col ${!coupon.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}
                    >
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            {coupon.discount_type === 'percentage' ? <Percent size={120} /> : <DollarSign size={120} />}
                        </div>

                        <div className="p-8 space-y-6 flex-grow relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${coupon.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {coupon.is_active ? 'Active Privilege' : 'Deactivated'}
                                        </p>
                                    </div>
                                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{coupon.code}</h3>
                                </div>
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="w-10 h-10 rounded-xl hover:bg-gray-50 border border-gray-50 flex items-center justify-center transition-all">
                                            <MoreHorizontal className="h-5 w-5 text-gray-300" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border-gray-100 p-2">
                                        <DropdownMenuItem onClick={() => handleEdit(coupon)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3">
                                            <Edit size={16} className="text-indigo-600" /> Refine Parameters
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(coupon.id)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3 text-red-600">
                                            <Trash2 size={16} /> Revoke Privilege
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-indigo-600 tracking-tighter">
                                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `AED ${coupon.discount_value}`}
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reduction</span>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-gray-50">
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
                            </div>
                        </div>

                        <div className="mt-auto bg-gray-50/50 p-6 border-t border-gray-50 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Usage Quota</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-500 rounded-full" 
                                            style={{ width: coupon.usage_limit ? `${(coupon.usage_count / coupon.usage_limit) * 100}%` : '5%' }}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-900">{coupon.usage_count} / {coupon.usage_limit || '∞'}</span>
                                </div>
                            </div>
                            <button onClick={() => handleEdit(coupon)} className="p-2 text-gray-300 hover:text-indigo-600 transition-colors">
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>

        {filteredCoupons.length === 0 && (
            <div className="min-h-[300px] bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
                <Ticket size={40} className="text-gray-200" />
                <p className="text-lg font-medium text-gray-400 italic">No privilege codes match your current parameters.</p>
            </div>
        )}

        {/* Modal Redesign */}
        <Modal 
            isOpen={isModalOpen} 
            onClose={resetForm} 
            title={editMode ? 'Refine Privilege Parameters' : 'Issue New Privilege'}
            size="max-w-4xl"
            noBodyPadding
        >
            <form onSubmit={handleSubmit} className="p-10 lg:p-14">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="space-y-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-2 flex items-center gap-3">
                                <span className="w-10 h-px bg-indigo-600/20"></span>
                                Core Registry
                            </h3>
                            
                            <div className="group">
                                <label htmlFor="code" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 transition-colors group-focus-within:text-indigo-600">Privilege Code</label>
                                <input 
                                    id="code" name="code" value={currentCoupon.code} onChange={handleInputChange} 
                                    placeholder="e.g., ROYALTY2025"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-black text-gray-900 focus:bg-white transition-all text-xl uppercase tracking-tighter shadow-inner"
                                    required disabled={isSubmitting} 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="group">
                                    <label htmlFor="discount_type" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Reduction Mechanism</label>
                                    <Select name="discount_type" value={currentCoupon.discount_type} onValueChange={(value) => handleSelectChange('discount_type', value)}>
                                        <SelectTrigger className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 h-auto font-bold text-gray-900 focus:bg-white transition-all">
                                            <SelectValue placeholder="Mechanism" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl shadow-2xl border-gray-100">
                                            <SelectItem value="percentage" className="rounded-xl px-4 py-3">Percentage (%)</SelectItem>
                                            <SelectItem value="fixed_amount" className="rounded-xl px-4 py-3">Fixed Amount (AED)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="group">
                                    <label htmlFor="discount_value" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Quantum Value</label>
                                    <input
                                        id="discount_value" name="discount_value" type="number" step="0.01" value={currentCoupon.discount_value} onChange={handleInputChange}
                                        placeholder={currentCoupon.discount_type === 'percentage' ? 'e.g., 15' : 'e.g., 50'}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-black text-gray-900 focus:bg-white transition-all shadow-inner"
                                        required disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100/30">
                                <div className="flex items-center gap-3 mb-4 text-indigo-600">
                                    <ShieldCheck size={18} />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Protocol Verification</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] text-gray-500 font-medium italic">Is this privilege currently active in the ecosystem?</p>
                                    <div className="flex items-center gap-3">
                                        <Checkbox 
                                            id="is_active" checked={currentCoupon.is_active} 
                                            onCheckedChange={(checked) => handleSelectChange('is_active', checked)} 
                                            className="w-6 h-6 rounded-lg border-2 border-indigo-200 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                        />
                                        <Label htmlFor="is_active" className="text-[11px] font-black uppercase tracking-widest text-gray-900 cursor-pointer">Active</Label>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-2 flex items-center gap-3">
                                <span className="w-10 h-px bg-indigo-600/20"></span>
                                Logistics & Scope
                            </h3>
                            
                            <div className="group">
                                <label htmlFor="expiration_date" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Void Threshold (Expiration)</label>
                                <div className="relative">
                                    <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <input 
                                        id="expiration_date" name="expiration_date" type="date" value={currentCoupon.expiration_date} onChange={handleInputChange} 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-16 pr-6 py-4 font-bold text-gray-600 focus:bg-white transition-all cursor-pointer"
                                        disabled={isSubmitting} 
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label htmlFor="usage_limit" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Activation Quota (Usage Limit)</label>
                                <input 
                                    id="usage_limit" name="usage_limit" type="number" value={currentCoupon.usage_limit} onChange={handleInputChange} 
                                    placeholder="Indefinite activation if blank"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-900 focus:bg-white transition-all shadow-inner"
                                    disabled={isSubmitting} 
                                />
                            </div>

                            <div className="group">
                                <label htmlFor="minimum_purchase_amount" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Transaction Minimum (AED)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <input 
                                        id="minimum_purchase_amount" name="minimum_purchase_amount" type="number" step="0.01" value={currentCoupon.minimum_purchase_amount} onChange={handleInputChange} 
                                        placeholder="No transaction limit if blank"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-16 pr-6 py-4 font-bold text-gray-900 focus:bg-white transition-all shadow-inner"
                                        disabled={isSubmitting} 
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="mt-12 pt-10 border-t border-gray-50 flex justify-end gap-6">
                        <button 
                            type="button" 
                            onClick={resetForm} 
                            className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                            disabled={isSubmitting}
                        >
                            Retract Request
                        </button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="px-10 py-6 bg-indigo-600 hover:bg-gray-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                    <span>Synchronizing...</span>
                                </>
                            ) : (
                                editMode ? 'Update Privilege' : 'Issue Privilege'
                            )}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CouponsPage;
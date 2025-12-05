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
import { Search, Tag, Calendar, Percent, DollarSign, Edit, Trash2, PlusCircle, Loader2, MoreHorizontal } from 'lucide-react';
import Modal from '@/app/components/Modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';

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
    if (window.confirm('Are you sure you want to delete this coupon?')) {
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
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
        </div>
    );
  }

  if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>;

  return (
    <div>
        <Modal isOpen={isModalOpen} onClose={resetForm} title={editMode ? 'Edit Coupon' : 'Add New Coupon'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <fieldset disabled={isSubmitting} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="code">Coupon Code</Label>
                        <Input id="code" name="code" value={currentCoupon.code} onChange={handleInputChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <Label htmlFor="discount_type">Discount Type</Label>
                        <Select name="discount_type" value={currentCoupon.discount_type} onValueChange={(value) => handleSelectChange('discount_type', value)}>
                            <SelectTrigger className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="discount_value">
                            {currentCoupon.discount_type === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                        </Label>
                        <Input
                            id="discount_value"
                            name="discount_value"
                            type="number"
                            step="0.01"
                            value={currentCoupon.discount_value}
                            onChange={handleInputChange}
                            required
                            placeholder={currentCoupon.discount_type === 'percentage' ? 'e.g., 10 (for 10%)' : 'e.g., 10 (for 10 AED)'}
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <Label htmlFor="expiration_date">Expiration Date</Label>
                        <Input id="expiration_date" name="expiration_date" type="date" value={currentCoupon.expiration_date} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <Label htmlFor="usage_limit">Usage Limit</Label>
                        <Input id="usage_limit" name="usage_limit" type="number" value={currentCoupon.usage_limit} onChange={handleInputChange} placeholder="Leave blank for no limit" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <Label htmlFor="minimum_purchase_amount">Minimum Purchase Amount</Label>
                        <Input id="minimum_purchase_amount" name="minimum_purchase_amount" type="number" step="0.01" value={currentCoupon.minimum_purchase_amount} onChange={handleInputChange} placeholder="Leave blank for no minimum" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="flex items-center pt-6 space-x-2">
                        <Checkbox id="is_active" name="is_active" checked={currentCoupon.is_active} onCheckedChange={(checked) => handleSelectChange('is_active', checked)} />
                        <Label htmlFor="is_active">Active</Label>
                    </div>
                </fieldset>
                <div className="mt-6 flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting} className="px-6 py-3">Cancel</Button>
                    <Button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            editMode ? 'Update Coupon' : 'Add Coupon'
                        )}
                    </Button>
                </div>
            </form>
        </Modal>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
                type="text"
                placeholder="Search by code..."
                className="pl-10 pr-4 py-2 border rounded-full w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Coupon
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredCoupons.map(coupon => (
            <div key={coupon.id} className={`bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ${!coupon.is_active ? 'opacity-60' : ''}`}>
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                             <div className="bg-indigo-100 p-3 rounded-full">
                                <Tag className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{coupon.code}</p>
                                <p className={`text-sm font-semibold ${coupon.is_active ? 'text-green-500' : 'text-red-500'}`}>
                                    {coupon.is_active ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleEdit(coupon)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDelete(coupon.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    
                    <div className="mt-6 space-y-3 text-gray-700">
                        <div className="flex items-center">
                            {coupon.discount_type === 'percentage' ? <Percent className="h-5 w-5 mr-3 text-gray-400" /> : <DollarSign className="h-5 w-5 mr-3 text-gray-400" />}
                            <span>{coupon.discount_value}{coupon.discount_type === 'percentage' ? '%' : ' AED'} discount</span>
                        </div>
                        <div className="flex items-center">
                            <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                            <span>Expires: {coupon.expiration_date ? new Date(coupon.expiration_date).toLocaleDateString() : 'Never'}</span>
                        </div>
                        <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-3 text-gray-400" />
                            <span>Min. Purchase: {coupon.minimum_purchase_amount ? `${coupon.minimum_purchase_amount} AED` : 'None'}</span>
                        </div>
                         <div className="flex items-center">
                            <Tag className="h-5 w-5 mr-3 text-gray-400" />
                            <span>Usage: {coupon.usage_count} / {coupon.usage_limit || '∞'}</span>
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>
       {filteredCoupons.length === 0 && (
            <div className="text-center mt-10">
                <p className="text-xl text-gray-500">No coupons found.</p>
            </div>
        )}
    </div>
  );
};

export default CouponsPage;

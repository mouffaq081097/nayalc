'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

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

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editMode ? `/api/coupons/${currentCoupon.id}` : '/api/coupons';
    const method = editMode ? 'PUT' : 'POST';

    // Format data for submission
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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Coupons</h1>

      <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">{editMode ? 'Edit Coupon' : 'Add New Coupon'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">Coupon Code</Label>
            <Input id="code" name="code" value={currentCoupon.code} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="discount_type">Discount Type</Label>
            <Select name="discount_type" value={currentCoupon.discount_type} onValueChange={(value) => handleSelectChange('discount_type', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="discount_value">Discount Value</Label>
            <Input id="discount_value" name="discount_value" type="number" step="0.01" value={currentCoupon.discount_value} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="expiration_date">Expiration Date</Label>
            <Input id="expiration_date" name="expiration_date" type="date" value={currentCoupon.expiration_date} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="usage_limit">Usage Limit</Label>
            <Input id="usage_limit" name="usage_limit" type="number" value={currentCoupon.usage_limit} onChange={handleInputChange} placeholder="Leave blank for no limit" />
          </div>
          <div>
            <Label htmlFor="minimum_purchase_amount">Minimum Purchase Amount</Label>
            <Input id="minimum_purchase_amount" name="minimum_purchase_amount" type="number" step="0.01" value={currentCoupon.minimum_purchase_amount} onChange={handleInputChange} placeholder="Leave blank for no minimum" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="is_active" name="is_active" checked={currentCoupon.is_active} onCheckedChange={(checked) => handleSelectChange('is_active', checked)} />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </div>
        <div className="mt-4 flex space-x-2">
          <Button type="submit">{editMode ? 'Update Coupon' : 'Add Coupon'}</Button>
          {editMode && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
        </div>
      </form>

      <h2 className="text-xl font-semibold mb-4">Existing Coupons</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Min. Purchase</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon) => (
            <TableRow key={coupon.id}>
              <TableCell>{coupon.code}</TableCell>
              <TableCell>{coupon.discount_type}</TableCell>
              <TableCell>{coupon.discount_value}</TableCell>
              <TableCell>{coupon.usage_count} / {coupon.usage_limit || '∞'}</TableCell>
              <TableCell>{coupon.minimum_purchase_amount || 'N/A'}</TableCell>
              <TableCell>{coupon.expiration_date ? new Date(coupon.expiration_date).toLocaleDateString() : 'Never'}</TableCell>
              <TableCell>{coupon.is_active ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(coupon.id)}>Delete</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CouponsPage;

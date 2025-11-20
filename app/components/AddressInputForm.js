'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { User, MapPin } from 'lucide-react'; // Assuming these icons are needed
import PhoneNumberInput from './PhoneNumberInput';
import MapPicker from './MapPicker'; // Import MapPicker

const InputField = ({ id, name, value, onChange, placeholder, required, icon: Icon, type = "text", pattern }) => (
    <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <Input
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            type={type}
            pattern={pattern}
            className="block w-full pl-10 pr-3 py-2 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--brand-pink)] focus:border-[var(--brand-pink)] sm:text-sm"
        />
    </div>
);


const AddressInputForm = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        customer_phone: initialData?.customer_phone || '',
        address_line1: initialData?.address_line1 || '',
        apartment: initialData?.apartment || '',
        city: initialData?.city || '',
        country: initialData?.country || 'United Arab Emirates', // Default to UAE
        shipping_address: initialData?.shipping_address || '',
        latitude: initialData?.latitude || null,
        longitude: initialData?.longitude || null,
        isDefault: initialData?.isDefault || false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleMapPlaceSelect = (placeDetails) => {
        if (placeDetails) {
            setFormData(prev => ({
                ...prev,
                address_line1: placeDetails.streetAddress || placeDetails.formattedAddress || '',
                city: placeDetails.city || '',
                country: placeDetails.country || 'United Arab Emirates',
                shipping_address: placeDetails.formattedAddress || '',
                latitude: placeDetails.lat,
                longitude: placeDetails.lng,
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="col-span-1 md:col-span-2">
                        <Label htmlFor="customer_phone">Phone Number</Label>
                        <PhoneNumberInput value={formData.customer_phone} onChange={handleChange} required />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <Label htmlFor="address_line1">Street Address</Label>
                        <InputField id="address_line1" name="address_line1" value={formData.address_line1} onChange={handleChange} placeholder="Street Address" required icon={MapPin} />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <Label htmlFor="apartment">Apartment, Suite, etc. (Optional)</Label>
                        <InputField id="apartment" name="apartment" value={formData.apartment} onChange={handleChange} placeholder="Apartment, suite, etc. (Optional)" icon={MapPin} />
                    </div>
                    {/* MapPicker integrated directly below address fields */}
                    <div className="col-span-1 md:col-span-2 mt-4">
                        <MapPicker
                            onPlaceSelect={handleMapPlaceSelect}
                            initialAddress={{
                                location: formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : null
                            }}
                        />
                    </div>
                    <div>
                        <Label htmlFor="city">City</Label>
                        <InputField id="city" name="city" value={formData.city} onChange={handleChange} placeholder="City" required icon={MapPin} />
                    </div>
                    <div>
                        <Label htmlFor="country">Country</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <MapPin className="h-5 w-5 text-gray-400" />
                            </div>
                            <select 
                                id="country" 
                                name="country" 
                                value={formData.country} 
                                onChange={handleChange} 
                                className="block w-full pl-10 pr-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-pink)] focus:border-[var(--brand-pink)] sm:text-sm bg-white"
                                required
                            >
                                <option value="United Arab Emirates">United Arab Emirates</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex items-center mt-6 bg-gray-50 p-4 rounded-lg">
                    <input 
                        type="checkbox" 
                        id="isDefault" 
                        name="isDefault" 
                        checked={formData.isDefault} 
                        onChange={handleChange} 
                        className="h-5 w-5 text-[var(--brand-pink)] focus:ring-[var(--brand-pink)] border-gray-300 rounded" 
                    />
                    <Label htmlFor="isDefault" className="ml-3 block text-sm font-medium text-gray-700">
                        Set as my default shipping address
                    </Label>
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                    <Button type="button" variant="ghost" onClick={onCancel} className="text-gray-600 hover:bg-gray-100 px-8 py-3 rounded-lg text-base">
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90 text-white font-semibold px-8 py-3 rounded-lg shadow-md transform hover:-translate-y-0.5 transition-all duration-300 text-base"
                    >
                        Save Address
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AddressInputForm;

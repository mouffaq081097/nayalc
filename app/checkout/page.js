"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';
import { Card, CardTitle } from '../components/ui/card';
import { ArrowLeft, CreditCard, Truck, MapPin, Lock, Check, Gift, Tag } from 'lucide-react';
import { FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';


import PhoneNumberInput from '../components/PhoneNumberInput'; // Used by AddressInputForm
import MapPicker from '../components/MapPicker'; // Used by AddressInputForm
import Modal from '../components/Modal'; // New import for modal component
import AddressInputForm from '../components/AddressInputForm'; // New import for reusable address form
import { User } from 'lucide-react'; // Used by AddressInputForm

export default function CheckoutPage() {
  const { cartItems, clearCart, subtotal, appliedCoupon, discountAmount, finalTotal, applyCoupon, removeCoupon } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [couponCode, setCouponCode] = useState('');

  const [formData, setFormData] = useState({
    // Payment Info
    paymentMethod: 'cashOnDelivery',
    
    // Options
    giftWrap: false,
    giftMessage: '',
    newsletter: false
  });

  const fetchShippingAddresses = useCallback(async () => {
    if (!user || !user.id) return;
    try {
        const response = await fetch(`/api/users/${user.id}/addresses`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setShippingAddresses(data);
        if (data.length > 0) {
            const defaultAddress = data.find(addr => addr.is_default || addr.isDefault);
            setSelectedAddressId(defaultAddress ? defaultAddress.id : data[0].id);
        }
    } catch (error) {
        console.error("Error fetching shipping addresses:", error);
        toast.error("Error fetching shipping addresses.");
    }
}, [user]);

  useEffect(() => {
      if (user) {
          fetchShippingAddresses();
      } else {
          setShippingAddresses([]);
          setSelectedAddressId(null);
      }
  }, [user, fetchShippingAddresses]);

  const openAddressModal = (address) => {
    setEditingAddress(address); // Pass the address as is, without fullName property
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(false);
  };

  const handleCheckoutAddressSave = async (addressData) => {
    if (!user) return;

    const method = editingAddress ? 'PUT' : 'POST';
    const endpoint = editingAddress
      ? `/api/users/${user.id}/addresses/${editingAddress.id}`
      : `/api/users/${user.id}/addresses`;

    try {
      const payload = {
        ...addressData,
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), // Send the transformed payload
      });

      if (response.ok) {
        closeAddressModal();
        fetchShippingAddresses(); // Refresh addresses
        toast.success(`Address ${editingAddress ? 'updated' : 'saved'} successfully!`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save address with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error('An error occurred while saving the address: ' + error.message);
    }
  };

  const shipping = subtotal > 200 ? 0 : 30; // Free shipping if subtotal > 200 AED, otherwise 30 AED
  const tax = subtotal * 0.05; // 5% tax on AED subtotal
  const giftWrapFee = formData.giftWrap ? 20 : 0; // Assuming 20 AED for gift wrap
  const total = finalTotal + shipping + tax + giftWrapFee;

  const truncateDescription = (description, maxLength = 100) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  const steps = [
    { id: 1, title: 'Shipping', icon: Truck },
    { id: 2, title: 'Payment', icon: CreditCard },
    { id: 3, title: 'Review', icon: Check }
  ];

  const handleInputChange = (field, value) => { 
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    // Basic validation before moving to next step
    if (currentStep === 1 && !selectedAddressId) {
        toast.error('Please select a shipping address before continuing.');
        return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please login to place an order.');
      router.push('/auth'); // Redirect to login page
      return;
    }

    if (!selectedAddressId) {
        toast.error('A shipping address must be selected.');
        return;
    }
    
    const shippingDate = new Date();
    shippingDate.setDate(shippingDate.getDate() + 7);

    const orderData = {
      user_address_id: selectedAddressId, // Use the selected address ID
      payment_method: formData.paymentMethod,
      total_amount: parseFloat(total.toFixed(2)),
      shipping_scheduled_date: shippingDate.toISOString(),
      user_id: user.id,
      items: cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      taxAmount: tax,
      applied_coupon_id: appliedCoupon ? appliedCoupon.id : null,
      discount_amount: discountAmount,
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place order');
      }

      const result = await response.json();
      console.log('Order Placed Successfully:', result);
      toast.success('Order Placed Successfully! Order ID: ' + result.orderId);
      clearCart();
      router.push(`/orders/${result.orderId}`);

    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Error placing order: ' + error.message);
    }
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      applyCoupon(couponCode.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()}> 
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
            <h1 className="text-xl font-serif bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
              Secure Checkout
            </h1>
            <div className="flex items-center gap-1">
              <Lock className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Secure</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="bg-white rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      currentStep >= step.id 
                        ? 'bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className={`ml-3 text-sm ${
                      currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        currentStep > step.id ? 'bg-[var(--brand-pink)]' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl p-6"
            >
              {/* Step 1: Shipping */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl mb-6">Shipping Information</h2>

                  {shippingAddresses.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-medium">Select a Shipping Address</h3>
                      {shippingAddresses.map((address) => (
                        <Card
                          key={address.id}
                          className={`p-4 cursor-pointer ${selectedAddressId === address.id ? 'border-2 border-[var(--brand-blue)] bg-blue-50' : 'border-gray-200'}`}
                          onClick={() => setSelectedAddressId(address.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-bold">
                                {`${address.city}, ${address.country}`}
                              </h3>
                              <p>{address.addressLine1}, {address.addressLine2}</p>
                              <p>{address.city}, {address.state} {address.zipCode}</p>
                              <p>{address.country}</p>
                              <p className="text-sm text-gray-500">{address.customerPhone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="selectedAddress"
                              checked={selectedAddressId === address.id}
                              onChange={() => setSelectedAddressId(address.id)}
                              className="form-radio h-4 w-4 text-[var(--brand-blue)]"
                            />
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openAddressModal(address); }}>Edit</Button>
                          </div>
                        </div>
                      </Card>
                      ))}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full mt-4 flex items-center gap-2"
                    onClick={() => openAddressModal(null)}
                  >
                    <FaPlus /> Add New Address
                  </Button>
                </div>
              )}

              {/* Step 2: Payment */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl mb-6">Payment Information</h2>
                  
                  <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">Cash on Delivery</span>
                  </div>

                  <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="giftWrap"
                        checked={formData.giftWrap}
                        onCheckedChange={(checked) => handleInputChange('giftWrap', checked)}
                      />
                      <Label htmlFor="giftWrap" className="flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Gift wrap my order (+$5.99)
                      </Label>
                    </div>

                    {formData.giftWrap && (
                      <div>
                        <Label htmlFor="giftMessage">Gift Message (Optional)</Label>
                        <Input 
                          id="giftMessage"
                          value={formData.giftMessage}
                          onChange={(e) => handleInputChange('giftMessage', e.target.value)}
                          placeholder="Enter gift message"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl mb-6">Review Your Order</h2>
                  
                  {/* Shipping Info */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Shipping Address
                    </h3>
                    {selectedAddressId && shippingAddresses.length > 0 ? (
                      (() => {
                        const selectedAddress = shippingAddresses.find(addr => addr.id === selectedAddressId);
                        return selectedAddress ? (
                          <p className="text-gray-600">
                            {selectedAddress.customerName || user?.name}<br />
                            {selectedAddress.customerPhone}<br />
                            {selectedAddress.addressLine1}, {selectedAddress.addressLine2}<br />
                            {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}<br />
                            {selectedAddress.country}
                          </p>
                        ) : (
                          <p className="text-gray-600">No address selected or found.</p>
                        );
                      })()
                    ) : (
                      <p className="text-gray-600">No shipping address selected.</p>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment Method
                    </h3>
                    <p className="text-gray-600">
                      Cash on Delivery
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="newsletter"
                      checked={formData.newsletter}
                      onCheckedChange={(checked) => handleInputChange('newsletter', checked)}
                    />
                    <Label htmlFor="newsletter">Subscribe to our newsletter for exclusive offers</Label>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-gray-100 mt-6"> {/* Added margin-top here for better spacing */}
                <Button 
                  variant="outline" 
                  onClick={handlePreviousStep}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                {currentStep < 3 ? (
                  <Button 
                    onClick={handleNextStep}
                    className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
                    disabled={currentStep === 1 && shippingAddresses.length > 0 && !selectedAddressId}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button 
                    onClick={handlePlaceOrder}
                    className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
                    disabled={!selectedAddressId}
                  >
                    Place Order
                  </Button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 sticky top-24">
              <h3 className="text-xl mb-6">Order Summary</h3>
              
              {/* Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500">{item.brand}</p>
                      <p className="text-xs text-gray-500">{truncateDescription(item.description)}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                        <span className="text-sm font-medium">AED {item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Coupon Code */}
              <div className="mb-4">
                <Label htmlFor="couponCode">Discount Code</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="couponCode"
                    placeholder="Enter your code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon}
                  />
                  <Button onClick={handleApplyCoupon} disabled={!!appliedCoupon}>
                    Apply
                  </Button>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>AED {subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>- AED {discountAmount.toFixed(2)}</span>
                    <Button variant="ghost" size="sm" onClick={removeCoupon}>Remove</Button>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `AED ${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>AED {tax.toFixed(2)}</span>
                </div>
                {formData.giftWrap && (
                  <div className="flex justify-between">
                    <span>Gift Wrapping</span>
                    <span>AED {giftWrapFee.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>AED {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Your payment information is secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isAddressModalOpen} onClose={closeAddressModal} title={editingAddress ? 'Edit Address' : 'Add New Address'}>
        <AddressInputForm
          initialData={editingAddress}
          onSave={handleCheckoutAddressSave}
          onCancel={closeAddressModal}
        />
      </Modal>
    </div>
  );
}

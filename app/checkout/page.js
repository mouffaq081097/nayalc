"use client";
import { useState } from 'react';
import { motion } from 'framer-motion'; // Changed from 'motion/react' to 'framer-motion'
import { Button } from '../components/ui/button'; // Adjusted path
import { Input } from '../components/ui/input'; // Adjusted path
import { Label } from '../components/ui/label'; // Adjusted path
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'; // Adjusted path
import { Checkbox } from '../components/ui/checkbox'; // Adjusted path
import { Separator } from '../components/ui/separator'; // Adjusted path
import { ArrowLeft, CreditCard, Truck, MapPin, Lock, Check, Gift } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback'; // Adjusted path
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';


export default function CheckoutPage() { // Changed to default export for Next.js page
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Shipping Info
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    
    // Payment Info
    paymentMethod: 'cashOnDelivery',
    
    // Options
    saveAddress: false,
    giftWrap: false,
    giftMessage: '',
    newsletter: false
  });

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shipping = subtotal > 200 ? 0 : 30; // Free shipping if subtotal > 200 AED, otherwise 30 AED
  const tax = subtotal * 0.05; // 5% tax on AED subtotal
  const giftWrapFee = formData.giftWrap ? 20 : 0; // Assuming 20 AED for gift wrap
  const total = subtotal + shipping + tax + giftWrapFee;

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

  const handleInputChange = (field, value) => { // Removed type annotations for simplicity in JS
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
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
    const shippingDate = new Date();
    shippingDate.setDate(shippingDate.getDate() + 7);

    const orderData = {
      user_address_id: 1, // Hardcoded for now, should be dynamic
      payment_method: formData.paymentMethod,
      total_amount: total,
      shipping_scheduled_date: shippingDate.toISOString(),
      user_id: user ? user.id : 1, // Replace with actual user ID from auth context
      items: cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      })),
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
      alert('Order Placed Successfully! Order ID: ' + result.orderId);
      clearCart();
      router.push(`/orders/${result.orderId}`);

    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => window.history.back()}> {/* Changed onBackClick to go back in history */}
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
                                    
                                    <div>
                                      <Label htmlFor="customerName">Customer Name</Label>
                                      <Input 
                                        id="customerName"
                                        value={formData.customerName}
                                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                                        placeholder="Enter full name"
                                      />
                                    </div>
                
                                    <div>
                                      <Label htmlFor="customerEmail">Email Address</Label>
                                      <Input 
                                        id="customerEmail"
                                        type="email"
                                        value={formData.customerEmail}
                                        onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                                        placeholder="Enter email address"
                                      />
                                    </div>
                
                                    <div>
                                      <Label htmlFor="customerPhone">Phone Number</Label>
                                      <Input 
                                        id="customerPhone"
                                        type="tel"
                                        value={formData.customerPhone}
                                        onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                                        placeholder="Enter phone number"
                                      />
                                    </div>
                
                                    <div>
                                      <Label htmlFor="shippingAddress">Street Address</Label>
                                      <Input 
                                        id="shippingAddress"
                                        value={formData.shippingAddress}
                                        onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                                        placeholder="Enter street address"
                                      />
                                    </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input 
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CA">California</SelectItem>
                          <SelectItem value="NY">New York</SelectItem>
                          <SelectItem value="TX">Texas</SelectItem>
                          <SelectItem value="FL">Florida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input 
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        placeholder="Enter ZIP code"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="saveAddress"
                      checked={formData.saveAddress}
                      onCheckedChange={(checked) => handleInputChange('saveAddress', checked)}
                    />
                    <Label htmlFor="saveAddress">Save this address for future orders</Label>
                  </div>
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
                        Gift wrap my order (+AED {giftWrapFee.toFixed(2)})
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
                    <p className="text-gray-600">
                      {formData.customerName}<br />
                      {formData.customerPhone}<br />
                      {formData.shippingAddress}<br />
                      {formData.city}, {formData.state} {formData.zipCode}
                    </p>
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
              <div className="flex justify-between pt-6 border-t border-gray-100">
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
                  >
                    Continue
                  </Button>
                ) : (
                  <Button 
                    onClick={handlePlaceOrder}
                    className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
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
                  <div key={item.product.id} className="flex gap-3">
                    <ImageWithFallback
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.product.name}</h4>
                      <p className="text-xs text-gray-500">{item.product.brand}</p>
                      <p className="text-xs text-gray-500">{truncateDescription(item.product.description)}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                        <span className="text-sm font-medium">AED {item.product.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>AED {subtotal.toFixed(2)}</span>
                </div>
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
    </div>
  );
}
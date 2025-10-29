'use client';
import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Timer, Zap, Percent, Star } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export default function SalePage() {
  const [saleProducts, setSaleProducts] = useState([]);

  useEffect(() => {
    const fetchSaleProducts = async () => {
      try {
        const response = await fetch('/api/products?onSale=true');
        if (!response.ok) {
          throw new Error('Failed to fetch sale products');
        }
        const data = await response.json();
        setSaleProducts(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchSaleProducts();
  }, []);
  const handleCopyCode = () => {
    navigator.clipboard.writeText('FLASH20');
    alert('Coupon code FLASH20 copied to clipboard!'); // Optional: provide user feedback
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 via-[var(--brand-rose)] to-[var(--brand-cream)] py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-red-600 text-white animate-pulse">
              🔥 Limited Time Offer
            </Badge>
            <h1 className="text-4xl md:text-6xl mb-6">
              <span className="text-gray-900">Luxury Beauty </span>
              <span className="bg-gradient-to-r from-red-600 to-[var(--brand-pink)] bg-clip-text text-transparent">
                Sale
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Discover incredible savings on our premium beauty collection. 
              Up to 50% off selected items for a limited time only.
            </p>
            
            {/* Countdown Timer */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 inline-block">
              <div className="flex items-center gap-2 mb-3">
                <Timer className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-600 uppercase tracking-wide">Sale Ends In</span>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">05</div>
                  <div className="text-xs text-gray-500 uppercase">Days</div>
                </div>
                <div className="text-2xl text-gray-400">:</div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">14</div>
                  <div className="text-xs text-gray-500 uppercase">Hours</div>
                </div>
                <div className="text-2xl text-gray-400">:</div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">23</div>
                  <div className="text-xs text-gray-500 uppercase">Min</div>
                </div>
                <div className="text-2xl text-gray-400">:</div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">45</div>
                  <div className="text-xs text-gray-500 uppercase">Sec</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <span>• Up to 50% Off</span>
              <span>• Free Shipping</span>
              <span>• Limited Stock</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sale Highlights */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-red-50 rounded-2xl mb-4">
                <Percent className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl mb-2">Up to 50% Off</h3>
              <p className="text-gray-600">Massive discounts on premium beauty products</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl mb-4">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl mb-2">Flash Deals</h3>
              <p className="text-gray-600">Extra savings on select items for 24 hours only</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--brand-blue)]/20 to-[var(--brand-blue)]/10 rounded-2xl mb-4">
                <Star className="h-8 w-8 text-[var(--brand-blue)]" />
              </div>
              <h3 className="text-xl mb-2">Bestseller Sale</h3>
              <p className="text-gray-600">Our most loved products at incredible prices</p>
            </div>
          </div>
        </div>
      </section>

      {/* Flash Deal */}
      <section className="py-8 bg-gradient-to-r from-red-600 to-[var(--brand-pink)] text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Zap className="h-8 w-8 animate-pulse" />
              <div>
                <h3 className="text-xl">⚡ Flash Deal Alert!</h3>
                <p className="text-white/90">Extra 20% off when you buy 2 or more items</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              
              <Button 
                onClick={handleCopyCode}
                className="bg-white text-red-600 hover:bg-gray-100"
              >
                FLASH20
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sale Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">All Items</Button>
              <Button variant="outline" size="sm">50% Off</Button>
              <Button variant="outline" size="sm">30% Off</Button>
              <Button variant="outline" size="sm">20% Off</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {saleProducts.map((product) => (
              <ProductCard key={product.id} {...product} image={product.imageUrl} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg"
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
            >
              Load More Sale Items
            </Button>
          </div>
        </div>
      </section>

      {/* Bundle Deals */}
      <section className="py-16 bg-gradient-to-br from-[var(--brand-blue)]/5 to-[var(--brand-pink)]/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">
              <span className="text-gray-900">Bundle </span>
              <span className="bg-gradient-to-r from-red-600 to-[var(--brand-pink)] bg-clip-text text-transparent">
                Deals
              </span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Save even more when you buy complete sets. Perfect for trying new products 
              or stocking up on your favorites.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1751131964776-57e3cbca0a14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBza2luY2FyZSUyMHNlcnVtfGVufDF8fHx8MTc1ODM1MjkxNXww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Skincare bundle"
                  className="w-24 h-24 object-cover rounded-xl"
                />
                <div className="flex-1">
                  <Badge className="mb-2 bg-red-600 text-white">40% Off Bundle</Badge>
                  <h3 className="text-xl mb-2">Complete Skincare Routine</h3>
                  <p className="text-gray-600 mb-4">Cleanser + Serum + Moisturizer + SPF</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl text-gray-900">$159</span>
                    <span className="text-lg text-gray-500 line-through">$265</span>
                    <Badge variant="destructive">Save $106</Badge>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-6 bg-red-600 hover:bg-red-700">
                Add Bundle to Cart
              </Button>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1606158562001-5b5a8729a80b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtYWtldXAlMjBwYWxldHRlfGVufDF8fHx8MTc1ODM1MjkxNXww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Makeup bundle"
                  className="w-24 h-24 object-cover rounded-xl"
                />
                <div className="flex-1">
                  <Badge className="mb-2 bg-red-600 text-white">35% Off Bundle</Badge>
                  <h3 className="text-xl mb-2">Makeup Essentials Kit</h3>
                  <p className="text-gray-600 mb-4">Foundation + Palette + Lipstick + Mascara</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl text-gray-900">$135</span>
                    <span className="text-lg text-gray-500 line-through">$208</span>
                    <Badge variant="destructive">Save $73</Badge>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-6 bg-red-600 hover:bg-red-700">
                Add Bundle to Cart
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sale Terms */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl mb-6 text-center">Sale Terms & Conditions</h3>
            <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Sale Details</h4>
                <ul className="space-y-2">
                  <li>• Sale prices valid until stocks last</li>
                  <li>• Maximum 5 items per customer on flash deals</li>
                  <li>• Cannot be combined with other offers unless specified</li>
                  <li>• Free shipping on orders over 200 AED</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Return Policy</h4>
                <ul className="space-y-2">
                  <li>• 30-day return policy applies to sale items</li>
                  <li>• Items must be unused and in original packaging</li>
                  <li>• Final sale items are marked and non-returnable</li>
                  <li>• Exchanges available for defective items only</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl md:text-3xl mb-4">
            <span className="text-gray-900">Never Miss a </span>
            <span className="bg-gradient-to-r from-red-600 to-[var(--brand-pink)] bg-clip-text text-transparent">
              Sale Again
            </span>
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Be the first to know about flash sales, exclusive discounts, and special promotions. 
            Join our VIP list for early access to all sales.
          </p>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-red-600 to-[var(--brand-pink)] hover:opacity-90"
          >
            Join VIP Sale List
          </Button>
        </div>
      </section>
    </div>
  );
}

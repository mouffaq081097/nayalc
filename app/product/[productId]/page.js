'use client';

import { useState, useEffect, use } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

import { ArrowLeft, Heart, Share2, Star, Plus, Minus, ShoppingBag, Truck, RotateCcw, Shield, Check } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';




export default function ProductDetailPage({ params }) {
  const { productId } = use(params);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProduct(data);


        if (user) {
          const wishlistResponse = await fetch(`/api/wishlist?userId=${user.id}`);
          if (wishlistResponse.ok) {
            const wishlistData = await wishlistResponse.json();
            setIsWishlisted(wishlistData.some(item => item.productId === productId));
          }
        }

      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, user]);

  if (loading) {
    return <div className="text-center py-16">Loading product details...</div>;
  }

  if (error) {
    return <div className="text-center py-16 text-red-500">Error: {error.message}</div>;
  }

  if (!product) {
    return <div className="text-center py-16">Product not found.</div>;
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      alert('Please sign in to add items to your wishlist.');
      router.push('/auth');
      return;
    }

    try {
      let response;
      if (isWishlisted) {
        response = await fetch(`/api/wishlist/${user.id}/${productId}`, {
          method: 'DELETE',
        });
      } else {
        response = await fetch(`/api/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id, productId: productId }),
        });
      }

      if (response.ok) {
        setIsWishlisted(!isWishlisted);
        alert(isWishlisted ? 'Removed from wishlist!' : 'Added to wishlist!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update wishlist: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      alert('An error occurred while updating your wishlist.');
    }
  };

  const savings = product.originalPrice - product.price;
  const savingsPercentage = Math.round((savings / product.originalPrice) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div 
              className="aspect-square bg-white rounded-2xl overflow-hidden shadow-lg mx-auto max-w-md"
            >
              <ImageWithFallback
                src={product.images[selectedImage]}
                className="w-full h-full object-contain"
              />
            </div>


            {/* Thumbnail Images */}
            <div className="flex gap-4">
              {Array.isArray(product.images) && product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${ 
                    selectedImage === index ? 'border-[var(--brand-pink)]' : 'border-gray-200'
                  }`}
                >
                  <ImageWithFallback
                    src={image}
                  alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand & Name */}
            <div>
              <Badge className="mb-3 bg-[var(--brand-blue)] text-white">
                {product.brand}
              </Badge>
              <h1 className="text-3xl md:text-4xl mb-4">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl">AED {product.price}</span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-gray-500 line-through">AED {product.originalPrice}</span>
                  <Badge variant="destructive">Save AED {savings} ({savingsPercentage}%)</Badge>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">{product.description}</p>



            {/* Quantity */}
            <div className="space-y-3">
              <label className="text-sm uppercase tracking-wide text-gray-700">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                onClick={handleAddToCart}
                className="flex-1 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90 text-lg py-6"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Add to Bag - AED {(product.price * quantity).toFixed(2)}
              </Button>
              <Button
                variant="outline"
                onClick={handleWishlistToggle}
                className={`p-3 ${isWishlisted ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="outline" className="p-3">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-gray-200">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-2 text-[var(--brand-blue)]" />
                <div className="text-xs text-gray-600">Free Shipping</div>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 mx-auto mb-2 text-[var(--brand-blue)]" />
                <div className="text-xs text-gray-600">30-Day Returns</div>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-[var(--brand-blue)]" />
                <div className="text-xs text-gray-600">Authentic</div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="benefits">Benefits</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="how-to-use">How to Use</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-6">
              <div className="bg-white rounded-2xl p-8">
                <h3 className="text-xl mb-4">Product Details</h3>
                <p className="text-gray-600 leading-relaxed">{product.long_description}</p>
              </div>
            </TabsContent>

            <TabsContent value="benefits" className="mt-6">
              <div className="bg-white rounded-2xl p-8">
                <h3 className="text-xl mb-4">Key Benefits</h3>
                <div className="space-y-3">
                  {product.benefits && product.benefits.split('\n').map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-gray-600">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ingredients" className="mt-6">
              <div className="bg-white rounded-2xl p-8">
                <h3 className="text-xl mb-4">Key Ingredients</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {product.ingredients && product.ingredients.split('\n').map((ingredient, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-[var(--brand-pink)] rounded-full"></div>
                      <span className="text-gray-700">{ingredient}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="how-to-use" className="mt-6">
              <div className="bg-white rounded-2xl p-8">
                <h3 className="text-xl mb-4">How to Use</h3>
                <div className="space-y-4">
                  {product.how_to_use && product.how_to_use.split('\n').map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-gray-600 pt-1">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}


'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Heart, 
  ShoppingBag, 
  Share2, 
  Search,
  Grid3X3,
  List,
  Star,
  X,
  Eye,
  Gift,
  Sparkles,
  TrendingUp,
  Clock,
  Tag,
  ArrowRight
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../lib/utils';

const collections = [
  { id: 1, name: "Skincare Favorites", count: 3, isDefault: true },
  { id: 2, name: "Gift Ideas", count: 2, isDefault: false },
  { id: 3, name: "Summer Ready", count: 1, isDefault: false }
];

export default function WishlistPage() {
  const { user, isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeCollection, setActiveCollection] = useState(1);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated || !user?.id) {
        setWishlistItems([]);
        return;
      }
      try {
        const response = await fetch(`/api/wishlist?userId=${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch wishlist');
        }
        const data = await response.json();
        const processedWishlistItems = data.map(item => ({
          ...item,
          image: item.imageUrl || null, // Add 'image' property for ImageWithFallback
          inStock: item.stockQuantity > 0, // Derive inStock from stockQuantity
        }));
        setWishlistItems(processedWishlistItems);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        setWishlistItems([]);
      }
    };

    fetchWishlist();
  }, [isAuthenticated, user]);

  const categories = ['All', 'Skincare', 'Makeup', 'Fragrance'];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' }
  ];

  const filteredItems = wishlistItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        case 'oldest':
          return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleRemoveItem = async (productId) => {
    if (!isAuthenticated || !user?.id) {
      console.error('User not authenticated.');
      return;
    }
    try {
      const response = await fetch(`/api/wishlist/${user.id}/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove item from wishlist');
      }
      // Re-fetch wishlist items to update the UI
      const updatedWishlist = await fetch(`/api/wishlist?userId=${user.id}`);
      const data = await updatedWishlist.json();
      setWishlistItems(data);
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
    }
  };

  const handleAddToCart = async (item) => {
    if (!isAuthenticated || !user?.id) {
      console.error('User not authenticated.');
      return;
    }
    try {
      const response = await fetch(`/api/users/${user.id}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: item.id,
          quantity: 1, // Assuming adding one item at a time from wishlist
          price: item.price,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to add item to cart');
      }
      // Optionally, update cart context here if useCart provides a way to refetch or update
      
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  const handleMoveToCart = async () => {
    if (!isAuthenticated || !user?.id) {
      console.error('User not authenticated.');
      return;
    }
    for (const itemId of selectedItems) {
      const itemToMove = wishlistItems.find(item => item.id === itemId);
      if (itemToMove) {
        await handleAddToCart(itemToMove);
        await handleRemoveItem(itemId); // Remove from wishlist after adding to cart
      }
    }
    setSelectedItems([]);
  };

  const totalValue = filteredItems.reduce((sum, item) => sum + (item.price || item.originalPrice), 0);
  const totalSavings = filteredItems.reduce((sum, item) => 
    sum + (item.isOnSale ? (item.originalPrice - item.price) : 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-rose)] to-white">
      {/* Header */}
      <section className="py-16 bg-gradient-to-r from-[var(--brand-blue)]/5 to-[var(--brand-pink)]/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Heart className="h-5 w-5 text-[var(--brand-pink)]" />
              <span className="text-sm font-medium">Your Beauty Wishlist</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif mb-4 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
              Saved Favorites
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Keep track of your desired beauty products and never miss a sale or restock
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-[var(--brand-blue)]">{filteredItems.length}</div>
                <div className="text-sm text-gray-600">Items Saved</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-[var(--brand-pink)]">{formatPrice(totalValue)}</div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{formatPrice(totalSavings)}</div>
                <div className="text-sm text-gray-600">Potential Savings</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Controls */}
      <section className="py-8 bg-white/50 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search your wishlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category ? "bg-[var(--brand-pink)] text-white" : ""}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              
              <div className="flex border border-gray-200 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-gray-100' : ''}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-gray-100' : ''}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-[var(--brand-blue)]/5 rounded-lg flex items-center justify-between"
            >
              <span className="text-sm text-gray-600">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleMoveToCart}>
                  <ShoppingBag className="h-4 w-4 mr-1" />
                  Move to Cart
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedItems([])}>
                  Clear Selection
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Collections Tabs */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <Tabs value={activeCollection.toString()} onValueChange={(value) => setActiveCollection(parseInt(value))}>
            <TabsList className="mb-6">
              {collections.map(collection => (
                <TabsTrigger key={collection.id} value={collection.id.toString()}>
                  {collection.name} ({collection.count})
                </TabsTrigger>
              ))}
            </TabsList>

            {collections.map(collection => (
              <TabsContent key={collection.id} value={collection.id.toString()}>
                {/* Wishlist Items */}
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  <AnimatePresence>
                    {filteredItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={viewMode === 'list' ? 'max-w-none' : ''}
                      >
                        <Card className={`group hover:shadow-xl transition-all duration-300 ${
                          selectedItems.includes(item.id) ? 'ring-2 ring-[var(--brand-pink)]' : ''
                        } ${viewMode === 'list' ? 'flex-row overflow-hidden' : ''}`}>
                          <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                            {/* Selection Checkbox */}
                            <button
                              onClick={() => handleSelectItem(item.id)}
                              className="absolute top-3 left-3 z-10 w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-gray-200 hover:border-[var(--brand-pink)] transition-colors"
                            >
                              {selectedItems.includes(item.id) && (
                                <div className="w-3 h-3 bg-[var(--brand-pink)] rounded-full" />
                              )}
                            </button>

                            {/* Remove from Wishlist */}
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>

                            {/* Product Image */}
                            <div className={`relative overflow-hidden ${
                              viewMode === 'list' ? 'h-full' : 'aspect-square'
                            }`}>
                              <ImageWithFallback
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                              />
                              
                              {/* Badges */}
                              <div className="absolute top-3 left-12 flex flex-col gap-1">
                                {item.isOnSale && (
                                  <Badge className="bg-red-500 text-white">
                                    -{item.discount}%
                                  </Badge>
                                )}
                                {!item.stockQuantity || item.stockQuantity <= 0 && (
                                  <Badge className="bg-gray-500 text-white">
                                    Out of Stock
                                  </Badge>
                                )}
                              </div>

                              {/* Quick Actions Overlay */}
                              <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 ${
                                viewMode === 'list' ? 'relative bg-transparent opacity-100 w-auto' : ''
                              }`}>
                                <Button size="sm" variant="secondary" className="bg-white/90 text-gray-900">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="secondary" className="bg-white/90 text-gray-900">
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <CardContent className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                            <div className={`${viewMode === 'list' ? 'flex justify-between items-start' : 'space-y-4'}`}>
                              <div className={viewMode === 'list' ? 'flex-1' : ''}>
                                {/* Brand and Rating */}
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-gray-500">{item.brand}</span>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm">{item.rating}</span>
                                    <span className="text-xs text-gray-500">({item.reviews})</span>
                                  </div>
                                </div>

                                {/* Product Name */}
                                <h3 className="font-semibold mb-2 group-hover:text-[var(--brand-pink)] transition-colors">
                                  {item.name}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                  {item.description}
                                </p>

                                {/* Price */}
                                <div className="flex items-center gap-2 mb-4">
                                  {item.inStock ? (
                                    <>
                                      <span className="text-xl font-bold text-[var(--brand-blue)]">
                                        {formatPrice(item.price)}
                                      </span>
                                      {item.isOnSale && (
                                        <span className="text-sm text-gray-500 line-through">
                                          {formatPrice(item.originalPrice)}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-lg font-semibold text-gray-400">
                                      Out of Stock
                                    </span>
                                  )}
                                </div>

                                {/* Price History Trend */}
                                {item.priceHistory && item.priceHistory.length > 1 && (
                                  <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className={`h-4 w-4 ${
                                      item.priceHistory[0] > item.priceHistory[item.priceHistory.length - 1] 
                                        ? 'text-green-500' : 'text-red-500'
                                    }`} />
                                    <span className="text-xs text-gray-500">
                                      Price trend: {item.priceHistory[0] > item.priceHistory[item.priceHistory.length - 1] ? 'Decreasing' : 'Stable'}
                                    </span>
                                  </div>
                                )}

                                {/* Added Date */}
                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                                  <Clock className="h-3 w-3" />
                                  Added {new Date(item.addedDate).toLocaleDateString()}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className={`flex gap-2 ${viewMode === 'list' ? 'flex-col w-32' : ''}`}>
                                {item.stockQuantity > 0 ? (
                                  <Button 
                                    onClick={() => handleAddToCart(item)}
                                    className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90 flex-1"
                                  >
                                    <ShoppingBag className="h-4 w-4 mr-1" />
                                    Add to Cart
                                  </Button>
                                ) : (
                                  <Button variant="outline" disabled className="flex-1">
                                    Notify Me
                                  </Button>
                                )}
                                
                                <Button variant="ghost" size="sm">
                                  <Gift className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Empty State */}
                {filteredItems.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <Heart className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      {searchQuery || selectedCategory !== 'All' ? 'No items match your filters' : 'Your wishlist is empty'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {searchQuery || selectedCategory !== 'All' 
                        ? 'Try adjusting your search or filters' 
                        : 'Start adding products you love to keep track of them'
                      }
                    </p>
                    <Button className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] text-white">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Discover Products
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Price Drop Alert CTA */}
      <section className="py-16 bg-gradient-to-r from-[var(--brand-blue)]/10 to-[var(--brand-pink)]/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <Tag className="h-12 w-12 text-[var(--brand-pink)] mx-auto mb-4" />
            <h2 className="text-2xl font-serif mb-4">Never Miss a Deal</h2>
            <p className="text-gray-600 mb-6">
              Get notified when items in your wishlist go on sale or come back in stock
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] text-white"
              onClick={() => setShowPriceAlert(true)}
            >
              Set Price Alerts
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

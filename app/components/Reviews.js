'use client';

import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import { Star as StarIcon, User as UserIcon, Calendar, Trash2, MessageSquare, Sparkles, Info, Check, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from './ui/badge';

const Star = ({ filled, onClick, size = "w-5 h-5" }) => (
  <StarIcon
    onClick={onClick}
    className={`${size} cursor-pointer transition-all duration-300 ${filled ? 'text-brand-pink fill-current' : 'text-gray-200'}`}
    strokeWidth={filled ? 0 : 1.5}
  />
);

export default function Reviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?product_id=${productId}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    if (productId) fetchReviews();
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return setError('Please select a rating.');
    if (!user?.id) return setError('You must be logged in to submit a review.');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, comment, userId: user.id }),
      });

      if (!response.ok) throw new Error('Failed to submit review');
      setRating(0);
      setComment('');
      fetchReviews();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const response = await fetch(`/api/reviews?id=${reviewId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete review');
      fetchReviews();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-transparent relative overflow-hidden font-sans">
      <div className="w-full relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
                <span className="w-10 h-px bg-brand-pink"></span>
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-brand-pink">Reflections</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl text-gray-900 italic tracking-tight leading-tight">
                Client <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-pink to-purple-400">Experiences</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-6 bg-white/80 backdrop-blur-xl px-8 py-5 rounded-[2rem] border border-gray-200 shadow-sm">
            <div className="flex -space-x-1.5">
                {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-white flex items-center justify-center shadow-sm">
                        <StarIcon size={12} className="text-brand-pink fill-current" />
                    </div>
                ))}
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-left">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 block">{reviews.length} Total Reviews</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Verified Purchases</span>
            </div>
          </div>
        </div>

        {error && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50/80 backdrop-blur-md text-red-600 px-8 py-5 rounded-2xl text-xs font-bold mb-12 border border-red-100 flex items-center gap-3"
            >
                <Info size={16} />
                {error}
            </motion.div>
        )}

        <div className="grid lg:grid-cols-12 gap-8 xl:gap-12 items-start">
          
          {/* LEFT: Review Form */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="bg-white/80 backdrop-blur-3xl p-8 md:p-10 rounded-[2.5rem] border border-gray-200 shadow-2xl shadow-gray-200/20 relative overflow-hidden group">
              <div className="flex items-center gap-4 mb-10 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center shadow-xl transition-transform duration-500 group-hover:rotate-3">
                    <MessageSquare size={20} className="text-brand-pink" />
                </div>
                <div className="text-left">
                    <h3 className="text-xl font-serif italic text-gray-900 leading-none">Share Perspective</h3>
                    <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-2 font-bold">Document your journey</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                <div className="text-left">
                  <div className="flex items-baseline justify-between mb-4">
                    <label className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-400">Rating</label>
                    <span className="text-[10px] font-serif italic text-brand-pink">{rating || 0}/5 Excellence</span>
                  </div>
                  <div className="flex gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 shadow-inner justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        filled={star <= rating}
                        onClick={() => setRating(star)}
                        size="w-8 h-8"
                      />
                    ))}
                  </div>
                </div>

                <div className="text-left">
                  <label className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-400 block mb-4">Your Commentary</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Grace this page with your unique experience..."
                    className="min-h-[150px] bg-white border-gray-200 rounded-[1.5rem] p-6 text-sm font-medium focus:ring-brand-pink/5 transition-all shadow-sm placeholder:text-gray-300 focus:border-brand-pink/30 leading-relaxed"
                  />
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="group relative overflow-hidden w-full h-16 rounded-2xl bg-gray-900 text-white transition-all duration-500 active:scale-95 disabled:opacity-50 shadow-xl hover:shadow-brand-pink/20"
                >
                  <div className="absolute inset-0 bg-brand-pink opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">{isLoading ? 'Archiving...' : 'Submit Review'}</span>
                    <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                  </div>
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Review List */}
          <div className="lg:col-span-7 space-y-6">
            <AnimatePresence mode="popLayout">
              {reviews.length > 0 ? (
                reviews.map((review, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    key={review.id} 
                    className="bg-white/60 backdrop-blur-sm rounded-[2rem] border border-gray-100 p-8 md:p-10 transition-all duration-500 group hover:bg-white hover:shadow-xl hover:shadow-gray-100/50 hover:border-gray-200 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-rose to-gray-50 flex items-center justify-center text-brand-pink border border-white font-serif italic text-xl shadow-sm">
                            {review.username?.[0] || 'A'}
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.15em]">{review.username || 'Anonymous Client'}</h4>
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-100">
                                    <Check size={8} className="text-green-600" />
                                    <span className="text-[8px] font-bold text-green-700 uppercase tracking-widest">Verified</span>
                                </div>
                            </div>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <StarIcon key={star} size={9} className={star <= review.rating ? "text-brand-pink fill-current" : "text-gray-200"} />
                                ))}
                            </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {isAdmin && (
                            <button
                                onClick={() => handleDeleteReview(review.id)}
                                className="text-red-300 hover:text-red-600 transition-all p-2 bg-red-50 rounded-lg opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="relative pl-6 text-left">
                        <Quote className="absolute left-0 top-0 text-brand-pink/10" size={20} />
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed font-sans font-medium italic">
                            {review.comment}
                        </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-32 bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <Quote size={32} className="text-gray-200" />
                  </div>
                  <h3 className="font-serif text-3xl text-gray-900 mb-4 italic">Awaiting Your Story</h3>
                  <p className="text-gray-400 font-medium max-w-xs mx-auto text-[10px] uppercase tracking-[0.3em] leading-loose px-6">
                    No reflections have been shared yet. <br/>Be the first to document your experience.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import { Star as StarIcon, Trash2, MessageSquare, Check, PenLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StarButton = ({ filled, onClick, onMouseEnter, onMouseLeave }) => (
  <StarIcon
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    size={22}
    className={`cursor-pointer transition-all duration-150 ${filled ? 'fill-current' : ''}`}
    style={{ color: filled ? 'rgb(147,104,236)' : 'rgba(216,180,254,0.4)' }}
    strokeWidth={filled ? 0 : 1.5}
  />
);

const StarDisplay = ({ rating, size = 11 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <StarIcon
        key={star}
        size={size}
        style={{ color: star <= rating ? 'rgb(147,104,236)' : 'rgba(216,180,254,0.3)' }}
        className={star <= rating ? 'fill-current' : ''}
        strokeWidth={0}
      />
    ))}
  </div>
);

export default function Reviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?product_id=${productId}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      setReviews(data);
    } catch (err) {
      setError(err.message);
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
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!confirm('Delete this review?')) return;
    try {
      const response = await fetch(`/api/reviews?id=${reviewId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete review');
      fetchReviews();
    } catch (err) {
      setError(err.message);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-0 py-10 lg:py-14">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 pb-6 border-b border-gray-100">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--cl-purple)' }}>Reviews</p>
          <h2 className="text-2xl font-semibold text-black tracking-tight">Customer reviews</h2>
        </div>
        {avgRating && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-3xl font-bold text-black tabular-nums">{avgRating}</span>
              <span className="text-sm text-black/30 font-medium"> / 5</span>
            </div>
            <div>
              <StarDisplay rating={Math.round(parseFloat(avgRating))} size={14} />
              <p className="text-[11px] text-black/40 font-medium mt-1">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-12 lg:gap-16 items-start">

        {/* Write a Review Form */}
        <div className="lg:sticky lg:top-32">
          <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: 'var(--cl-glass-border)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(147,104,236,0.12)', color: 'var(--cl-purple)' }}>
                <PenLine size={14} />
              </div>
              <h3 className="text-[14px] font-semibold text-black">Write a review</h3>
            </div>

            {!user ? (
              <p className="text-[13px] text-black/50 leading-relaxed">
                Please <a href="/auth" className="underline underline-offset-2" style={{ color: 'var(--cl-purple)' }}>sign in</a> to share your experience.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Star Rating */}
                <div>
                  <p className="text-[11px] font-medium text-black/40 mb-3 uppercase tracking-wide">Your rating</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarButton
                        key={star}
                        filled={star <= (hoverRating || rating)}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      />
                    ))}
                    {(hoverRating || rating) > 0 && (
                      <span className="text-[12px] font-medium ml-1" style={{ color: 'var(--cl-purple)' }}>
                        {ratingLabels[hoverRating || rating]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <p className="text-[11px] font-medium text-black/40 mb-2 uppercase tracking-wide">Your comment</p>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="min-h-[110px] bg-white border-gray-200 rounded-xl px-4 py-3 text-[13px] leading-relaxed text-black placeholder:text-black/25 resize-none focus:ring-1 focus:ring-[var(--cl-purple)]/30 focus:border-[var(--cl-purple)]/40 transition-all"
                  />
                </div>

                {error && (
                  <p className="text-[12px] text-red-500 font-medium">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl text-[13px] font-semibold text-white transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: success ? 'rgb(34,197,94)' : 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))' }}
                >
                  {success ? (
                    <><Check size={15} /> Submitted</>
                  ) : isLoading ? 'Submitting...' : 'Submit review'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Reviews List */}
        <div>
          <AnimatePresence mode="popLayout">
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                    className="group bg-white rounded-2xl border border-gray-100 p-6 hover:border-[rgba(216,180,254,0.4)] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, rgb(216,180,254), rgb(147,104,236))' }}
                        >
                          {(review.username?.[0] || 'A').toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-black">{review.username || 'Anonymous'}</span>
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.08)' }}>
                              <Check size={8} className="text-green-600" />
                              <span className="text-[9px] font-semibold text-green-700">Verified</span>
                            </span>
                          </div>
                          <StarDisplay rating={review.rating} size={10} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-black/30 font-medium">
                          {new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(review.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-all p-1.5 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-[13px] text-black/60 leading-relaxed pl-12">
                        {review.comment}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-gray-200 text-center"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--cl-bg-lavender)', color: 'var(--cl-purple)' }}>
                  <MessageSquare size={20} strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-semibold text-black mb-2">No reviews yet</h3>
                <p className="text-[13px] text-black/40 leading-relaxed max-w-[220px]">Be the first to share your experience with this product.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

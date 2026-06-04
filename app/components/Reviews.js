'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import { Star as StarIcon, Trash2, MessageSquare, Check, PenLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LAVENDER = 'rgb(147,104,236)';

const StarButton = ({ filled, onClick, onMouseEnter, onMouseLeave }) => (
  <StarIcon
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    size={24}
    className={`cursor-pointer transition-all duration-150 ${filled ? 'fill-current' : ''}`}
    style={{ color: filled ? LAVENDER : 'rgba(216,180,254,0.4)' }}
    strokeWidth={filled ? 0 : 1.5}
  />
);

const StarDisplay = ({ rating, size = 11 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <StarIcon
        key={star}
        size={size}
        style={{ color: star <= rating ? LAVENDER : 'rgba(216,180,254,0.3)' }}
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
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length
      ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100)
      : 0,
  }));

  return (
    <div className="max-w-7xl mx-auto py-12 lg:py-16">

      {/* Header — matches page section style */}
      <div className="space-y-1 mb-10">
        <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400">Verified buyers</p>
        <h2 className="text-[26px] font-bold text-gray-900">Customer reviews</h2>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-10 lg:gap-16 items-start">

        {/* LEFT: Summary + Write form */}
        <div className="lg:sticky lg:top-32 space-y-5">

          {/* Rating summary with distribution bars */}
          {avgRating !== null && reviews.length > 0 && (
            <div className="rounded-2xl border p-5 space-y-4"
              style={{ background: 'rgba(248,240,255,0.6)', borderColor: 'rgba(216,180,254,0.35)' }}>
              <div className="flex items-end gap-3">
                <span className="text-[50px] font-bold text-gray-900 leading-none tabular-nums">
                  {avgRating.toFixed(1)}
                </span>
                <div className="pb-1">
                  <StarDisplay rating={Math.round(avgRating)} size={15} />
                  <p className="text-[11px] text-gray-400 font-medium mt-1.5">
                    {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                {distribution.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-gray-500 w-3 text-right tabular-nums">{star}</span>
                    <StarIcon size={9} fill={LAVENDER} strokeWidth={0} style={{ color: LAVENDER, flexShrink: 0 }} />
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(216,180,254,0.2)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.55, delay: (5 - star) * 0.07, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: LAVENDER }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-gray-400 w-5 tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Write a review form */}
          <div className="rounded-2xl border p-5"
            style={{ background: 'rgba(248,240,255,0.4)', borderColor: 'rgba(216,180,254,0.35)' }}>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(147,104,236,0.12)', color: LAVENDER }}>
                <PenLine size={13} />
              </div>
              <h3 className="text-[14px] font-semibold text-gray-900">Write a review</h3>
            </div>

            {!user ? (
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Please{' '}
                <a href="/auth" className="underline underline-offset-2 font-medium" style={{ color: LAVENDER }}>
                  sign in
                </a>{' '}
                to share your experience.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <p className="text-[11px] font-medium text-gray-400 mb-2.5 uppercase tracking-wide">Your rating</p>
                  <div className="flex items-center gap-1">
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
                      <span className="text-[12px] font-semibold ml-1.5" style={{ color: LAVENDER }}>
                        {ratingLabels[hoverRating || rating]}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-gray-400 mb-2 uppercase tracking-wide">Your comment</p>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="min-h-[100px] bg-white border-purple-100 rounded-xl px-4 py-3 text-[13px] leading-relaxed text-gray-800 placeholder:text-gray-300 resize-none focus:ring-1 focus:border-purple-300 transition-all"
                  />
                </div>

                {error && (
                  <p className="text-[12px] text-red-500 font-medium">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl text-[13px] font-semibold text-white transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: success
                      ? 'rgb(34,197,94)'
                      : 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))',
                  }}
                >
                  {success
                    ? <><Check size={14} /> Submitted!</>
                    : isLoading ? 'Submitting…' : 'Submit review'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT: Review list */}
        <div>
          <AnimatePresence mode="popLayout">
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                    className="group rounded-2xl border p-5 transition-all hover:shadow-sm"
                    style={{
                      background: 'rgba(255,255,255,0.9)',
                      borderColor: 'rgba(216,180,254,0.22)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))' }}
                        >
                          {(review.username?.[0] || 'A').toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[13px] font-semibold text-gray-900">{review.username || 'Anonymous'}</span>
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                              <Check size={8} className="text-emerald-600" />
                              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">Verified</span>
                            </span>
                          </div>
                          <StarDisplay rating={review.rating} size={11} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-400 font-medium">
                          {new Date(review.created_at).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
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
                      <p className="text-[13px] text-gray-600 leading-relaxed pl-12">
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
                className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed text-center"
                style={{ borderColor: 'rgba(216,180,254,0.35)', background: 'rgba(248,240,255,0.3)' }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(248,240,255,0.8)', color: LAVENDER }}>
                  <MessageSquare size={20} strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-[13px] text-gray-400 leading-relaxed max-w-[220px]">
                  Be the first to share your experience with this product.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const Star = ({ filled, onClick }) => (
  <svg
    onClick={onClick}
    className={`w-5 h-5 cursor-pointer ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
  </svg>
);

export default function Reviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, token } = useAuth(); // Access user and token from AuthContext
  const isAdmin = user && user.id === 2; // Check if the user is userId 2 for delete privileges

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?product_id=${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
        setError('Please select a rating.');
        return;
    }
    if (!user || !user.id) {
        setError('You must be logged in to submit a review.');
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating,
          comment,
          userId: user.id, // Include userId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      setRating(0);
      setComment('');
      fetchReviews(); // Refresh reviews after submission
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }
    if (!token) {
      setError('Authentication token is missing. Please log in as an administrator.');
      return;
    }

    try {
      const response = await fetch(`/api/reviews?id=${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete review');
      }

      fetchReviews(); // Refresh reviews after deletion
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-gray-50 py-12 mt-8">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Customer Reviews</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Leave a Review</h3>
            <form onSubmit={handleSubmit}>
              <div className="flex items-center mb-4">
                <span className="mr-3 text-gray-700">Your Rating:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      filled={star <= rating}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your review here..."
                className="mb-4 bg-gray-50 border-gray-300"
              />
              <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90">
                {isLoading ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </div>

        <div className="space-y-6">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-3 justify-between">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} filled={star <= review.rating} />
                    ))}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-semibold">{review.username || 'Anonymous'}</span>
                    <span className="mx-1">·</span>
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                    {isAdmin && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteReview(review.id)}
                            className="ml-4 px-2 py-1 text-xs"
                        >
                            Delete
                        </Button>
                    )}
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center flex flex-col items-center justify-center space-y-4">
              <svg className="w-16 h-16 text-[var(--brand-pink)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-2xl font-semibold text-gray-900">No Reviews Yet</h3>
              <p className="text-gray-600 max-w-md">
                Be the first to share your thoughts on this product! Your review helps others make informed decisions.
              </p>
              <Button
                className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90 mt-4"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} // Scroll to top for now, ideally to the form
              >
                Write the First Review
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Star, Trash2, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { headingFont } from './home/headingFont';
import { useSignIn } from '@/app/context/SignInContext';
import { useLocale, useT } from '@/app/context/LocaleContext';

const INK = '#111114';

function Stars({ rating, size = 16, gap = 'gap-0.5' }) {
  const t = useT();
  // Right to left the stars run from the right, and a partial star fills from its right edge
  return (
    <span className={`inline-flex ${gap}`} aria-label={t('{rating} out of 5 stars', { rating: Number(rating.toFixed(1)) })}>
      {[1, 2, 3, 4, 5].map((n) => {
        // Partial last star for averages like 4.6
        const fill = Math.max(0, Math.min(1, rating - (n - 1)));
        return (
          <span key={n} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} strokeWidth={0} className="absolute inset-0 fill-[#e3e3e3]" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} strokeWidth={0} style={{ fill: INK }} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

const timeAgo = (iso, t) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return t('Today');
  if (days === 1) return t('Yesterday');
  if (days < 30) return t('{n} days ago', { n: days });
  const months = Math.floor(days / 30);
  if (months < 12) return t(months === 1 ? '{n} month ago' : '{n} months ago', { n: months });
  const years = Math.floor(days / 365);
  return t(years === 1 ? '{n} year ago' : '{n} years ago', { n: years });
};

// "kareem dalloul" → "Kareem D."; a single word or an email keeps its first part
const displayName = (username = '') => {
  const base = String(username).split('@')[0].replace(/[._-]+/g, ' ').trim();
  const [first = 'Customer', last] = base.split(/\s+/);
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
  return last ? `${cap(first)} ${last.charAt(0).toUpperCase()}.` : cap(first);
};

function Select({ id, label, value, onChange, options }) {
  return (
    <label htmlFor={id} className="relative block">
      <span className="sr-only">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-[50px] w-full sm:w-[260px] border border-[#dcdcdc] bg-white ps-5 pe-11 text-[15px] text-[#111114] outline-none focus:border-[#111114]"
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown size={18} className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2" />
    </label>
  );
}

// `token` comes from the review email's link (?rt=…): it lets the customer who
// bought the product review it without signing in. `initialRating` is the star
// they tapped in that email (?review=4).
function WriteReview({ productId, onDone, initialRating = 0, token = null }) {
  const { openSignIn } = useSignIn();
  const { t, rich } = useLocale();
  const { user } = useAuth();
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (initialRating) setRating(initialRating); }, [initialRating]);

  if (!user?.id && !token) {
    return (
      <p className="py-6 text-[14px] text-[#6b6b73]">
        {rich('Please {signIn} to write a review.', {
          signIn: <Link href="/auth" onClick={(e) => { e.preventDefault(); openSignIn(); }} className="text-[#111114] underline underline-offset-4">{t('sign in')}</Link>,
        })}
      </p>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { setError(t('Choose a star rating.')); return; }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, comment, ...(token && { token }) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(t(data.error || 'Your review could not be sent. Please try again.'));
        return;
      }
      onDone();
    } catch {
      setError(t('Your review could not be sent. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="py-6 grid gap-4 max-w-[640px]">
      <div>
        <p className="mb-2 text-[14px] text-[#111114]">{t('Your rating')}</p>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} aria-label={t(n === 1 ? '{n} star' : '{n} stars', { n })} aria-pressed={rating === n}>
              <Star size={26} strokeWidth={0} style={{ fill: n <= (hover || rating) ? INK : '#e3e3e3' }} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="review-comment" className="mb-2 block text-[14px] text-[#111114]">{t('Your review')}</label>
        <textarea
          id="review-comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('What did you like, and how did it work for your skin?')}
          className="w-full border border-[#dcdcdc] p-4 text-[14.5px] outline-none focus:border-[#111114] resize-y"
        />
      </div>
      {error && <p className="text-[13px] text-[#b91c1c]">{error}</p>}
      <button type="submit" disabled={busy} className="w-fit h-11 px-7 bg-[#111114] text-white text-[14px] font-semibold hover:bg-[#2a2a31] disabled:opacity-60">
        {busy ? t('Sending…') : t('Submit review')}
      </button>
    </form>
  );
}

/**
 * Product reviews (after Pitaka): a centred title, the average with black
 * stars and a 5→1 bar chart beside a "Write a review" button, then sort and
 * rating filters and the reviews themselves. Reviews hold a rating, a comment,
 * a date and the customer's username — no titles, photos or helpful votes yet.
 */
export default function Reviews({ productId }) {
  const { user } = useAuth();
  const t = useT();
  const isAdmin = user?.role === 'admin';
  const [reviews, setReviews] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [writing, setWriting] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [sort, setSort] = useState('latest');
  const [only, setOnly] = useState('all');
  const [shown, setShown] = useState(5);
  // From the review email: the star that was tapped and the customer's review token
  const [fromEmail, setFromEmail] = useState({ rating: 0, token: null });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stars = Number(params.get('review'));
    const token = params.get('rt');
    if ((stars >= 1 && stars <= 5) || token) {
      setFromEmail({ rating: stars >= 1 && stars <= 5 ? stars : 0, token: token || null });
      setWriting(true);
      document.getElementById('reviews')?.scrollIntoView({ block: 'start' });
    }
  }, []);

  // Once sent, drop the email's parameters so a refresh doesn't reopen the form
  const clearEmailParams = () => {
    if (!fromEmail.token && !fromEmail.rating) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('review');
    url.searchParams.delete('rt');
    window.history.replaceState(null, '', url.pathname + (url.search || '') + url.hash);
    setFromEmail({ rating: 0, token: null });
  };

  const load = async () => {
    try {
      const res = await fetch(`/api/reviews?product_id=${productId}`);
      if (res.ok) setReviews(await res.json());
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { if (productId) load(); }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (id) => {
    const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  const count = reviews.length;
  // One decimal, rounded from whole-star totals like the database's average at the top of the page (4.6, not 4.57)
  const average = count ? Math.round((reviews.reduce((t, r) => t + Number(r.rating), 0) * 10) / count) / 10 : 0;
  const bars = [5, 4, 3, 2, 1].map((n) => ({ n, pct: count ? (reviews.filter((r) => Number(r.rating) === n).length / count) * 100 : 0 }));

  const list = useMemo(() => {
    const filtered = only === 'all' ? reviews : reviews.filter((r) => Number(r.rating) === Number(only));
    const byDate = (a, b) => new Date(b.created_at) - new Date(a.created_at);
    const sorted = [...filtered].sort(
      sort === 'highest' ? (a, b) => b.rating - a.rating || byDate(a, b)
        : sort === 'lowest' ? (a, b) => a.rating - b.rating || byDate(a, b)
          : byDate,
    );
    return sorted;
  }, [reviews, sort, only]);

  return (
    <div className="py-4 md:py-8">
      <h2 className={`${headingFont} text-center text-[24px] md:text-[34px] font-medium uppercase text-[#111114]`}>{t('Reviews')}</h2>

      <div className="mt-10 md:mt-16">
        <p className="text-[15px] text-[#111114]">{t('Customer reviews')}</p>

        {/* Summary */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center gap-8 md:gap-14 pb-8 border-b border-[#ececec]">
          <div className="flex flex-col items-center text-center w-fit">
            <span className="text-[56px] font-light leading-none text-[#111114] tabular-nums">{count ? average.toFixed(1) : '–'}</span>
            <span className="mt-3"><Stars rating={average} size={24} gap="gap-1.5" /></span>
            <span className="mt-2 text-[14px] text-[#111114]">{t(count === 1 ? '{n} review' : '{n} reviews', { n: count })}</span>
          </div>

          <ul className="grid gap-2 w-full max-w-[320px]" aria-label={t('Ratings breakdown')}>
            {bars.map(({ n, pct }) => (
              <li key={n} className="flex items-center gap-4 text-[14px] text-[#111114]">
                <span className="w-2 tabular-nums">{n}</span>
                <span className="relative h-2 flex-1 bg-[#ececec]">
                  <span className="absolute inset-y-0 start-0 bg-[#111114]" style={{ width: `${pct}%` }} />
                </span>
              </li>
            ))}
          </ul>

          <div className="md:ms-auto">
            <button
              type="button"
              onClick={() => setWriting((v) => !v)}
              aria-expanded={writing}
              className="h-[50px] px-7 bg-[#111114] text-white text-[15px] font-semibold hover:bg-[#2a2a31] transition-colors"
            >
              {writing ? t('Close') : t('Write a review')}
            </button>
          </div>
        </div>

        {writing && (
          <div className="border-b border-[#ececec]">
            <WriteReview
              productId={productId}
              initialRating={fromEmail.rating}
              token={fromEmail.token}
              onDone={() => { setWriting(false); setThanks(true); clearEmailParams(); load(); }}
            />
          </div>
        )}
        {thanks && <p className="pt-5 text-[14px] text-[#15803d]">{t('Thank you, your review has been added.')}</p>}

        {count > 0 && (
          <>
            {/* Sort + filter */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Select id="review-sort" label={t('Sort reviews')} value={sort} onChange={setSort}
                options={[['latest', t('Sort by: Latest')], ['highest', t('Sort by: Highest rating')], ['lowest', t('Sort by: Lowest rating')]]} />
              <Select id="review-rating" label={t('Filter by rating')} value={only} onChange={(v) => { setOnly(v); setShown(5); }}
                options={[['all', t('Rating: All')], ...[5, 4, 3, 2, 1].map((n) => [String(n), t(n === 1 ? '{n} star' : '{n} stars', { n })])]} />
            </div>

            {/* Reviews */}
            <ul className="mt-4">
              {list.slice(0, shown).map((r) => {
                // The API sends "Sara M." (lib/reviewerName.js); older responses had the handle
                const name = r.name || displayName(r.username);
                return (
                  <li key={r.id} className="grid md:grid-cols-[240px_1fr] gap-4 md:gap-8 py-8 border-b border-[#ececec]">
                    <div className="flex items-center gap-3 self-start">
                      <span className="w-12 h-12 shrink-0 rounded-full border-[1.5px] border-[#111114] bg-[#f6f5f2] flex items-center justify-center text-[15px] font-semibold text-[#111114]">
                        {name.charAt(0)}
                      </span>
                      <span className="text-[16px] text-[#111114]"><bdi>{name}</bdi></span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <Stars rating={Number(r.rating)} size={20} gap="gap-1" />
                        <span className="text-[14px] text-[#6b6b73]">{timeAgo(r.created_at, t)}</span>
                      </div>
                      {r.comment
                        ? <p dir="auto" className="mt-4 text-[15.5px] leading-relaxed text-[#111114] whitespace-pre-line">{r.comment}</p>
                        : <p className="mt-4 text-[14px] text-[#6b6b73]">{t('Rated {n} out of 5.', { n: r.rating })}</p>}
                      {isAdmin && (
                        <button type="button" onClick={() => remove(r.id)} className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-[#b91c1c] hover:underline">
                          <Trash2 size={13} /> {t('Delete review')}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {list.length === 0 && <p className="py-8 text-[14px] text-[#6b6b73]">{t('No reviews with this rating yet.')}</p>}
            {list.length > shown && (
              <div className="mt-8 flex justify-center">
                <button type="button" onClick={() => setShown((n) => n + 5)} className="h-10 px-6 rounded-full border-[1.5px] border-[#111114] text-[13px] font-semibold hover:bg-[#111114] hover:text-white transition-colors">
                  {t('Show more reviews')}
                </button>
              </div>
            )}
          </>
        )}

        {loaded && count === 0 && !writing && (
          <p className="py-10 text-center text-[15px] text-[#6b6b73]">{t('No reviews yet. Be the first to share how it worked for you.')}</p>
        )}
      </div>
    </div>
  );
}

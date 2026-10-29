import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { readReviewToken } from '@/lib/reviewTokens';
import { refreshProductPages } from '@/lib/productPages';
import { reviewerName } from '@/lib/reviewerName';

const MAX_COMMENT = 2000;

/**
 * Write a review. The reviewer is the signed-in customer, or the customer named
 * by a review token from the post-delivery email (lib/reviewTokens.js), never a
 * user id sent by the browser. One review per customer per product: writing
 * again replaces the earlier one.
 */
export async function POST(request) {
  try {
    const { productId, rating, comment, token } = await request.json();

    let userId = null;
    const fromToken = token ? readReviewToken(token) : null;
    if (fromToken) {
      if (Number(fromToken.productId) !== Number(productId)) {
        return NextResponse.json({ error: 'This review link is for a different product.' }, { status: 403 });
      }
      userId = fromToken.userId;
    } else {
      const session = await getServerSession(authOptions);
      userId = session?.user?.id ? Number(session.user.id) : null;
    }
    if (!userId) {
      return NextResponse.json({ error: token ? 'This review link has expired. Please sign in to write your review.' : 'Please sign in to write a review.' }, { status: 401 });
    }

    const stars = Number(rating);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json({ error: 'Choose a rating from 1 to 5 stars.' }, { status: 400 });
    }
    const text = String(comment ?? '').trim().slice(0, MAX_COMMENT);

    const { rows: product } = await db.query('SELECT id FROM products WHERE id = $1', [Number(productId)]);
    if (!product.length) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const { rows: existing } = await db.query(
      'SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1',
      [Number(productId), userId],
    );
    const result = existing.length
      ? await db.query(
        'UPDATE reviews SET rating = $1, comment = $2, created_at = NOW() WHERE id = $3 RETURNING *',
        [stars, text, existing[0].id],
      )
      : await db.query(
        'INSERT INTO reviews (product_id, rating, comment, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [Number(productId), stars, text, userId],
      );

    refreshProductPages();
    return NextResponse.json(result.rows[0], { status: existing.length ? 200 : 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const result = await db.query(
      `SELECT
        r.id,
        r.product_id,
        r.rating,
        r.comment,
        r.created_at,
        u.first_name,
        u.last_name,
        u.username
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC`,
      [productId]
    );

    // "Sara M." only: the account's names and handle (which can be an email) never leave the server
    return NextResponse.json(result.rows.map(({ first_name: _first, last_name: _last, username: _handle, ...review }) => ({
      ...review,
      name: reviewerName({ first_name: _first, last_name: _last, username: _handle }),
    })));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/** Admins remove a review from the product page (Reviews.js). */
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete reviews.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = Number(searchParams.get('id'));
    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required.' }, { status: 400 });
    }

    const result = await db.query('DELETE FROM reviews WHERE id = $1 RETURNING id', [reviewId]);
    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'Review not found.' }, { status: 404 });
    }
    refreshProductPages();
    return NextResponse.json({ message: 'Review deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

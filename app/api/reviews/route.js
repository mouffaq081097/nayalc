
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken'; // Import jsonwebtoken

export async function POST(request) {
  try {
    const { productId, rating, comment, userId } = await request.json();

    if (!productId || !rating || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await db.query(
      'INSERT INTO reviews (product_id, rating, comment, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [productId, rating, comment, userId]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
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
        u.username
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC`,
      [productId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    // 1. Authenticate and Authorize (check for admin role)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = decoded.userId;

    if (userId !== 2) { // Allow deletion only for userId 2
      return NextResponse.json({ error: 'Forbidden: Only user 2 can delete reviews' }, { status: 403 });
    }

    // 2. Extract review ID from request (assuming it's passed as a query parameter)
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required.' }, { status: 400 });
    }

    // 3. Delete the review from the database
    const result = await db.query('DELETE FROM reviews WHERE id = $1 RETURNING id', [reviewId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'Review not found.' }, { status: 404 });
    }

    // 4. Return appropriate response
    return NextResponse.json({ message: 'Review deleted successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


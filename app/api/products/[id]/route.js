import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
  const { id } = params;

  try {
    // Fetch product details
    const productResult = await db.query(
      `SELECT
        p.id, p.name, p.description, p.price, p.stock_quantity, p.status, p.product_type, p.vendor, p.long_description, p.benefits, p.how_to_use, p.specs, p.autoship_save, p.gtin, p.product_dimensions, p.item_weight, p.item_model_number, p.unit_count, p.brand_id, p.category_id,
        b.name as brand_name
      FROM
        products p
      LEFT JOIN
        brands b ON p.brand_id = b.id
      WHERE p.id = $1`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    const product = productResult.rows[0];

    // Fetch product images
    const imagesResult = await db.query(
      `SELECT image_url
       FROM product_images
       WHERE product_id = $1
       ORDER BY display_order ASC`,
      [id]
    );

    const images = imagesResult.rows.map(row => row.image_url);

    // Add mock values for properties not in the database
    const processedProduct = {
      ...product,
      brand: product.brand_name, // Map brand_name to brand
      rating: 4.5, // Mock value
      reviewCount: 100, // Mock value
      sizes: ['15ml', '30ml', '50ml'], // Mock value
    };

    // Return the product data with the images array
    return NextResponse.json({ ...processedProduct, images });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ message: 'Error fetching product', error: error.message }, { status: 500 });
  }
}
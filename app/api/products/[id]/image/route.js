import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

export async function POST(request, { params }) {
  const resolvedParams = await Promise.resolve(params);
  const productId = resolvedParams.id;
  const client = await db.connect();

  try {
    const formData = await request.formData();
    const imageFile = formData.get('productImage');

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ message: 'No image file provided.' }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const uploadResult = await uploadImageToCloudinary(imageBuffer);
    const imageUrl = uploadResult.secure_url;

    // Assuming you have a product_images table to store multiple images per product
    // You might want to add a flag for 'is_main' if this is for a main image
    const insertImageSql = 'INSERT INTO product_images (product_id, image_url, is_main) VALUES ($1, $2, TRUE) RETURNING id';
    await client.query(insertImageSql, [productId, imageUrl]);

    return NextResponse.json({ message: 'Image uploaded successfully', imageUrl }, { status: 201 });

  } catch (error) {
    console.error(`Error uploading image for product ${productId}:`, error);
    return NextResponse.json({ message: 'Error uploading image', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

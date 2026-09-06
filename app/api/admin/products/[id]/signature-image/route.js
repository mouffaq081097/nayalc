import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

/**
 * Dedicated, narrow endpoint for the homepage-images admin page: sets or clears
 * just one product's `signature_image_url` — the photo used for that product
 * when it's featured in the homepage's "Signature selection" spotlight, instead
 * of its regular catalog photo. Deliberately separate from PUT /api/products/[id],
 * which overwrites the whole product record from a full edit form.
 */
export async function POST(request, context) {
  const { id } = await context.params;
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');
    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ message: 'Image is required.' }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const uploadResult = await uploadImageToCloudinary(imageBuffer);

    const { rowCount } = await db.query('UPDATE products SET signature_image_url = $1 WHERE id = $2', [uploadResult.secure_url, id]);
    if (rowCount === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Signature photo updated', signatureImageUrl: uploadResult.secure_url });
  } catch (error) {
    console.error(`Error updating signature image for product ${id}:`, error);
    return NextResponse.json({ message: 'Error updating signature image', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const { id } = await context.params;
  try {
    const { rowCount } = await db.query('UPDATE products SET signature_image_url = NULL WHERE id = $1', [id]);
    if (rowCount === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Reverted to the main product photo' });
  } catch (error) {
    console.error(`Error clearing signature image for product ${id}:`, error);
    return NextResponse.json({ message: 'Error clearing signature image', error: error.message }, { status: 500 });
  }
}

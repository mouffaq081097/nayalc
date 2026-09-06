import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

/**
 * Dedicated, narrow endpoint for the homepage-images admin page: sets or clears
 * just one brand's `imageurl` — the photo used for that house on the homepage's
 * "Provenance" (Our three houses) section. Deliberately separate from
 * PUT /api/brands/[id], which requires (and would overwrite) the brand name too.
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

    const { rowCount } = await db.query('UPDATE brands SET imageurl = $1 WHERE id = $2', [uploadResult.secure_url, id]);
    if (rowCount === 0) {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Brand photo updated', imageUrl: uploadResult.secure_url });
  } catch (error) {
    console.error(`Error updating image for brand ${id}:`, error);
    return NextResponse.json({ message: 'Error updating brand image', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const { id } = await context.params;
  try {
    const { rowCount } = await db.query('UPDATE brands SET imageurl = NULL WHERE id = $1', [id]);
    if (rowCount === 0) {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Reverted to the best-rated product photo' });
  } catch (error) {
    console.error(`Error clearing image for brand ${id}:`, error);
    return NextResponse.json({ message: 'Error clearing brand image', error: error.message }, { status: 500 });
  }
}

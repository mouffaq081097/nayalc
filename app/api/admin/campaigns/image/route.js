import { NextResponse } from 'next/server';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

/** POST /api/admin/campaigns/image — admin only (middleware). Uploads a banner photo; returns { imageUrl }. */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    if (!file || file.size === 0) return NextResponse.json({ message: 'Choose a photo to upload.' }, { status: 400 });
    const result = await uploadImageToCloudinary(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error('Error uploading campaign photo:', error);
    return NextResponse.json({ message: 'The upload failed. Please try again.' }, { status: 500 });
  }
}

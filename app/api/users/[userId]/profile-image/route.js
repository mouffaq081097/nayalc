import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

export async function POST(request, { params }) {
  const { userId } = await params;
  const token = await getToken({ req: request });

  if (!token || String(token.sub) !== String(userId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImageToCloudinary(buffer);

    await db.query(
      'UPDATE users SET profile_image = $1 WHERE id = $2',
      [result.secure_url, userId]
    );

    return NextResponse.json({ 
      message: 'Profile image updated',
      imageUrl: result.secure_url 
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { userId } = await params;
  const token = await getToken({ req: request });

  if (!token || String(token.sub) !== String(userId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await db.query(
      'UPDATE users SET profile_image = NULL WHERE id = $1',
      [userId]
    );

    return NextResponse.json({ message: 'Profile image removed' });
  } catch (error) {
    console.error('Error removing profile image:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

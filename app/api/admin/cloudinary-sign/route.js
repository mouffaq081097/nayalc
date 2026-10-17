import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';

const FOLDER = 'homepage-videos';

/**
 * POST /api/admin/cloudinary-sign
 * Admin only (gated by middleware). Signs a direct browser → Cloudinary upload,
 * so large files (videos) never pass through our serverless function, whose
 * request body Vercel caps at 4.5 MB. The signature covers only the timestamp
 * and our folder; the browser then POSTs the file to
 * https://api.cloudinary.com/v1_1/{cloudName}/video/upload.
 */
export async function POST() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ message: 'Cloudinary is not configured.' }, { status: 500 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder: FOLDER }, apiSecret);
  return NextResponse.json({ cloudName, apiKey, timestamp, signature, folder: FOLDER });
}

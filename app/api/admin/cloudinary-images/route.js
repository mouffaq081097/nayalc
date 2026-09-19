import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';
import { requireAdmin } from '@/lib/adminAuth';

const PAGE_SIZE = 60;

/**
 * GET /api/admin/cloudinary-images?cursor=...
 * Admin only. Lists images already uploaded to the store's Cloudinary account,
 * newest first, so an admin can reuse one instead of uploading the same file
 * again. Uses api.resources (available on every Cloudinary plan) rather than
 * the Search API, and pages with Cloudinary's own next_cursor.
 */
export async function GET(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') || undefined;

    const result = await cloudinary.api.resources({
      resource_type: 'image',
      type: 'upload',
      max_results: PAGE_SIZE,
      next_cursor: cursor,
    });

    const images = (result.resources || []).map((r) => ({
      publicId: r.public_id,
      url: r.secure_url,
      width: r.width,
      height: r.height,
      format: r.format,
      bytes: r.bytes,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ images, nextCursor: result.next_cursor || null });
  } catch (error) {
    console.error('Error listing Cloudinary images:', error);
    return NextResponse.json(
      { message: 'Could not load the Cloudinary library', error: error.message },
      { status: 500 },
    );
  }
}

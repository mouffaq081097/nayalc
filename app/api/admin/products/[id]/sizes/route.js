import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getLinkedSizes, setLinkedSizes } from '@/lib/sizeGroups';
import { refreshProductPages } from '@/lib/productPages';

// The product editor's "Sizes" card: the other products sold as sizes of this one
export async function GET(request, { params }) {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    const { id } = await params;
    try {
        return NextResponse.json({ sizes: await getLinkedSizes(id) });
    } catch (error) {
        console.error('Loading sizes failed:', error);
        return NextResponse.json({ message: 'Could not load sizes', error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    const { id } = await params;
    try {
        const { productIds } = await request.json();
        if (!Array.isArray(productIds)) {
            return NextResponse.json({ message: 'productIds must be a list' }, { status: 400 });
        }
        const sizes = await setLinkedSizes(id, productIds);
        refreshProductPages();
        return NextResponse.json({ sizes });
    } catch (error) {
        console.error('Saving sizes failed:', error);
        return NextResponse.json({ message: 'Could not save sizes', error: error.message }, { status: 500 });
    }
}

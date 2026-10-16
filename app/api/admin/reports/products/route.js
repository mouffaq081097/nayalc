import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getProductReport, buildProductReportWorkbook, mostViewed, mostOrdered } from '@/lib/productReport';

// GET ?from=YYYY-MM-DD&to=YYYY-MM-DD (Dubai days, inclusive)
//   default: JSON for the admin Reports page (totals + top 10 of each list)
//   &format=xlsx: the full Excel report
export async function GET(request) {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const params = new URL(request.url).searchParams;
    const from = params.get('from');
    const to = params.get('to');

    try {
        const report = await getProductReport({ from, to });

        if (params.get('format') === 'xlsx') {
            const file = await buildProductReportWorkbook(report);
            return new NextResponse(file, {
                status: 200,
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="product-report-${from}-to-${to}.xlsx"`,
                    'Cache-Control': 'no-store',
                },
            });
        }

        return NextResponse.json({
            from: report.from,
            to: report.to,
            viewsTrackedSince: report.viewsTrackedSince,
            totals: report.totals,
            mostViewed: mostViewed(report).slice(0, 10),
            mostOrdered: mostOrdered(report).slice(0, 10),
        });
    } catch (error) {
        const invalid = error.message === 'Choose a valid date range.';
        if (!invalid) console.error('Product report failed:', error);
        return NextResponse.json({ message: invalid ? error.message : 'The report could not be generated.' }, { status: invalid ? 400 : 500 });
    }
}

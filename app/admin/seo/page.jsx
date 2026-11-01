'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Images, ListChecks, ShoppingBag, Sparkles } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageLoader from '../../components/PageLoader';
import { apiErrorMessage } from '../products/_components/productAdmin';
import { secondary, subdued, text } from '../_components/EditorFields';
import { SeoTabs } from './_components/seoUi';

const Tool = ({ href, icon: Icon, title, description, stats }) => (
  <Link href={href} className="sp-card sp-card-pad flex flex-col gap-3 hover:shadow-md transition-shadow group">
    <div className="flex items-start gap-3">
      <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#f1f1f1' }}>
        <Icon size={17} style={secondary} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="sp-section-title">{title}</h2>
        <p className="text-[12.5px] mt-0.5" style={subdued}>{description}</p>
      </div>
      <ArrowRight size={16} className="shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" style={subdued} />
    </div>
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3" style={{ borderTop: '1px solid var(--sp-border)' }}>
      {stats.map(([label, value, tone]) => (
        <div key={label}>
          <dt className="text-[12px]" style={subdued}>{label}</dt>
          <dd className="text-[18px] font-semibold tabular-nums" style={tone ? { color: tone } : text}>{value}</dd>
        </div>
      ))}
    </dl>
  </Link>
);

const ATTENTION = '#b42318';

export default function SeoOverviewPage() {
  const { fetchWithAuth } = useAppContext();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWithAuth('/api/admin/seo/overview')
      .then(res => res.json())
      .then(setData)
      .catch(e => setError(apiErrorMessage(e, 'Could not load the SEO overview.')));
  }, [fetchWithAuth]);

  if (!data && !error) return <PageLoader />;

  return (
    <div className="max-w-[1080px] mx-auto space-y-4">
      <div>
        <h1 className="text-[20px] font-semibold leading-tight" style={text}>SEO</h1>
        <p className="text-[13px] mt-0.5" style={subdued}>How your products and photos appear in Google Search, Google Images and Google Shopping.</p>
      </div>
      <SeoTabs current="/admin/seo" />

      {error ? (
        <div className="sp-card sp-card-pad text-[13px]" style={{ color: ATTENTION }}>{error}</div>
      ) : (
        <>
          {!data.aiReady && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-[13px]" style={{ background: '#fff4e5', border: '1px solid #ffd79d', color: '#5e4200' }}>
              <Sparkles size={16} className="shrink-0 mt-0.5" />
              <span>AI suggestions are off: the Gemini API key (GEMINI_API_KEY) isn&apos;t set. Everything else here works without it.</span>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <Tool
              href="/admin/seo/products"
              icon={ListChecks}
              title="Product listings"
              description="The title and description Google shows for each product page. AI writes them from your product details."
              stats={[
                ['Live products', data.products.live],
                ['With their own title', data.products.customTitle],
                ['With their own description', data.products.customDescription],
                ['Still on automatic text', data.products.automatic, data.products.automatic ? '#8a6100' : null],
              ]}
            />
            <Tool
              href="/admin/seo/images"
              icon={Images}
              title="Image alt text"
              description="A short description of every photo on the site, for screen readers and Google Images."
              stats={[
                ['Images', data.images.total],
                ['Missing alt text', data.images.missing, data.images.missing ? ATTENTION : null],
              ]}
            />
            <Tool
              href="/admin/seo/merchant"
              icon={ShoppingBag}
              title="Google Merchant"
              description="Each collection's Google product category, and what the product feed sends to Merchant Center."
              stats={[
                ['In the feed', data.merchant.inFeed],
                ['Left out', data.merchant.leftOut, data.merchant.leftOut ? ATTENTION : null],
                ['With a warning', data.merchant.withIssues, data.merchant.withIssues ? '#8a6100' : null],
                ['On the brand default', data.merchant.brandDefault, data.merchant.brandDefault ? '#8a6100' : null],
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}

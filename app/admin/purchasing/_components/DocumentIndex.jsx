'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import PageLoader from '@/app/components/PageLoader';
import { EmptyState, SearchBox, ViewPill } from '../../_components/IndexToolbar';
import { ErrorBanner, MobileCard, PageHeader } from './purchasingUi';

/**
 * A purchasing list page: view pills, search and a table whose rows open the document.
 *   views    [{ id, label, match(row) }] — the first is the default
 *   columns  [{ label, align, render(row) }]
 */
export default function DocumentIndex({ title, subtitle, rows, error, views, columns, searchText, rowHref, newHref, newLabel, emptyIcon, emptyTitle, emptyText, headerActions }) {
  const router = useRouter();
  const [view, setView] = useState(views[0].id);
  const [query, setQuery] = useState('');

  // ?view= deep links from the overview page (read once; useSearchParams would need a Suspense boundary)
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('view');
    if (wanted && views.some(v => v.id === wanted)) setView(wanted);
  }, [views]);

  // The views can change once the user's roles are known
  useEffect(() => {
    if (!views.some(v => v.id === view)) setView(views[0].id);
  }, [views, view]);

  const counts = useMemo(() => Object.fromEntries(views.map(v => [v.id, (rows || []).filter(v.match).length])), [rows, views]);
  const shown = useMemo(() => {
    const match = views.find(v => v.id === view)?.match || (() => true);
    const q = query.trim().toLowerCase();
    return (rows || []).filter(match).filter(r => !q || searchText(r).toLowerCase().includes(q));
  }, [rows, views, view, query, searchText]);

  if (!rows && !error) return <PageLoader />;

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={(
          <>
            {headerActions}
            {newHref && <Link href={newHref} className="sp-btn sp-btn-primary"><Plus size={14} />{newLabel}</Link>}
          </>
        )}
      />
      <ErrorBanner>{error}</ErrorBanner>

      <div className="sp-card overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--sp-border)' }}>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
            {views.map(v => (
              <ViewPill key={v.id} active={view === v.id} count={counts[v.id]} onClick={() => setView(v.id)}>{v.label}</ViewPill>
            ))}
          </div>
          <SearchBox value={query} onChange={setQuery} placeholder="Search" />
        </div>

        {shown.length === 0 ? (
          <EmptyState icon={emptyIcon} title={rows?.length ? 'Nothing matches' : emptyTitle} description={rows?.length ? 'Try another view or search.' : emptyText} />
        ) : (
          <>
          {/* Phones: one card per document — the first column is the heading, the second its badge */}
          <div className="md:hidden">
            {shown.map(row => (
              <MobileCard
                key={row.id}
                title={columns[0].render(row)}
                badge={columns[1]?.render(row)}
                fields={columns.slice(2).map(c => ({ label: c.label, value: c.render(row) }))}
                onClick={() => router.push(rowHref(row))}
              />
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="sp-table">
              <thead>
                <tr>{columns.map(c => <th key={c.label} className={c.align === 'right' ? 'text-right' : undefined}>{c.label}</th>)}</tr>
              </thead>
              <tbody>
                {shown.map(row => (
                  <tr key={row.id} onClick={() => router.push(rowHref(row))} className="cursor-pointer">
                    {columns.map(c => (
                      <td key={c.label} className={`${c.align === 'right' ? 'text-right tabular-nums' : ''} ${c.nowrap === false ? '' : 'whitespace-nowrap'}`}>
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}

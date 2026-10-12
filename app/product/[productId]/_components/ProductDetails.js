'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { LAVENDER, INK, BORDER, WELL, EYEBROW, SECTION_TITLE } from './theme';

const lines = (text) => (text || '').split('\n').map(s => s.trim()).filter(Boolean);

/**
 * The long-form product information. Tabs on desktop, an accordion on mobile.
 * Every panel stays in the DOM (hidden, not unmounted) so search engines index
 * the full description, benefits and ingredients.
 */
export default function ProductDetails({ product }) {
  const sections = [
    (product.long_description || product.description) && {
      id: 'overview',
      label: 'Overview',
      body: (
        <div className="space-y-3 max-w-3xl">
          {lines(product.long_description || product.description).map((p, i) => (
            <p key={i} className="text-[15px] text-gray-600 leading-[1.75]">{p}</p>
          ))}
          {(product.size || product.form) && (
            <dl className="flex flex-wrap gap-x-8 gap-y-2 pt-3">
              {product.size && <Spec term="Size" value={product.size} />}
              {product.form && <Spec term="Texture" value={product.form} />}
              {product.brand && <Spec term="Brand" value={product.brand} />}
            </dl>
          )}
        </div>
      ),
    },
    product.benefits && {
      id: 'benefits',
      label: 'Benefits',
      body: (
        <ul className="grid sm:grid-cols-2 gap-3">
          {lines(product.benefits).map((b, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl p-3.5" style={{ background: WELL }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-px" style={{ background: LAVENDER }}>
                <Check size={11} className="text-white" strokeWidth={3} />
              </span>
              <span className="text-[14px] text-gray-700 leading-relaxed">{b.replace(/^[-•*]\s*/, '')}</span>
            </li>
          ))}
        </ul>
      ),
    },
    (product.how_to_use || product.how_to_use_video) && {
      id: 'how-to-use',
      label: 'How to use',
      body: (
        <div className={`grid gap-6 ${product.how_to_use_video ? 'lg:grid-cols-2' : ''}`}>
          {product.how_to_use && (
            <ol className="space-y-4">
              {lines(product.how_to_use).map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold tabular-nums"
                    style={{ background: 'rgba(147,104,236,0.1)', color: LAVENDER }}>
                    {i + 1}
                  </span>
                  <p className="text-[14px] text-gray-600 leading-relaxed pt-1">{step.replace(/^\d+[.)]\s*/, '')}</p>
                </li>
              ))}
            </ol>
          )}
          {/^https?:\/\//.test(product.how_to_use_video || '') && (
            <video src={product.how_to_use_video} controls preload="metadata" playsInline
              className="w-full rounded-2xl bg-black aspect-video" />
          )}
        </div>
      ),
    },
    product.ingredients && {
      id: 'ingredients',
      label: 'Ingredients',
      body: (
        <div className="max-w-3xl space-y-3">
          <p className="text-[13px] text-gray-500 leading-[1.8]">{product.ingredients}</p>
          <p className="text-[11px] text-gray-400">Ingredient lists may change. Always check the packaging of the product you receive.</p>
        </div>
      ),
    },
  ].filter(Boolean);

  const [active, setActive] = useState(sections[0]?.id);
  const [openMobile, setOpenMobile] = useState(() => new Set(sections[0] ? [sections[0].id] : []));

  if (sections.length === 0) return null;

  const toggleMobile = (id) => setOpenMobile(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <section id="details" className="scroll-mt-28">
      <div className="space-y-1 mb-5">
        <p className={EYEBROW}>The details</p>
        <h2 className={SECTION_TITLE}>About this product</h2>
      </div>

      {/* Desktop tabs */}
      <div className="hidden md:block">
        <div role="tablist" className="flex gap-1 border-b mb-6" style={{ borderColor: BORDER }}>
          {sections.map(s => (
            <button key={s.id} role="tab" id={`tab-${s.id}`} aria-selected={active === s.id} aria-controls={`panel-${s.id}`}
              onClick={() => setActive(s.id)}
              className="relative px-4 py-3 text-[14px] font-semibold transition-colors"
              style={{ color: active === s.id ? INK : '#9ca3af' }}>
              {s.label}
              {active === s.id && <span className="absolute left-3 right-3 -bottom-px h-[2px] rounded-full" style={{ background: LAVENDER }} />}
            </button>
          ))}
        </div>
        {sections.map(s => (
          <div key={s.id} role="tabpanel" id={`panel-${s.id}`} aria-labelledby={`tab-${s.id}`} hidden={active !== s.id}>
            {s.body}
          </div>
        ))}
      </div>

      {/* Mobile accordion */}
      <div className="md:hidden rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {sections.map((s, i) => {
          const open = openMobile.has(s.id);
          return (
            <div key={s.id} style={i > 0 ? { borderTop: `1px solid ${BORDER}` } : undefined}>
              <button onClick={() => toggleMobile(s.id)} aria-expanded={open}
                className="w-full flex items-center justify-between px-4 py-4 text-left">
                <span className="text-[15px] font-semibold" style={{ color: INK }}>{s.label}</span>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              <div hidden={!open} className="px-4 pb-5">{s.body}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Spec({ term, value }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-gray-400">{term}</dt>
      <dd className="text-[14px] font-semibold text-gray-800">{value}</dd>
    </div>
  );
}

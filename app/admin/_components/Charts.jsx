'use client';
import React, { useMemo } from 'react';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

// Catmull-Rom → cubic bézier for smooth Shopify-style lines
function smoothPath(pts) {
  if (!pts || pts.length < 2) return '';
  if (pts.length === 2) return `M${pts[0][0]} ${pts[0][1]} L${pts[1][0]} ${pts[1][1]}`;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function scalePoints(data, w, h, pad = 4, sharedMax) {
  if (!data || !data.length) return [];
  const max = sharedMax != null ? sharedMax : Math.max(...data, 0);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  return data.map((v, i) => [
    pad + i * stepX,
    h - pad - ((v - min) / range) * (h - pad * 2),
  ]);
}

/* ─── Sparkline (KPI cards) ───────────────────────────────────────────────── */

export function Sparkline({ data, color = '#1f6fdb', width = 130, height = 38 }) {
  const pts = useMemo(() => scalePoints(data, width, height, 5), [data, width, height]);
  if (!pts.length) return <div style={{ width, height }} />;
  const area = `${smoothPath(pts)} L${pts[pts.length - 1][0]} ${height} L${pts[0][0]} ${height} Z`;
  const id = `sl-${color.replace('#', '')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Sales-over-time line chart (current vs comparison) ──────────────────── */

export function TimeChart({
  current = [],
  previous = [],
  xLabels = [],
  height = 260,
  format = v => v,
}) {
  const W = 760;
  const H = height;
  const padL = 52, padR = 12, padT = 16, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = Math.max(...current, ...previous, 1);
  const niceMax = niceCeil(max);

  const toPts = (arr) => {
    if (!arr.length) return [];
    const stepX = arr.length > 1 ? innerW / (arr.length - 1) : 0;
    return arr.map((v, i) => [
      padL + i * stepX,
      padT + innerH - (v / niceMax) * innerH,
    ]);
  };
  const curPts = toPts(current);
  const prevPts = toPts(previous);
  const yTicks = [0, niceMax / 2, niceMax];

  const area = curPts.length
    ? `${smoothPath(curPts)} L${curPts[curPts.length - 1][0]} ${padT + innerH} L${curPts[0][0]} ${padT + innerH} Z`
    : '';

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block">
      <defs>
        <linearGradient id="tc-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f6fdb" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#1f6fdb" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines + y labels */}
      {yTicks.map((t, i) => {
        const y = padT + innerH - (t / niceMax) * innerH;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#ececec" strokeWidth="1" />
            <text x={padL - 8} y={y + 3.5} textAnchor="end" fontSize="11" fill="#8a8a8a">{format(t)}</text>
          </g>
        );
      })}

      {/* x labels */}
      {xLabels.map((lbl, i) => {
        if (!lbl) return null;
        const stepX = current.length > 1 ? innerW / (current.length - 1) : 0;
        const x = padL + i * stepX;
        return <text key={i} x={x} y={H - 8} textAnchor="middle" fontSize="11" fill="#8a8a8a">{lbl}</text>;
      })}

      {/* comparison (dashed) */}
      {prevPts.length > 0 && (
        <path d={smoothPath(prevPts)} fill="none" stroke="#9fc3ef" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
      )}

      {/* current */}
      {area && <path d={area} fill="url(#tc-area)" />}
      {curPts.length > 0 && (
        <path d={smoothPath(curPts)} fill="none" stroke="#1f6fdb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function niceCeil(n) {
  if (n <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(n)));
  const norm = n / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

/* ─── Donut ───────────────────────────────────────────────────────────────── */

export function Donut({ segments = [], size = 150, thickness = 20, centerLabel, centerSub }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f1f1" strokeWidth={thickness} />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * c;
          const el = (
            <circle
              key={i}
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={seg.color} strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      {(centerLabel || centerSub) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[17px] font-semibold leading-none" style={{ color: 'var(--sp-text)' }}>{centerLabel}</span>
          {centerSub && <span className="text-[11px] mt-1" style={{ color: 'var(--sp-text-subdued)' }}>{centerSub}</span>}
        </div>
      )}
    </div>
  );
}

/* ─── Horizontal bar list ─────────────────────────────────────────────────── */

export function BarList({ items = [], color = '#1f6fdb' }) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] inline-flex items-center gap-2" style={{ color: 'var(--sp-text)' }}>
              {it.dot && <span className="w-2.5 h-2.5 rounded-full" style={{ background: it.color || color }} />}
              {it.label}
            </span>
            <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--sp-text)' }}>{it.display}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f1f1' }}>
            <div className="h-full rounded-full" style={{ width: `${(it.value / max) * 100}%`, background: it.color || color }} />
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-[13px] py-4 text-center" style={{ color: 'var(--sp-text-subdued)' }}>No data yet</p>
      )}
    </div>
  );
}

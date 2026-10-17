'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container } from '../ui/Container';
import { headingFont } from './SectionHeading';

const LAVENDER = 'rgb(147,104,236)';

function remaining(endsAt) {
  const ms = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const s = Math.floor(ms / 1000);
  return { ms, days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), mins: Math.floor((s % 3600) / 60), secs: s % 60 };
}

const pad = (n) => String(n).padStart(2, '0');

/** Ticks once a second. Renders nothing on the server, so the time can't mismatch hydration. */
function Countdown({ endsAt, onEnd }) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    const tick = () => {
      const r = remaining(endsAt);
      setLeft(r);
      if (r.ms === 0) onEnd();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, onEnd]);

  const units = left
    ? [[left.days, 'days'], [left.hours, 'hrs'], [left.mins, 'min'], [left.secs, 'sec']]
    : [['–', 'days'], ['–', 'hrs'], ['–', 'min'], ['–', 'sec']];

  return (
    <div className="flex items-center gap-1.5" aria-label="Time left">
      {units.map(([n, label]) => (
        <span key={label} className="flex flex-col items-center justify-center w-[54px] h-[54px] md:w-[60px] md:h-[60px] rounded-xl bg-gray-900 text-white">
          <span className="text-[19px] md:text-[21px] font-semibold tabular-nums leading-none">{typeof n === 'number' ? pad(n) : n}</span>
          <span className="mt-1 text-[9.5px] uppercase tracking-[0.1em] text-white/60">{label}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * The live homepage campaign from Admin → Homepage → Campaigns (White Friday,
 * National Day…). The server passes the one running now; this hides it the
 * moment it ends, so a stale countdown never sits at zero.
 */
export function CampaignBanner({ campaign }) {
  const [ended, setEnded] = useState(false);
  if (!campaign || ended) return null;

  return (
    <section aria-label={campaign.title} className="py-6 md:py-8 bg-white">
      <Container wide>
        <div className="grid md:grid-cols-2 rounded-[24px] overflow-hidden bg-[#f5f5f6]">
          <div className="order-2 md:order-1 flex flex-col justify-center gap-4 p-6 md:p-10 lg:p-12">
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase" style={{ color: LAVENDER }}>
              {campaign.showCountdown ? 'Ends soon' : 'Limited time'}
            </p>
            <h2 className={`${headingFont} text-[26px] md:text-[40px] font-medium uppercase leading-[1.1] text-[#111114] text-balance`}>
              {campaign.title}
            </h2>
            {campaign.subtitle && <p className="max-w-md text-[14.5px] md:text-[15.5px] leading-relaxed text-gray-600">{campaign.subtitle}</p>}
            {campaign.showCountdown && <Countdown endsAt={campaign.endsAt} onEnd={() => setEnded(true)} />}
            <Link
              href={campaign.link}
              className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-[13px] font-medium text-white transition-colors hover:bg-gray-700"
            >
              {campaign.ctaLabel} <ArrowRight size={15} />
            </Link>
          </div>
          <div className="order-1 md:order-2 relative aspect-[16/10] md:aspect-auto md:min-h-[340px] bg-gray-200">
            {campaign.imageUrl && (
              <Image src={campaign.imageUrl} alt={campaign.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

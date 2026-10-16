'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { SectionHeading, Pill } from './home/SectionHeading';
import { INSTAGRAM_URL } from '@/lib/seo';

const LAVENDER = 'rgb(147,104,236)';

/**
 * The latest posts from Admin → Social as an edge-to-edge strip under a
 * centred title: six across on desktop, three across (two rows) on phones.
 */
export function SocialFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/social-posts')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (!cancelled && Array.isArray(data)) setPosts(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="pt-14 md:pt-24 bg-white">
      <div className="flex flex-col items-center px-4">
        <p className="mb-3 text-[13px] font-semibold tracking-[0.1em] uppercase" style={{ color: LAVENDER }}>@nayalc</p>
        <SectionHeading title="Follow the glow" />
        <Pill href={INSTAGRAM_URL} external className="-mt-3 md:-mt-6 mb-8 md:mb-10">Follow us on Instagram</Pill>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-[2px]">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square bg-[#f6f5f2] animate-pulse" />)
          : posts.slice(0, 6).map((post, i) => (
              <a
                key={post.id}
                href={post.instagram_url || INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram post ${i + 1}`}
                className="group relative block aspect-square overflow-hidden bg-[#f6f5f2]"
              >
                <Image src={post.image_url} alt={post.caption || ''} fill sizes="(max-width: 768px) 33vw, 17vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
              </a>
            ))}
      </div>
    </section>
  );
}

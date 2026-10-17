'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Play, Pause } from 'lucide-react';
import { Container } from '../ui/Container';
import { useHomepageImage } from '../../hooks/useHomepageImages';
import { headingFont } from './SectionHeading';

const LAVENDER = 'rgb(147,104,236)';

// Cloudinary serves a resized, auto-quality copy and a still frame for the poster
const deliver = (src) => (src.includes('/video/upload/') ? src.replace('/video/upload/', '/video/upload/q_auto,w_1000/') : src);
const posterOf = (src) => (src.includes('/video/upload/') ? src.replace('/video/upload/', '/video/upload/so_0,w_1000/').replace(/\.(mp4|mov|webm|m4v)$/i, '.jpg') : undefined);

/** One tall video: plays muted on loop while on screen; the corner button pauses or plays it. */
function VideoTile({ src, alt }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const pausedByUser = useRef(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // Visitors who ask for less motion start paused
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) pausedByUser.current = true;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !pausedByUser.current) video.play().catch(() => {});
      else if (!entry.isIntersecting) video.pause();
    }, { threshold: 0.35 });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) { pausedByUser.current = false; video.play().catch(() => {}); }
    else { pausedByUser.current = true; video.pause(); }
  };

  return (
    <div className="relative aspect-[9/10] overflow-hidden bg-[#1a1a1d]">
      <video
        ref={ref}
        src={deliver(src)}
        poster={posterOf(src)}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause video' : 'Play video'}
        className="absolute right-3 bottom-3 md:right-4 md:bottom-4 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/75 transition-colors"
      >
        {playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
      </button>
    </div>
  );
}

/**
 * A black story band (after Pitaka's "For a lighter future"): a large title with a
 * lavender arrow linking on, a short line under it, and up to two tall videos from
 * Admin → Homepage images ("Story videos"). Hidden until a video is uploaded.
 */
export function StoryVideos({ title, text, href }) {
  const first = useHomepageImage('story_video_1');
  const second = useHomepageImage('story_video_2');
  const videos = [first, second].filter((v) => v.src);
  if (videos.length === 0) return null;

  return (
    <section className="bg-black text-white py-10 md:py-16">
      <Container wide className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-7 md:gap-10">
        <div>
          <Link href={href} className="group inline-block">
            <h2 className={`${headingFont} text-[28px] md:text-[44px] font-medium uppercase leading-[1.1] text-balance`}>
              {title}
              <svg width="18" height="30" viewBox="0 0 12 20" fill="none" stroke={LAVENDER} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="inline-block ml-3 -mt-1.5 md:-mt-2 align-middle transition-transform group-hover:translate-x-1">
                <path d="M2 2l8 8-8 8" />
              </svg>
            </h2>
          </Link>
          {text && <p className="mt-5 max-w-[34ch] text-[14px] md:text-[15px] leading-relaxed text-white/80">{text}</p>}
        </div>
        <div className={`grid gap-2 md:gap-4 ${videos.length > 1 ? 'grid-cols-2' : 'grid-cols-1 md:max-w-[50%]'}`}>
          {videos.map((v, i) => <VideoTile key={i} src={v.src} alt={v.alt} />)}
        </div>
      </Container>
    </section>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel.tsx';

const LAVENDER = 'rgb(147,104,236)';

function PostTile({ post, i, sizes }) {
  return (
    <a
      href={post.instagram_url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-square rounded-xl overflow-hidden bg-gray-100"
    >
      <Image
        src={post.image_url}
        alt={post.caption || `Post ${i + 1}`}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
        sizes={sizes}
      />
      {/* Like count on first tile */}
      {i === 0 && post.likes && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/40 rounded-md px-1.5 py-0.5">
          <Heart size={10} className="text-white fill-white" />
          <span className="text-[10px] font-medium text-white">{Number(post.likes).toLocaleString()}</span>
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </a>
  );
}

export const SocialFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/social-posts');
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (error) {
        console.error('Failed to fetch social posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="py-4 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-row items-end justify-between gap-4 mb-4">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400">@nayalumiere</p>
            <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight">Follow the glow</h2>
          </div>
          <Link
            href="https://instagram.com/nayalumiere"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm font-medium transition-colors whitespace-nowrap"
            style={{ color: LAVENDER }}
          >
            Follow on Instagram →
          </Link>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && posts.length > 0 && (
          <>
            {/* Mobile: carousel */}
            <div className="md:hidden">
              <Carousel opts={{ align: 'start', loop: false }} className="w-full">
                <CarouselContent className="-ml-2">
                  {posts.map((post, i) => (
                    <CarouselItem key={post.id} className="pl-2 basis-[30%]">
                      <PostTile post={post} i={i} sizes="30vw" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>

            {/* Desktop: fixed grid */}
            <div className="hidden md:grid md:grid-cols-6 gap-3">
              {posts.slice(0, 6).map((post, i) => (
                <PostTile key={post.id} post={post} i={i} sizes="17vw" />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

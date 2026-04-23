'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Youtube, Facebook, ArrowRight, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

  // Don't render the section if there are no posts and we're done loading
  if (!loading && posts.length === 0) return null;

  return (
    <section className="py-10 relative overflow-hidden bg-transparent">
      {/* ── Background Atmosphere ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="cl-aura cl-aura-purple opacity-10 top-0 left-1/4 w-[600px] h-[600px] blur-[140px]" />
        <div className="cl-aura cl-aura-rose opacity-10 bottom-0 right-1/4 w-[500px] h-[500px] blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px" style={{ background: 'linear-gradient(90deg, rgb(196,167,254), rgb(216,180,254))' }}></span>
              <span className="text-[10px] md:text-[12px] font-black tracking-widest uppercase text-[#9333ea]">Our Community</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif italic text-cl-deep leading-tight">
              As Seen On{' '}
              <span
                className="font-sans not-italic font-black"
                style={{ backgroundImage: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
              >
                Social
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-6 pb-2">
            {[
              { icon: <Instagram size={20} />, label: 'Instagram', href: '#' },
              { icon: <Youtube size={20} />, label: 'Youtube', href: '#' },
              { icon: <Facebook size={20} />, label: 'Facebook', href: '#' }
            ].map((social, i) => (
              <motion.a
                key={i}
                href={social.href}
                whileHover={{ y: -5 }}
                className="w-12 h-12 rounded-full bg-[#fdf8ff] border border-[#f3e8ff] flex items-center justify-center text-[#9333ea] hover:bg-[#9333ea] hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl"
              >
                {social.icon}
              </motion.a>
            ))}
          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square rounded-[2rem] bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* ── Grid of Posts ── */}
        {!loading && posts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative aspect-square rounded-[2rem] overflow-hidden bg-gray-100 shadow-sm"
              >
                <Image
                  src={post.image_url}
                  alt={post.caption || `Social post ${post.id}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-[#9333ea]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                  {post.instagram_url ? (
                    <a
                      href={post.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/90 p-3 rounded-2xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
                    >
                      <div className="flex items-center gap-2">
                        <Instagram size={14} className="text-[#9333ea]" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-900">{post.likes || '0'}</span>
                      </div>
                    </a>
                  ) : (
                    <div className="bg-white/90 p-3 rounded-2xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex items-center gap-2">
                        <Heart size={14} className="text-[#9333ea] fill-[#9333ea]" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-900">{post.likes || '0'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── CTA ── */}
        <div className="mt-16 text-center">
          <Link
            href="#"
            className="bg-transparent border-2 border-[#c4b5fd] text-[#a78bfa] hover:bg-[#f5f3ff] hover:border-[#a78bfa] hover:text-[#7e22ce] shadow-sm px-4 py-2.5 md:px-8 md:py-3.5 text-[11px] md:text-[13px] font-black tracking-tight rounded-full transition-all duration-300 inline-flex items-center gap-2 md:gap-3 group shrink-0"
          >
            Join the Community
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

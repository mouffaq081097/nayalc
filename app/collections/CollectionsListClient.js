"use client";
import { useState, useEffect } from 'react';
import CollectionsGrid from '../components/CollectionsGrid';

function CollectionCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-2/3 bg-gray-100 rounded" />
        <div className="h-3 w-1/3 bg-gray-100 rounded" />
        <div className="h-10 w-full bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

export default function CollectionsListClient() {
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch collections');
        }
        const data = await response.json();
        setCollections(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return (
    <div className="bg-white min-h-screen text-gray-900">
      {/* Header */}
      <div className="max-w-[1320px] mx-auto px-5 md:px-8 pt-10 md:pt-14 pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Shop by</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-3">Collections</h1>
        <p className="text-[14px] text-gray-500 max-w-xl leading-relaxed">
          Browse our collections, each curated around a skincare need or ritual.
        </p>
      </div>

      {/* Count */}
      <div className="max-w-[1320px] mx-auto px-5 md:px-8 pb-5 border-b border-gray-100">
        <p className="text-[12px] text-gray-500">
          <span className="font-semibold text-gray-900">{collections.length}</span>{' '}
          {collections.length === 1 ? 'collection' : 'collections'}
        </p>
      </div>

      {isLoading ? (
        <div className="max-w-[1320px] mx-auto px-5 md:px-8 py-8 md:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <CollectionCardSkeleton key={i} />)}
          </div>
        </div>
      ) : collections.length === 0 ? (
        <div className="max-w-[1320px] mx-auto px-5 md:px-8 py-20 text-center text-sm text-gray-400">
          No collections available right now.
        </div>
      ) : (
        <CollectionsGrid collections={collections} />
      )}
    </div>
  );
}

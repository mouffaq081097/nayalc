import React from 'react';
import { Gift, Sparkles } from 'lucide-react';

export default function GiftSetsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 text-gray-800 p-4">
      <div className="text-center bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-2xl mx-auto transform hover:scale-105 transition-transform duration-300">
        <Gift className="w-24 h-24 text-purple-500 mx-auto mb-6 animate-bounce" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-4">
          Hold Your Horses! 🐎
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-6 leading-relaxed">
          Our elves are currently working their magic to assemble the most enchanting gift sets just for you! ✨
          We&apos;re adding extra sparkle, a dash of delight, and a whole lot of love.
        </p>
        <p className="text-md md:text-lg text-gray-600 mb-8">
          Think of it as a surprise party, but for your shopping cart! 🎉
          Check back soon for gifts that will make hearts flutter and smiles bloom.
        </p>
        <div className="flex items-center justify-center text-purple-500 font-semibold text-lg">
          <Sparkles className="w-6 h-6 mr-2 animate-spin-slow" />
          Good things come to those who wait... and we promise, these will be *really* good!
          <Sparkles className="w-6 h-6 ml-2 animate-spin-slow" />
        </div>
      </div>
    </div>
  );
}

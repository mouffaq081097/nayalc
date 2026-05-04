import React from 'react';
import ComingSoonSection from '../components/ComingSoonSection';

export const metadata = {
  robots: { index: false, follow: false },
};

const BlogPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Blog</h1>
      <ComingSoonSection />
    </div>
  );
};

export default BlogPage;

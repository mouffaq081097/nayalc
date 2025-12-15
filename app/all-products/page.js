import { Suspense } from 'react';
import AllProducts from './AllProducts.js';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AllProducts />
    </Suspense>
  );
}
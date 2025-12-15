import { Suspense } from 'react';
import OrderConfirmation from './OrderConfirmation.js';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderConfirmation />
    </Suspense>
  );
}
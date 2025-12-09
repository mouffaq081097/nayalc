'use client';

import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { X, Trash2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback'; // Import ImageWithFallback
import Link from 'next/link';

export default function SideCart() {
  const { isCartOpen, closeCart, cartItems, removeFromCart, updateQuantity } = useCart();

  // Conditionally render the entire component based on isCartOpen
  if (!isCartOpen) {
    return null;
  }

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-51 pointer-events-auto" // Always auto when rendered, overlay will handle click to close
      onClick={closeCart} // Clicking outside the cart closes it
    >
      {/* Semi-transparent Overlay */}
      <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }} />

      {/* Cart Panel - Slides in from right */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-lg flex flex-col transform transition-transform duration-300 translate-x-0"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the cart from closing the overlay
      >
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Your Cart</h2>
          <Button variant="ghost" size="sm" onClick={closeCart}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg font-semibold">Your cart is empty.</p>
              <p className="mt-2 text-sm text-gray-500">Looks like you haven't added anything yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {cartItems.map((item) => (
                <li key={item.id} className="py-4 flex">
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 flex items-center justify-center">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain object-center"
                    />
                  </div>
                  <div className="ml-4 flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <h3>
                          <Link href={`/product/${item.id}`}>{item.name}</Link>
                        </h3>
                        <p className="ml-4">AED {item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <div className="flex items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </Button>
                        <span className="mx-2">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      <div className="flex">
                        <Button
                          variant="ghost"
                          className="font-medium text-red-600 hover:text-red-500"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex justify-between text-base font-medium text-gray-900">
              <p>Subtotal</p>
              <p>AED {subtotal.toFixed(2)}</p>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
            <div className="mt-6">
              <Link
                href="/checkout"
                className="flex items-center justify-center rounded-md border border-transparent bg-[var(--brand-pink)] px-6 py-3 text-base font-medium text-white shadow-sm hover:opacity-90"
                onClick={closeCart}
              >
                Checkout
              </Link>
            </div>
            <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
              <p>
                or{' '}
                <Button
                  variant="link"
                  className="font-medium text-[var(--brand-pink)] hover:opacity-90"
                  onClick={closeCart}
                >
                  Continue Shopping<span aria-hidden="true"> &rarr;</span>
                </Button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

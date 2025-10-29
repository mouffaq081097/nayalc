import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function convertToAED(usdAmount, rate = 3.67) {
  return (usdAmount * rate).toFixed(2);
}

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const formatPrice = (price) => {
    return new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED',
    }).format(price);
};

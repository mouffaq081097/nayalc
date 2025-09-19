export const formatPrice = (price) => {
    return new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED',
    }).format(price);
};
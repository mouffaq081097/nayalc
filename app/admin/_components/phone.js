// Local UAE numbers (05x…) need the 971 country code for tel: and WhatsApp links
export const internationalPhone = (phone) => {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `971${digits.slice(1)}`;
  return digits;
};

import { formatPhone, isValidPhone } from '@/lib/phone';

/**
 * Reading an address record, in one place.
 *
 * The addresses API returns camelCase (`addressLine1`, `isDefault`), the
 * database columns are snake_case, and the address form emits a third mix.
 * Pages that reached for the wrong one silently rendered nothing — the list
 * page asked for `address_line1` and `is_primary`, so it showed neither the
 * street nor which address was actually in use. Everything now reads through
 * here and accepts either spelling.
 */

export function addressLabel(a = {}) {
  return a.addressLabel || a.address_label || 'Address';
}

export function isDefaultAddress(a = {}) {
  return Boolean(a.isDefault ?? a.is_default);
}

export function canDeleteAddress(a = {}) {
  // The API computes this from whether any order references the address.
  // Undefined means we were not told, so assume it is removable and let the
  // server decide.
  return a.isDeletable ?? a.is_deletable ?? true;
}

export function addressPhone(a = {}) {
  return a.customerPhone || a.customer_phone || null;
}

/** True when the saved number cannot be called — legacy rows, usually short. */
export function addressPhoneNeedsFixing(a = {}) {
  const phone = addressPhone(a);
  return Boolean(phone) && !isValidPhone(phone, { requireMobile: false });
}

export function formattedAddressPhone(a = {}) {
  const phone = addressPhone(a);
  return phone ? formatPhone(phone) : null;
}

/**
 * The address split into the fields the customer actually filled in, so a
 * layout can label them separately. Without this, "Sharjah, Sharjah" gives no
 * clue which half is the community and which is the emirate.
 *
 * The country is dropped when it is the UAE — the store ships nowhere else, so
 * repeating it is noise.
 */
export function addressParts(a = {}) {
  return {
    street: [
      a.addressLine1 || a.address_line1 || a.shippingAddress || a.shipping_address,
      a.addressLine2 || a.address_line2,
    ].filter(Boolean).join(', ') || null,
    area: a.state || null,
    emirate: a.city || null,
    country: a.country && !/united arab emirates|^uae$/i.test(a.country.trim())
      ? a.country
      : null,
  };
}

/**
 * The address the way a customer would write it: street, then area and
 * emirate. Used where there is only room for a block of text.
 */
export function addressLines(a = {}) {
  const { street, area, emirate, country } = addressParts(a);
  const areaLine = [area, emirate].filter(Boolean).join(', ');

  // When an address is saved without a label, the context falls back to using
  // the street as the label — so printing both repeats the same line twice.
  const label = addressLabel(a).trim().toLowerCase();

  return [street, areaLine, country]
    .filter(Boolean)
    .filter(line => line.trim().toLowerCase() !== label);
}

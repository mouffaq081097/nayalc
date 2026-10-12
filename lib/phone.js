/**
 * One source of truth for phone numbers, everywhere in the app.
 *
 * The store ships inside the UAE only (the emirate dropdown and the shipping
 * rules both assume it), so this is a UAE numbering-plan parser rather than a
 * general international one. It is dependency-free and isomorphic: the same
 * functions run in the browser inputs, in the API routes, in the email
 * templates and in the backfill script, so a number can only ever be stored
 * in one shape.
 *
 * Canonical storage shape is E.164: "+971501234567". Nothing else goes in the
 * database. Display formatting happens at render time, never at write time.
 *
 * "Verification" here is offline structural verification, which costs nothing
 * and catches the failures we actually see:
 *   - the trunk zero kept after the country code  (+9710501234567)
 *   - the country code typed twice               (+971971501234567)
 *   - Arabic-Indic digits from an Arabic keyboard (٠٥٠١٢٣٤٥٦٧)
 *   - a number short by a digit because a paste was rejected mid-way
 *   - a prefix no UAE operator has been assigned  (051, 053, 057)
 * It cannot prove the customer holds the SIM — only an OTP does that.
 */

// Assigned UAE mobile prefixes, as the two digits following the country code.
// 051, 053 and 057 are deliberately absent: the TDRA has not allocated them,
// so a number using one is a typo, not a customer.
const MOBILE_PREFIXES = ['50', '52', '54', '55', '56', '58'];

// MVNOs (Virgin Mobile) resell inside the du and Etisalat ranges, so carrier is
// a hint for support staff — never a validation rule.
const CARRIERS = {
  50: 'Etisalat', 54: 'Etisalat', 56: 'Etisalat',
  52: 'du', 55: 'du', 58: 'du',
};

// Landline area codes. Eight digits in total, including the area code.
const LANDLINE_AREAS = {
  2: 'Abu Dhabi', 3: 'Al Ain', 4: 'Dubai',
  6: 'Sharjah / Ajman / Umm Al Quwain', 7: 'Ras Al Khaimah', 9: 'Fujairah',
};

export const COUNTRY_CODE = '971';
export const DIAL_CODE = '+971';
export const MOBILE_NSN_LENGTH = 9;   // 5X XXX XXXX
export const LANDLINE_NSN_LENGTH = 8; // X XXX XXXX

/**
 * Arabic-Indic (٠-٩) and Eastern Arabic-Indic (۰-۹) digits are what an Arabic
 * keyboard produces. They look like numbers to the customer and like nothing
 * at all to /\d/, which is one way a number reaches us half empty.
 */
export function toLatinDigits(input) {
  return String(input ?? '').replace(/[٠-٩۰-۹]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}

/** Everything that is not a digit is noise: spaces, dashes, brackets, "tel:". */
function digitsOnly(input) {
  return toLatinDigits(input).replace(/\D/g, '');
}

/**
 * Every plausible national significant number hiding inside the typed digits,
 * most literal first. Stripping prefixes unconditionally is what breaks
 * Fujairah landlines (97123456 genuinely starts with "971"), so we generate
 * candidates instead and let the validator pick the first real one.
 */
function nsnCandidates(digits) {
  const seen = new Set();
  const out = [];
  const push = (v) => {
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  };

  push(digits);

  let trimmed = digits;
  while (trimmed.startsWith('00')) {
    trimmed = trimmed.slice(2);
    push(trimmed);
  }
  while (trimmed.startsWith(COUNTRY_CODE)) {
    trimmed = trimmed.slice(3);
    push(trimmed);
  }

  // A trunk zero can survive in front of any of the above: "+971 050 ...".
  for (const candidate of [...out]) {
    let z = candidate;
    while (z.startsWith('0')) {
      z = z.slice(1);
      push(z);
    }
  }
  return out;
}

function classify(nsn) {
  if (/^5\d{8}$/.test(nsn)) {
    const prefix = nsn.slice(0, 2);
    if (!MOBILE_PREFIXES.includes(prefix)) return null;
    return { type: 'mobile', carrier: CARRIERS[prefix] || null, region: null };
  }
  if (/^[234679]\d{7}$/.test(nsn)) {
    return { type: 'landline', carrier: null, region: LANDLINE_AREAS[nsn[0]] || null };
  }
  return null;
}

/** "+971 50 123 4567" for mobiles, "+971 4 123 4567" for landlines. */
function toDisplay(nsn, type) {
  if (type === 'mobile') {
    return `${DIAL_CODE} ${nsn.slice(0, 2)} ${nsn.slice(2, 5)} ${nsn.slice(5)}`;
  }
  return `${DIAL_CODE} ${nsn.slice(0, 1)} ${nsn.slice(1, 4)} ${nsn.slice(4)}`;
}

/**
 * Why the number failed, phrased for the customer rather than for us. Worked
 * out from the fully stripped candidate, which is the part they meant to type.
 */
function explain(nsn, requireMobile, { digits = '', hadPlus = false } = {}) {
  // "+971" on its own is the empty field, not a three-digit number: the input
  // emits the dial code even when nothing has been typed after it.
  if (!nsn || digits === COUNTRY_CODE) return 'Phone number is required';

  // An explicit foreign country code is a different problem from a typo.
  if (hadPlus && !digits.startsWith(COUNTRY_CODE) && !digits.startsWith('0')) {
    return 'We deliver inside the UAE only — please enter a UAE mobile number';
  }

  if (classify(nsn)?.type === 'landline' && requireMobile) {
    return 'Please enter a mobile number — the courier sends delivery updates by SMS';
  }
  if (nsn.length < MOBILE_NSN_LENGTH) {
    const n = nsn.length;
    return `That is only ${n} digit${n === 1 ? '' : 's'} — a UAE mobile has 9, for example 50 123 4567`;
  }
  if (nsn.length > MOBILE_NSN_LENGTH) {
    return 'That is a few digits too long — enter the number without the country code, for example 50 123 4567';
  }
  if (nsn.startsWith('5')) {
    return `${nsn.slice(0, 2)} is not a UAE mobile prefix — use 50, 52, 54, 55, 56 or 58`;
  }
  return 'UAE mobile numbers start with 5, for example 50 123 4567';
}

/**
 * Parse anything a customer might type into the one canonical shape.
 *
 * @param {string} input raw user or database value
 * @param {object} [options]
 * @param {boolean} [options.requireMobile=true] landlines are rejected by
 *   default: a delivery contact that cannot take an SMS or a WhatsApp message
 *   is the same as no contact at all.
 * @returns {{
 *   ok: boolean, e164: string|null, nsn: string|null, national: string|null,
 *   display: string|null, whatsapp: string|null, tel: string|null,
 *   type: 'mobile'|'landline'|null, carrier: string|null, region: string|null,
 *   reason: string|null, input: string
 * }}
 */
export function parsePhone(input, options = {}) {
  const { requireMobile = true } = options;
  const raw = String(input ?? '').trim();
  const digits = digitsOnly(raw);

  const fail = (reason) => ({
    ok: false, e164: null, nsn: null, national: null, display: null,
    whatsapp: null, tel: null, type: null, carrier: null, region: null,
    reason, input: raw,
  });

  if (!digits) return fail('Phone number is required');

  const candidates = nsnCandidates(digits);
  for (const nsn of candidates) {
    const kind = classify(nsn);
    if (!kind) continue;
    if (requireMobile && kind.type !== 'mobile') continue;

    const e164 = `${DIAL_CODE}${nsn}`;
    return {
      ok: true,
      e164,
      nsn,
      national: `0${nsn}`,
      display: toDisplay(nsn, kind.type),
      whatsapp: `${COUNTRY_CODE}${nsn}`,
      tel: e164,
      type: kind.type,
      carrier: kind.carrier,
      region: kind.region,
      reason: null,
      input: raw,
    };
  }

  return fail(explain(candidates[candidates.length - 1] || digits, requireMobile, {
    digits,
    hadPlus: raw.trimStart().startsWith('+'),
  }));
}

/** True when the value is a usable UAE number. */
export function isValidPhone(input, options) {
  return parsePhone(input, options).ok;
}

/**
 * The value to store. Null when the input cannot be understood, so a caller
 * that forgets to check still writes NULL rather than junk.
 */
export function toE164(input, options) {
  return parsePhone(input, options).e164;
}

/**
 * The value to show. Legacy rows written before this module are returned as
 * they were stored rather than blanked — an admin still needs to read them.
 */
export function formatPhone(input, { fallback = '' } = {}) {
  const parsed = parsePhone(input, { requireMobile: false });
  if (parsed.ok) return parsed.display;
  return String(input ?? '').trim() || fallback;
}

/** Digits only, no plus — the shape wa.me expects. Null when unusable. */
export function toWhatsApp(input) {
  return parsePhone(input, { requireMobile: false }).whatsapp;
}

/** Ready for href="tel:…". Null when unusable. */
export function toTel(input) {
  return parsePhone(input, { requireMobile: false }).tel;
}

/**
 * Is this still on its way to being valid? Used while the customer types, so
 * we stay quiet until they have either finished or clearly gone wrong.
 */
export function isPartialPhone(input) {
  const digits = digitsOnly(input);
  if (!digits) return true;
  const nsn = nsnCandidates(digits).pop() || digits;
  if (nsn.length >= MOBILE_NSN_LENGTH) return false;
  return nsn[0] === '5';
}

/**
 * What the customer sees in the box as they type: the national significant
 * number, grouped. Never adds the country code — the field shows that
 * separately — and never reorders or invents digits.
 */
export function formatAsYouType(input) {
  const nsn = toNsn(input);
  if (nsn.length <= 2) return nsn;
  if (nsn.length <= 5) return `${nsn.slice(0, 2)} ${nsn.slice(2)}`;
  return `${nsn.slice(0, 2)} ${nsn.slice(2, 5)} ${nsn.slice(5)}`;
}

/** The bare national significant number, for input-box state. */
export function toNsn(input) {
  const digits = digitsOnly(input);
  return (nsnCandidates(digits).pop() || '').slice(0, MOBILE_NSN_LENGTH);
}

export { MOBILE_PREFIXES, CARRIERS, LANDLINE_AREAS };

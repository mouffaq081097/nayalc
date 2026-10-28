/**
 * The storefront's two languages. English text is the key: components write
 * t('Add to bag') and the Arabic dictionary (lib/i18n/ar.js) maps it, falling
 * back to the English when a string isn't translated yet. `{name}` placeholders
 * are filled from `vars`.
 *
 * The language lives in a cookie (LOCALE_COOKIE) and is applied in the browser,
 * so every page stays static for English visitors: LOCALE_SCRIPT (in <head>)
 * sets <html lang="ar" dir="rtl"> before the first paint and shows a blank
 * splash, then <LocaleProvider> loads the dictionary and renders the page in
 * Arabic. Server components render English only; client components translate.
 * Product names and descriptions stay as entered in the admin.
 */

export const LOCALES = ['en', 'ar'];
export const DEFAULT_LOCALE = 'en';
export const LOCALE_COOKIE = 'nl_lang';

export const isLocale = (value) => LOCALES.includes(value);
export const dirFor = (locale) => (locale === 'ar' ? 'rtl' : 'ltr');

/**
 * Runs in <head> before anything paints. For Arabic visitors it flips the page
 * to right-to-left and shows the splash (globals.css `.i18n-splash`) until the
 * Arabic text is in; the splash also lifts itself after a few seconds. The
 * admin stays in English.
 */
export const LOCALE_SCRIPT = `(function(){try{if(/(?:^|;\\s*)${LOCALE_COOKIE}=ar(?:;|$)/.test(document.cookie)&&!/^\\/admin(\\/|$)/.test(location.pathname)){var d=document.documentElement;d.lang='ar';d.dir='rtl';d.classList.add('i18n-pending');}}catch(e){}})();`;

/** The admin is English only, whatever the visitor chose for the shop. */
export const isEnglishOnlyArea = (pathname = '') => /^\/admin(\/|$)/.test(pathname);

// Storefront pages translated so far. Elsewhere an Arabic visitor keeps the
// Arabic header and footer, and the page itself shows in English, left to
// right (LocaleScope). Add a page here once its text goes through t().
const TRANSLATED_PAGES = [
  /^\/(index)?$/,
  /^\/product\//,
  /^\/(all-products|search|cart|checkout|tabby-return|auth|SkinCare|fragrance|new-arrivals|brands|collections)$/,
  /^\/(order-confirmed|brand|collections)\//,
];
export const isTranslatedPage = (pathname = '') => TRANSLATED_PAGES.some((page) => page.test(pathname));

let arabicPlurals;
// Arabic nouns change with the number (one, two, 3–10, 11–99…): Intl knows the rules
function pluralForm(forms, count) {
  const n = Number(String(count ?? '').replace(/,/g, ''));
  if (!Number.isFinite(n)) return forms.other;
  arabicPlurals ||= new Intl.PluralRules('ar');
  return forms[arabicPlurals.select(n)] ?? forms.other;
}

/**
 * `messages` is the dictionary for the current language (null for English).
 * A dictionary entry can be a set of plural forms ({ one, two, few, many,
 * other }), picked by `vars.n`. Anything that isn't a string (a React element,
 * a number) passes through, so components can translate props that may be either.
 */
export function translate(messages, text, vars) {
  if (typeof text !== 'string') return text;
  let out = messages?.[text];
  if (out && typeof out === 'object') out = pluralForm(out, vars?.n);
  out ||= text;
  if (vars) out = out.replace(/\{(\w+)\}/g, (match, key) => (vars[key] ?? match));
  return out;
}

const AR_DATE_WORDS = {
  Sun: 'الأحد', Mon: 'الاثنين', Tue: 'الثلاثاء', Wed: 'الأربعاء', Thu: 'الخميس', Fri: 'الجمعة', Sat: 'السبت',
  Jan: 'يناير', Feb: 'فبراير', Mar: 'مارس', Apr: 'أبريل', May: 'مايو', Jun: 'يونيو',
  Jul: 'يوليو', Aug: 'أغسطس', Sep: 'سبتمبر', Oct: 'أكتوبر', Nov: 'نوفمبر', Dec: 'ديسمبر',
};

/** Day and month names inside English date labels ("Tue 13 – Thu 15 Oct", "12 Oct 2026"). */
export function localizeDate(label, locale) {
  if (locale !== 'ar' || typeof label !== 'string') return label;
  return label.replace(/\b(Sun|Mon|Tue|Wed|Thu|Fri|Sat|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (word) => AR_DATE_WORDS[word]);
}

'use client';

import { Fragment, createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DEFAULT_LOCALE, LOCALE_COOKIE, dirFor, isEnglishOnlyArea, isTranslatedPage, localizeDate, translate } from '@/lib/i18n';

const wantsArabic = () => new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=ar(?:;|$)`).test(document.cookie);

// The Arabic dictionary, downloaded only for visitors who chose Arabic. When
// LOCALE_SCRIPT has already marked <html lang="ar">, the download starts as
// soon as this module runs, alongside hydration.
let arabicMessages = null;
const loadArabic = () => (arabicMessages ||= import('@/lib/i18n/ar').then((module) => module.default));
if (typeof document !== 'undefined' && document.documentElement.lang === 'ar') loadArabic();

/**
 * t() for text with elements in it: rich('Use code {code} at checkout', { code: <b>WELCOME10</b> }).
 * Placeholders may be strings or React elements, and may move in the translation.
 */
function richText(messages, text, parts) {
  return translate(messages, text).split(/\{(\w+)\}/g).map((piece, i) => (
    <Fragment key={i}>{i % 2 ? (parts[piece] ?? `{${piece}}`) : piece}</Fragment>
  ));
}

const englishT = (text, vars) => translate(null, text, vars);
const englishRich = (text, parts) => richText(null, text, parts);
const sameDate = (label) => label;

const LocaleContext = createContext({
  locale: DEFAULT_LOCALE,
  dir: 'ltr',
  t: englishT,
  rich: englishRich,
  date: sameDate,
  setLocale: () => {},
});

/**
 * The visitor's language (lib/i18n). Pages are served in English, so the
 * first render matches the HTML; Arabic follows once the dictionary is in, and
 * the splash lifts in the same frame. The admin always stays in English.
 */
export function LocaleProvider({ children }) {
  const pathname = usePathname();
  const englishArea = isEnglishOnlyArea(pathname);
  const [messages, setMessages] = useState(null);
  const locale = messages && !englishArea ? 'ar' : DEFAULT_LOCALE;

  // Load Arabic for a visitor who chose it (also after arriving through the admin)
  useEffect(() => {
    if (messages || englishArea || !wantsArabic()) return undefined;
    let alive = true;
    loadArabic()
      .then((dictionary) => { if (alive) setMessages(dictionary); })
      .catch(() => {
        // Couldn't load the Arabic text: carry on in English
        const root = document.documentElement;
        root.lang = 'en';
        root.dir = 'ltr';
        root.classList.remove('i18n-pending');
      });
    return () => { alive = false; };
  }, [messages, englishArea]);

  // <html lang dir> follow the language as the visitor moves between the shop and the admin.
  // While the Arabic text is still loading, the head script's settings and splash stay.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (locale === 'ar' || englishArea || !wantsArabic()) {
      root.lang = locale;
      root.dir = dirFor(locale);
      root.classList.remove('i18n-pending');
    }
  }, [locale, englishArea]);

  const t = useCallback((text, vars) => translate(locale === 'ar' ? messages : null, text, vars), [locale, messages]);
  const rich = useCallback((text, parts) => richText(locale === 'ar' ? messages : null, text, parts), [locale, messages]);
  const date = useCallback((label) => localizeDate(label, locale), [locale]);
  const setLocale = useCallback((next) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    // Reload so everything, Stripe and Tabby included, starts in the new language
    window.location.reload();
  }, []);

  const value = useMemo(() => ({ locale, dir: dirFor(locale), t, rich, date, setLocale }), [locale, t, rich, date, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Wraps each page (LayoutContent). A page not translated yet (lib/i18n
 * isTranslatedPage) shows in English, left to right, inside the Arabic header
 * and footer, rather than as English text mirrored right to left. Always
 * rendered, so the page isn't remounted when the language arrives.
 */
export function LocaleScope({ pathname, children }) {
  const outer = useContext(LocaleContext);
  const english = outer.locale !== DEFAULT_LOCALE && !isTranslatedPage(pathname);
  const value = useMemo(
    () => (english ? { ...outer, locale: DEFAULT_LOCALE, dir: 'ltr', t: englishT, rich: englishRich, date: sameDate } : outer),
    [english, outer],
  );
  return (
    <div className="contents" lang={english ? 'en' : undefined} dir={english ? 'ltr' : undefined}>
      <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
    </div>
  );
}

export const useLocale = () => useContext(LocaleContext);
/** Shorthand: const t = useT(); t('Add to bag') */
export const useT = () => useContext(LocaleContext).t;

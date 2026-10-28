'use client';

import { useLocale } from '../context/LocaleContext';

/**
 * English ⇄ العربية, each named in its own language. Sets the language cookie
 * and reloads, so the page comes back in the other language (lib/i18n).
 */
export default function LanguageSwitch({ className = '' }) {
  const { locale, setLocale } = useLocale();
  const next = locale === 'ar' ? 'en' : 'ar';
  return (
    <button type="button" onClick={() => setLocale(next)} lang={next} className={className}>
      {next === 'ar' ? 'العربية' : 'English'}
    </button>
  );
}

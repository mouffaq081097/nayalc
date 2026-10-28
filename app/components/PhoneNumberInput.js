'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import { formatAsYouType, parsePhone, toNsn, DIAL_CODE, MOBILE_NSN_LENGTH } from '@/lib/phone';
import { useT } from '../context/LocaleContext';

// lib/phone's reasons, in the visitor's language; two of them carry the digits typed
function translateReason(t, reason) {
  if (!reason) return reason;
  const short = reason.match(/^That is only (\d+) digits?/);
  if (short) return t(Number(short[1]) === 1 ? 'That is only {n} digit — a UAE mobile has 9, for example 50 123 4567' : 'That is only {n} digits — a UAE mobile has 9, for example 50 123 4567', { n: short[1] });
  const prefix = reason.match(/^(\d+) is not a UAE mobile prefix/);
  if (prefix) return t('{prefix} is not a UAE mobile prefix — use 50, 52, 54, 55, 56 or 58', { prefix: prefix[1] });
  return t(reason);
}

/**
 * UAE mobile entry. The country code is fixed and shown outside the field, so
 * the customer only ever types the nine national digits.
 *
 * The old version rejected any keystroke that was not a bare digit, which is
 * how numbers arrived wrong: pasting "+971 50 123 4567" or "050 123 4567" was
 * silently dropped, the customer retyped by hand and lost a digit, and a
 * leading zero typed out of habit became +9710501234567. Everything is now
 * normalised through lib/phone instead of rejected, so a paste in any shape
 * lands as the same nine digits.
 */
const PhoneNumberInput = ({
  value,
  onChange,
  onBlur,
  disabled,
  required,
  name = 'customerPhone',
  error,
}) => {
  const t = useT();
  const [nsn, setNsn] = useState(() => toNsn(value));
  const [touched, setTouched] = useState(false);

  // Re-sync when the parent swaps the record underneath us (editing a
  // different address), but not while the customer is mid-keystroke: toNsn of
  // what we last emitted equals what we already hold, so this is a no-op then.
  useEffect(() => {
    const incoming = toNsn(value);
    setNsn((current) => (incoming === current ? current : incoming));
  }, [value]);

  const parsed = useMemo(() => parsePhone(nsn ? DIAL_CODE + nsn : ''), [nsn]);
  const complete = nsn.length === MOBILE_NSN_LENGTH;

  const emit = (nextNsn) => {
    setNsn(nextNsn);
    if (!onChange) return;
    // Empty stays empty rather than becoming a bare "+971": a dial code with no
    // number behind it is truthy, and that is what let blank phones through.
    const next = nextNsn ? parsePhone(DIAL_CODE + nextNsn).e164 || DIAL_CODE + nextNsn : '';
    onChange({ target: { name, value: next } });
  };

  const handleChange = (e) => emit(toNsn(e.target.value));

  const handleBlur = (e) => {
    setTouched(true);
    e.target.style.borderColor = 'rgba(216,180,254,0.45)';
    e.target.style.boxShadow = 'none';
    if (onBlur) onBlur(e);
  };

  // The parent's submit-time error wins; ours fills in while they are typing.
  const ownError = touched && nsn && !parsed.ok ? parsed.reason : null;
  const message = translateReason(t, error || ownError);
  const invalid = Boolean(message);

  const fieldStyle = {
    width: '100%',
    padding: '10px 36px 10px 14px',
    borderRadius: '12px',
    color: '#3b0764',
    fontSize: '13px',
    letterSpacing: '0.04em',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
    border: invalid ? '1px solid rgba(252,165,165,0.9)' : '1px solid rgba(216,180,254,0.45)',
    background: invalid ? 'rgba(255,242,242,0.7)' : 'rgba(255,255,255,0.6)',
  };

  return (
    <div>
      {/* A phone number reads left to right in Arabic too: +971 first */}
      <div dir="ltr" className="flex items-stretch gap-2">
        <div
          className="flex items-center gap-1.5 px-3 shrink-0 select-none"
          style={{
            borderRadius: '12px',
            border: '1px solid rgba(216,180,254,0.45)',
            background: 'rgba(248,240,255,0.8)',
            color: 'rgba(59,7,100,0.7)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <span aria-hidden="true">🇦🇪</span>
          {DIAL_CODE}
        </div>

        <div className="relative flex-1">
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            name={name}
            value={formatAsYouType(nsn)}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="50 123 4567"
            required={required}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            style={fieldStyle}
            onFocus={(e) => {
              e.target.style.borderColor = invalid ? 'rgba(252,165,165,0.9)' : 'rgb(196,167,254)';
              e.target.style.boxShadow = invalid
                ? '0 0 0 3px rgba(252,165,165,0.15)'
                : '0 0 0 3px rgba(196,167,254,0.18)';
            }}
          />

          <AnimatePresence>
            {complete && (
              <motion.span
                key={parsed.ok ? 'valid' : 'invalid'}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              >
                {parsed.ok
                  ? <Check size={15} style={{ color: 'rgb(132,204,22)' }} strokeWidth={3} />
                  : <AlertCircle size={15} style={{ color: 'rgb(220,38,38)' }} />}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {message ? (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-1.5 mt-1.5"
            style={{ color: 'rgb(220,38,38)', fontSize: '11px', fontWeight: 600 }}
          >
            <span className="w-1 h-1 rounded-full bg-red-500 inline-block shrink-0" />
            {message}
          </motion.p>
        ) : parsed.ok ? (
          <motion.p
            key="ok"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mt-1.5"
            style={{ color: 'rgba(59,7,100,0.45)', fontSize: '11px', fontWeight: 500 }}
          >
            {parsed.carrier ? `${parsed.carrier} · ` : ''}{t('We will send delivery updates to this number')}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default PhoneNumberInput;

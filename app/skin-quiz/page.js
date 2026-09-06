'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles, Droplet, Droplets, Sun, Layers, HeartPulse, Clock, ShieldAlert,
  CircleDot, Eye, FlaskConical, Check, ArrowLeft, ArrowRight,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const LAVENDER = 'rgb(147,104,236)';

/* ============================================================================
 * Real-data question set. "Skin concerns" is populated from useAppContext().
 * concerns (the live `concerns` table) rather than a hardcoded list, so the
 * quiz always maps 1:1 to real concern ids the results page can filter on —
 * no fuzzy text matching. "Texture" is limited to the product forms that
 * actually exist in the catalog (Serum / Cream / Lotion).
 * ==========================================================================*/

const SKIN_TYPE_OPTIONS = [
  { value: 'Oily', icon: Droplet, blurb: 'Shine by midday' },
  { value: 'Dry', icon: Sun, blurb: 'Feels tight or flaky' },
  { value: 'Combination', icon: Layers, blurb: 'Oily T-zone, dry elsewhere' },
  { value: 'Normal', icon: Sparkles, blurb: 'Balanced, few concerns' },
  { value: 'Sensitive', icon: HeartPulse, blurb: 'Reacts easily' },
];

const TEXTURE_OPTIONS = [
  { value: 'Serum', icon: FlaskConical, blurb: 'Lightweight, fast-absorbing' },
  { value: 'Cream', icon: CircleDot, blurb: 'Rich and nourishing' },
  { value: 'Lotion', icon: Droplets, blurb: 'Light, everyday hydration' },
];

function concernIcon(name = '') {
  if (/anti[-\s]?aging/i.test(name)) return Clock;
  if (/hydrat/i.test(name)) return Droplets;
  if (/sensitiv|redness/i.test(name)) return ShieldAlert;
  if (/acne|blemish/i.test(name)) return CircleDot;
  if (/oil/i.test(name)) return Droplet;
  if (/dull|radian/i.test(name)) return Sun;
  if (/dark circ|puffi/i.test(name)) return Eye;
  return Sparkles;
}

export default function SkinQuizPage() {
  const { concerns } = useAppContext();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const [step, setStep] = useState(0); // 0 = welcome
  const [skinType, setSkinType] = useState(null);
  const [concernIds, setConcernIds] = useState([]);
  const [texture, setTexture] = useState(null);

  const questions = useMemo(
    () => [
      {
        key: 'skinType',
        title: "What's your skin type?",
        subtitle: 'This helps us narrow down the right formulas for you.',
        multiple: false,
        options: SKIN_TYPE_OPTIONS.map((o) => ({ ...o, id: o.value, label: o.value })),
        value: skinType,
        onPick: (id) => setSkinType(id),
      },
      {
        key: 'concerns',
        title: 'What would you like to improve?',
        subtitle: 'Pick as many as apply — every one shapes your recommendations.',
        multiple: true,
        options: concerns.map((c) => ({ id: c.id, label: c.name, icon: concernIcon(c.name) })),
        value: concernIds,
        onPick: (id) =>
          setConcernIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id])),
      },
      {
        key: 'texture',
        title: 'Any texture you prefer?',
        subtitle: 'We’ll prioritize this feel wherever it fits your concerns.',
        multiple: false,
        options: TEXTURE_OPTIONS.map((o) => ({ ...o, id: o.value, label: o.value })),
        value: texture,
        onPick: (id) => setTexture(id),
      },
    ],
    [concerns, skinType, concernIds, texture]
  );

  const totalSteps = questions.length;
  const activeQuestion = step > 0 ? questions[step - 1] : null;
  const isAnswered = activeQuestion
    ? activeQuestion.multiple
      ? activeQuestion.value.length > 0
      : activeQuestion.value != null
    : true;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      const params = new URLSearchParams();
      if (skinType) params.set('skinType', skinType);
      if (concernIds.length) params.set('concernIds', concernIds.join(','));
      if (texture) params.set('texture', texture);
      router.push(`/skin-quiz/results?${params.toString()}`);
    }
  };

  const slide = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 } };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 py-14">
      <div className="w-full max-w-xl">
        {/* Header, matching the other homepage section headers */}
        <div className="text-center mb-6">
          <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-2">Skin consultation</p>
          <h1 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight">Find your perfect routine</h1>
          <p className="text-[14px] text-gray-500 mt-2 max-w-sm mx-auto">
            Three quick questions — under a minute — matched against real products in our catalog.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-gray-100">
              <motion.div
                className="h-full rounded-full"
                style={{ background: LAVENDER }}
                initial={false}
                animate={{ width: step > i ? '100%' : '0%' }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: 'easeOut' }}
              />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div key="welcome" {...slide} transition={{ duration: prefersReducedMotion ? 0 : 0.25 }} className="text-center py-3">
                <p className="text-[14px] text-gray-500 mb-6 max-w-xs mx-auto">
                  Answer a few questions and we&rsquo;ll recommend real products suited to your skin.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full text-white text-[13px] font-semibold transition-opacity hover:opacity-90"
                  style={{ background: LAVENDER }}
                >
                  Begin consultation
                  <ArrowRight size={15} />
                </button>
              </motion.div>
            ) : (
              <motion.div key={step} {...slide} transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}>
                <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-gray-400 mb-2">
                  Step {step} of {totalSteps}
                </p>
                <h2 className="text-[20px] sm:text-[22px] font-bold text-gray-900 leading-tight mb-1">
                  {activeQuestion.title}
                </h2>
                <p className="text-[13px] text-gray-500 mb-5">{activeQuestion.subtitle}</p>

                {activeQuestion.options.length === 0 ? (
                  <div className="py-10 text-center text-[13px] text-gray-400">Loading options&hellip;</div>
                ) : (
                  <div className={`grid gap-2.5 ${activeQuestion.multiple ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {activeQuestion.options.map((option) => {
                      const isSelected = activeQuestion.multiple
                        ? activeQuestion.value.includes(option.id)
                        : activeQuestion.value === option.id;
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => activeQuestion.onPick(option.id)}
                          className="flex items-center gap-3 text-left p-3.5 rounded-2xl transition-all duration-150 cursor-pointer"
                          style={{
                            border: `1.5px solid ${isSelected ? LAVENDER : '#e5e7eb'}`,
                            background: isSelected ? 'rgba(147,104,236,0.06)' : '#fff',
                          }}
                        >
                          <span
                            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                            style={{
                              background: isSelected ? LAVENDER : '#f3f4f6',
                              color: isSelected ? '#fff' : '#6b7280',
                            }}
                          >
                            {Icon && <Icon size={16} strokeWidth={1.75} />}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[13.5px] font-semibold text-gray-900">{option.label}</span>
                            {option.blurb && <span className="block text-[11px] text-gray-400 mt-0.5">{option.blurb}</span>}
                          </span>
                          <span
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{
                              border: `1.5px solid ${isSelected ? LAVENDER : '#d1d5db'}`,
                              background: isSelected ? LAVENDER : 'transparent',
                            }}
                          >
                            {isSelected && <Check size={11} color="#fff" strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {step > 0 && (
            <div className="mt-7 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full border border-gray-200 text-gray-600 text-[12.5px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!isAnswered}
                className="inline-flex items-center gap-1.5 h-11 px-7 rounded-full text-white text-[12.5px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: LAVENDER }}
              >
                {step === totalSteps ? 'See my results' : 'Next'}
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

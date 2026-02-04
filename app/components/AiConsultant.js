'use client';

import React, { useState } from 'react';
import Modal from './Modal';
import { Sparkles, Loader2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const steps = [
  {
    id: 'skinType',
    question: "What is your skin's character?",
    options: ['Dry', 'Oily', 'Combination', 'Sensitive', 'Normal'],
    description: "Select the profile that best describes your current state."
  },
  {
    id: 'concern',
    question: "What is your primary goal?",
    options: ['Anti-aging', 'Hydration', 'Brightening', 'Acne', 'Texture'],
    description: "Choose the result you wish to prioritize."
  },
  {
    id: 'scentPreference',
    question: "A preferred olfactory path?",
    options: ['Floral', 'Woody', 'Fresh', 'Oriental', 'No Preference'],
    description: "Fragrance is the soul of the ritual."
  },
  {
    id: 'narrative',
    question: "Any specific notes for the curator?",
    isText: true,
    description: "Describe your unique needs or preferences in detail."
  }
];

export default function AiConsultant({ isOpen, onClose }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 for Intro
  const [selections, setSelections] = useState({
    skinType: '',
    concern: '',
    scentPreference: ''
  });
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [suggestedProduct, setSuggestedProduct] = useState(null);
  const router = useRouter();

  const handleSelection = (key, value) => {
    setSelections(prev => ({ ...prev, [key]: value }));
    setTimeout(() => nextStep(), 300); // Auto-advance after selection
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      getSuggestion();
    }
  };

  const prevStep = () => {
    setCurrentStepIndex(prev => prev - 1);
  };

  const getSuggestion = async () => {
    setIsLoading(true);
    setCurrentStepIndex(steps.length); // Processing state
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        body: JSON.stringify({ userInput, selections }),
      });
      const data = await response.json();
      setSuggestion(data);

      if (data.productId) {
        const productRes = await fetch(`/api/products/${data.productId}`);
        const productData = await productRes.json();
        setSuggestedProduct(productData);
      }
    } catch (error) {
      console.error(error);
      setCurrentStepIndex(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setCurrentStepIndex(-1);
    setSelections({ skinType: '', concern: '', scentPreference: '' });
    setUserInput('');
    setSuggestion(null);
    setSuggestedProduct(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="max-w-3xl" noBodyPadding>
      <div className="flex flex-col h-full md:min-h-[600px] bg-white">
        
        {/* Navigation / Progress */}
        <div className="flex items-center justify-between px-6 md:px-10 pt-8 md:pt-10 pb-4">
            {currentStepIndex > -1 && currentStepIndex < steps.length && (
                <button 
                    onClick={prevStep}
                    className="flex items-center gap-2 text-[10px] md:text-[11px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
                >
                    <ChevronLeft size={16} /> Back
                </button>
            )}
            <div className="flex gap-1 mx-auto">
                {steps.map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1 w-6 md:w-8 rounded-full transition-all duration-500 ${i <= currentStepIndex ? 'bg-brand-pink' : 'bg-gray-100'}`}
                    />
                ))}
            </div>
            <div className="w-8 md:w-12"></div> {/* Spacer for symmetry */}
        </div>

        <div className="flex-grow flex flex-col items-center justify-center p-6 md:p-16 text-center">
            <AnimatePresence mode="wait">
                {/* INTRO SCREEN */}
                {currentStepIndex === -1 && (
                    <motion.div 
                        key="intro"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="space-y-10"
                    >
                        <div className="w-24 h-24 rounded-[2rem] bg-gray-50 flex items-center justify-center mx-auto shadow-sm border border-gray-100">
                            <Sparkles size={40} className="text-brand-pink" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f]">
                                Naya <br/> Intelligence.
                            </h2>
                            <p className="text-[#86868b] text-xl font-medium max-w-sm mx-auto">
                                Allow our expert AI to curate your perfect beauty ritual.
                            </p>
                        </div>
                        <button 
                            onClick={() => setCurrentStepIndex(0)}
                            className="px-12 py-5 bg-[#1d1d1f] text-white rounded-full text-[13px] font-bold uppercase tracking-widest hover:bg-brand-pink transition-all shadow-xl active:scale-95"
                        >
                            Start Consultation
                        </button>
                    </motion.div>
                )}

                {/* STEP QUESTIONS */}
                {currentStepIndex >= 0 && currentStepIndex < steps.length && (
                    <motion.div 
                        key={`step-${currentStepIndex}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full max-w-xl space-y-12"
                    >
                        <div className="space-y-3">
                            <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f]">
                                {steps[currentStepIndex].question}
                            </h3>
                            <p className="text-[#86868b] text-lg font-medium">
                                {steps[currentStepIndex].description}
                            </p>
                        </div>

                        {!steps[currentStepIndex].isText ? (
                            <div className="grid grid-cols-1 gap-3">
                                {steps[currentStepIndex].options.map(option => (
                                    <button
                                        key={option}
                                        onClick={() => handleSelection(steps[currentStepIndex].id, option)}
                                        className={`w-full py-6 rounded-2xl text-[15px] font-semibold transition-all border ${
                                            selections[steps[currentStepIndex].id] === option 
                                            ? 'bg-brand-pink border-brand-pink text-white shadow-lg shadow-pink-200' 
                                            : 'bg-gray-50 border-gray-100 text-[#1d1d1f] hover:bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <textarea 
                                    autoFocus
                                    placeholder="Briefly describe your needs..."
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    className="w-full h-48 bg-gray-50 border-none rounded-3xl p-8 text-xl text-[#1d1d1f] placeholder:text-gray-300 focus:ring-0 focus:bg-gray-100 transition-all resize-none italic"
                                />
                                <button 
                                    onClick={nextStep}
                                    className="w-full py-6 bg-[#1d1d1f] text-white rounded-full text-[13px] font-bold uppercase tracking-widest hover:bg-brand-pink transition-all shadow-xl"
                                >
                                    Reveal Selection
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* LOADING STATE */}
                {isLoading && (
                    <motion.div 
                        key="loading"
                        className="space-y-10"
                    >
                        <div className="flex items-center justify-center">
                            <Loader2 className="animate-spin text-brand-pink" size={60} strokeWidth={1} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">Synchronizing.</h3>
                            <p className="text-[#86868b] text-lg font-medium">Evaluating the vault for your perfect match.</p>
                        </div>
                    </motion.div>
                )}

                {/* SUGGESTION REVEAL */}
                {suggestion && !isLoading && (
                    <motion.div 
                        key="reveal"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-2xl space-y-10"
                    >
                        <div className="space-y-4">
                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-pink">The Curator's Choice</span>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] leading-tight px-4">
                                This masterpiece was <br/> curated for you.
                            </h2>
                        </div>

                        {suggestedProduct && (
                            <div className="bg-gray-50 rounded-[3rem] p-10 flex flex-col items-center gap-8 border border-gray-100">
                                <div className="w-56 h-56 relative group">
                                    <div className="absolute inset-0 bg-brand-pink/5 rounded-full blur-3xl group-hover:bg-brand-pink/10 transition-all"></div>
                                    <img 
                                        src={suggestedProduct.images?.[0] || suggestedProduct.imageUrl} 
                                        alt={suggestedProduct.name} 
                                        className="w-full h-full object-contain relative z-10 drop-shadow-2xl transition-transform duration-1000 group-hover:scale-110" 
                                    />
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">{suggestedProduct.name}</h4>
                                    <p className="text-xl font-medium text-brand-pink">AED {suggestedProduct.price}</p>
                                    <div className="max-w-md mx-auto pt-4 border-t border-gray-200 mt-4">
                                        <p className="text-[#86868b] leading-relaxed italic text-lg">
                                            "{suggestion.explanation}"
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 w-full">
                                    <button 
                                        onClick={() => {
                                            router.push(`/product/${suggestedProduct.id}`);
                                            onClose();
                                        }}
                                        className="flex-grow py-5 bg-[#1d1d1f] text-white rounded-full text-[13px] font-bold uppercase tracking-widest hover:bg-brand-pink transition-all shadow-xl"
                                    >
                                        View Product
                                    </button>
                                    <button 
                                        onClick={reset}
                                        className="px-10 py-5 bg-white border border-gray-200 text-[#1d1d1f] rounded-full text-[13px] font-bold uppercase tracking-widest hover:border-brand-pink transition-all"
                                    >
                                        Start Over
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
}
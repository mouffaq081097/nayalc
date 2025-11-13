'use client';
import React, { useState } from 'react';
import { useRouter }from 'next/navigation';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress'; // Assuming you have a Progress component
import { motion, AnimatePresence } from 'framer-motion';

const quizQuestions = [
  {
    question: "What is your skin type?",
    options: ["Oily", "Dry", "Combination", "Normal", "Sensitive"],
    key: "skinType",
    allowMultiple: false,
  },
  {
    question: "What are your main skin concerns?",
    options: ["Acne & Blemishes", "Fine Lines & Wrinkles", "Dryness & Dehydration", "Redness & Irritation", "Dark Spots & Pigmentation", "Dullness"],
    key: "skinConcerns",
    allowMultiple: true,
  },
  {
    question: "What is your preferred product texture?",
    options: ["Lightweight / Gel", "Creamy / Rich", "Lotion", "Oil-based"],
    key: "texturePreference",
    allowMultiple: false,
  },
];

const SkinQuizPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const router = useRouter();

  const handleAnswer = (option) => {
    const currentQuestion = quizQuestions[currentStep];
    setAnswers(prev => {
      if (currentQuestion.allowMultiple) {
        const existingAnswers = prev[currentQuestion.key] || [];
        if (existingAnswers.includes(option)) {
          return { ...prev, [currentQuestion.key]: existingAnswers.filter(a => a !== option) };
        } else {
          return { ...prev, [currentQuestion.key]: [...existingAnswers, option] };
        }
      } else {
        return { ...prev, [currentQuestion.key]: option };
      }
    });
  };

  const handleNext = () => {
    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finish quiz and redirect to results
      const queryString = new URLSearchParams(answers).toString();
      router.push(`/skin-quiz/results?${queryString}`);
    }
  };

  const progress = ((currentStep + 1) / quizQuestions.length) * 100;
  const currentQuestion = quizQuestions[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-rose)] via-white to-[var(--brand-cream)] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif mb-2">
            <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
              Find Your Perfect Skincare
            </span>
          </h1>
          <p className="text-gray-600">Answer a few questions to get personalized recommendations.</p>
        </div>

        <div className="mb-6">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-500 text-center mt-2">Step {currentStep + 1} of {quizQuestions.length}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl text-center font-medium mb-6">{currentQuestion.question}</h2>
            <div className={`grid gap-4 ${currentQuestion.allowMultiple ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {currentQuestion.options.map(option => {
                const isSelected = currentQuestion.allowMultiple
                  ? (answers[currentQuestion.key] || []).includes(option)
                  : answers[currentQuestion.key] === option;
                
                return (
                  <Button
                    key={option}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleAnswer(option)}
                    className={`p-6 text-left justify-start h-auto transition-all duration-200 ${isSelected ? 'bg-[var(--brand-blue)] text-white' : 'bg-white'}`}
                  >
                    {currentQuestion.allowMultiple && (
                      <div className={`w-5 h-5 mr-3 border rounded ${isSelected ? 'bg-white border-white' : 'border-gray-300'}`} />
                    )}
                    <span>{option}</span>
                  </Button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleNext}
            disabled={!answers[currentQuestion.key] || (currentQuestion.allowMultiple && answers[currentQuestion.key].length === 0)}
            className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
          >
            {currentStep === quizQuestions.length - 1 ? 'See My Results' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SkinQuizPage;
